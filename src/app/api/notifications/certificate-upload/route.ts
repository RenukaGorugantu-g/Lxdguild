import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { notifyUser, notifyAdmins } from '@/lib/notifications'
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

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
    const { error: candError } = await supabase
      .from('candidates')
      .update({ reattempt_allowed: true })
      .eq('user_id', userId);

    if (candError) {
      console.error('Failed to unlock candidate reattempt:', candError.message);
    }

    const { error: roleError } = await supabase
      .from('profiles')
      .update({ role: 'candidate_mvp' })
      .eq('id', userId);

    if (roleError) {
      console.error('Failed to promote candidate role after certificate approval:', roleError.message);
    }
  }

  await notifyUser(userId, 'certificate_uploaded', 'Certificate submitted', `Your certificate has been submitted and is ${status}.`, {
    certificate_url: certificateUrl,
    status,
  });

  await notifyAdmins(
    'certificate_uploaded_admin',
    'Certificate submitted',
    `A candidate uploaded a certificate that is currently ${status}.`,
    {
      user_id: userId,
      status,
    }
  );

  return NextResponse.json({
    success: true,
    status,
    similarityScore,
    minSimilarity,
    templateLoaded,
    uploadedLoaded,
  });
}
