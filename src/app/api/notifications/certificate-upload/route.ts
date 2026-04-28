import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { notifyUser, notifyAdmins } from '@/lib/notifications'
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

function detectCertificateFileKind(certificateUrl: string, filePath?: string | null) {
  const value = `${filePath || ''} ${certificateUrl}`.toLowerCase();
  if (value.includes('.pdf')) return 'pdf';
  if (/\.(png|jpg|jpeg|webp)(\?|$)/i.test(value)) return 'image';
  return 'unknown';
}

function getAdminReviewUrl(req: Request) {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  const baseUrl = configuredBaseUrl || new URL(req.url).origin;
  return `${baseUrl}/dashboard/admin`;
}

async function unlockCandidateReattempt(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { error: candError } = await supabase
    .from('candidates')
    .update({ reattempt_allowed: true })
    .eq('user_id', userId);

  if (candError) {
    console.error('Failed to unlock candidate reattempt:', candError.message);
  }

  const { error: roleError } = await supabase
    .from('profiles')
    .update({
      role: 'candidate_onhold',
      verification_status: 'unverified',
    })
    .eq('id', userId);

  if (roleError) {
    console.error('Failed to keep candidate in reattempt state after certificate approval:', roleError.message);
  }
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

async function loadTemplateBufferFromFile(relativeOrAbsolutePath: string): Promise<Buffer | null> {
  try {
    const templatePath = path.isAbsolute(relativeOrAbsolutePath)
      ? relativeOrAbsolutePath
      : path.join(process.cwd(), relativeOrAbsolutePath)
    return await readFile(templatePath)
  } catch {
    return null
  }
}

async function computeTemplateSimilarity(
  uploadedBuffer: Buffer,
  templateBuffer: Buffer
): Promise<number | null> {
  if (!uploadedBuffer || !templateBuffer) return null

  try {
    const size = 128
    const [uploadedPixels, templatePixels] = await Promise.all([
      sharp(uploadedBuffer)
        .rotate()
        .resize(size, size, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer(),
      sharp(templateBuffer)
        .rotate()
        .resize(size, size, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer(),
    ])

    if (uploadedPixels.length !== templatePixels.length || uploadedPixels.length === 0) {
      return null
    }

    let totalDiff = 0
    for (let i = 0; i < uploadedPixels.length; i += 1) {
      totalDiff += Math.abs(uploadedPixels[i] - templatePixels[i])
    }

    const meanDiff = totalDiff / uploadedPixels.length
    const similarity = 1 - meanDiff / 255
    return Math.max(0, Math.min(1, similarity))
  } catch {
    return null
  }
}

async function normalizeCertificateBufferForSimilarity(
  sourceBuffer: Buffer,
  fileKind: 'pdf' | 'image' | 'unknown'
): Promise<Buffer | null> {
  if (!sourceBuffer) return null

  try {
    if (fileKind === 'pdf') {
      return await renderPdfFirstPageToPngBuffer(sourceBuffer)
    }

    return sourceBuffer
  } catch {
    return null
  }
}

async function renderPdfFirstPageToPngBuffer(sourceBuffer: Buffer): Promise<Buffer | null> {
  try {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
    const { createCanvas } = await import('@napi-rs/canvas')

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(sourceBuffer),
      disableWorker: true,
      isEvalSupported: false,
      useWorkerFetch: false,
    })

    const pdfDocument = await loadingTask.promise
    const page = await pdfDocument.getPage(1)
    const baseViewport = page.getViewport({ scale: 1 })
    const targetWidth = 1400
    const scale = Math.max(1.5, targetWidth / Math.max(baseViewport.width, 1))
    const viewport = page.getViewport({ scale })
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height))
    const canvasContext = canvas.getContext('2d')

    await page.render({
      canvasContext: canvasContext as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise

    const pngBuffer = canvas.toBuffer('image/png')
    await loadingTask.destroy()
    return Buffer.isBuffer(pngBuffer) ? pngBuffer : Buffer.from(pngBuffer)
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const { userId, certificateUrl, filePath } = body;

  if (!userId || !certificateUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let status = 'pending';
  let similarityScore: number | null = null;
  const fileKind = detectCertificateFileKind(certificateUrl, typeof filePath === 'string' ? filePath : null);
  const templateImageUrl = process.env.CERTIFICATE_TEMPLATE_IMAGE_URL;
  const templateImagePath =
    process.env.CERTIFICATE_TEMPLATE_IMAGE_PATH ?? 'public/certificate-template.png';
  const minSimilarityRaw = Number(process.env.CERTIFICATE_MIN_SIMILARITY ?? '0.9');
  const minSimilarity = Number.isFinite(minSimilarityRaw) ? minSimilarityRaw : 0.9;

  const templateBuffer = templateImageUrl
    ? await fetchImageBuffer(templateImageUrl)
    : await loadTemplateBufferFromFile(templateImagePath);
  const templateLoaded = !!templateBuffer;
  let uploadedLoaded = false;

  let uploadedBuffer: Buffer | null = null;
  if (typeof filePath === 'string' && filePath.length > 0) {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('certificates')
      .download(filePath);
    if (!downloadError && fileData) {
      uploadedBuffer = Buffer.from(await fileData.arrayBuffer());
    }
  }
  if (!uploadedBuffer) {
    uploadedBuffer = await fetchImageBuffer(certificateUrl);
  }
  uploadedBuffer = uploadedBuffer
    ? await normalizeCertificateBufferForSimilarity(uploadedBuffer, fileKind)
    : null;
  uploadedLoaded = !!uploadedBuffer;

  if (templateBuffer && uploadedBuffer) {
    similarityScore = await computeTemplateSimilarity(uploadedBuffer, templateBuffer);
    if (similarityScore !== null && similarityScore >= minSimilarity) {
      status = 'approved';
    }
  }

  console.log('[certificate-upload] validation result', {
    userId,
    status,
    similarityScore,
    minSimilarity,
    templateLoaded,
    uploadedLoaded,
    templateImageUrl: templateImageUrl || null,
    templateImagePath: templateImageUrl ? null : templateImagePath,
  });

  const { error: insertError } = await supabase.from('certificates').insert({
    user_id: userId,
    certificate_url: certificateUrl,
    status,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (status === 'approved') {
    await unlockCandidateReattempt(supabase, userId);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', userId)
    .maybeSingle();

  const adminReviewUrl = getAdminReviewUrl(req);

  await notifyUser(userId, 'certificate_uploaded', 'Certificate submitted', `Your certificate has been submitted and is ${status}.`, {
    certificate_url: certificateUrl,
    status,
  });

  await notifyAdmins(
    'certificate_uploaded_admin',
    'Certificate submitted',
    `A candidate uploaded a certificate that is currently ${status}. Candidate: ${profile?.name || profile?.email || userId}. Review dashboard: ${adminReviewUrl}. Certificate: ${certificateUrl}`,
    {
      user_id: userId,
      status,
      candidate_name: profile?.name || null,
      candidate_email: profile?.email || null,
      certificate_url: certificateUrl,
      admin_review_url: adminReviewUrl,
      file_kind: fileKind,
    }
  );

  return NextResponse.json({
    success: true,
    status,
    similarityScore,
    minSimilarity,
    templateLoaded,
    uploadedLoaded,
    fileKind,
  });
}
