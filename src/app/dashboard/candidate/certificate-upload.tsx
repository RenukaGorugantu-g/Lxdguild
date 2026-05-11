"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function CertificateUpload({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [certificateCode, setCertificateCode] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitOutcome, setSubmitOutcome] = useState<'pending_review' | 'approved'>('pending_review');
  const [validationHint, setValidationHint] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const supabase = createClient();
  const isPdf = file?.type === "application/pdf" || file?.name.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus('idle');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `certificates/${fileName}`;

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(filePath);

      const response = await fetch('/api/notifications/certificate-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, certificateUrl: publicUrl, filePath, certificateCode }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to submit certificate.');
      }

      setSubmitOutcome(result.status === 'approved' ? 'approved' : 'pending_review');
      if (result.status !== 'approved') {
        if (result.registryReason === 'email_mismatch') {
          setValidationHint('Certificate code exists, but the LearnDash email does not match your account email.');
        } else if (result.registryReason === 'claimed_by_other_user') {
          setValidationHint('This certificate code is already claimed by another account.');
        } else if (result.registryReason === 'not_found') {
          setValidationHint('Certificate code was not found in the LearnDash registry, so this upload is pending admin review.');
        } else if (!result.templateLoaded) {
          setValidationHint('Template image not loaded on server. Check CERTIFICATE_TEMPLATE_IMAGE_PATH.');
        } else if (!result.uploadedLoaded) {
          setValidationHint('Uploaded file could not be read for validation, so it has been left pending for admin review.');
        } else if (typeof result.similarityScore === 'number') {
          setValidationHint(
            `Auto-match score ${result.similarityScore.toFixed(3)} is below threshold ${Number(result.minSimilarity ?? 0.9).toFixed(3)}.`
          );
        } else {
          setValidationHint('Auto image matching could not be completed for this file, so it has been left pending for admin review.');
        }
      } else {
        setValidationHint('');
      }
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-green-400/30 bg-[linear-gradient(180deg,#17305a_0%,#11203b_100%)] p-6 text-white">
        <div className="rounded-full bg-green-500/15 p-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h4 className="font-bold text-white">Certificate Uploaded</h4>
          <p className="text-sm text-white/80">
            {submitOutcome === 'approved'
              ? 'Your certificate is approved. You can browse and apply to jobs from the Job Board.'
              : 'Our team will review your certificate within 24-48 hours.'}
          </p>
          {submitOutcome === 'pending_review' && validationHint && (
            <p className="mt-1 text-xs text-white/65">{validationHint}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[#2a4368] bg-[linear-gradient(180deg,#17305a_0%,#11203b_100%)] p-6 text-white shadow-[0_18px_34px_rgba(17,32,59,0.28)]">
      <div className="flex items-center gap-3 mb-2">
        <Upload className="w-6 h-6 text-[#49e63d]" />
        <h3 className="text-lg font-bold text-white">Submit External Certificate</h3>
      </div>
      <p className="text-sm text-white/78">
        Upload your certificate here and enter the certificate code from LearnDash. Matching codes can auto-approve instantly, while unmatched uploads fall back to template validation or admin review.
      </p>

      <div className="space-y-2">
        <label htmlFor="certificate-code" className="text-sm font-medium text-white/90">
          Certificate code
        </label>
        <input
          id="certificate-code"
          value={certificateCode}
          onChange={(event) => setCertificateCode(event.target.value)}
          placeholder="Example: CLXD202604123"
          className="w-full rounded-xl border border-[#334f7a] bg-[#08111f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#49e63d]"
        />
        <p className="text-xs text-white/62">
          Use the same code printed on your LearnDash certificate.
        </p>
      </div>
      
      <div className="relative group">
        <input 
          type="file" 
          accept=".pdf,.jpg,.png" 
          onChange={(e) => {
            const nextFile = e.target.files?.[0] || null;
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
            }
            setFile(nextFile);
            setPreviewUrl(nextFile && nextFile.type.startsWith("image/") ? URL.createObjectURL(nextFile) : null);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
        />
        <div className="rounded-xl border-2 border-dashed border-[#3a557c] p-8 text-center transition-colors group-hover:border-[#49e63d]">
          <Upload className="mx-auto mb-2 h-8 w-8 text-white/75 group-hover:text-[#49e63d]" />
          <p className="text-sm font-medium text-white/78">
            {file ? file.name : "Click or drag to upload (PNG, JPG, PDF)"}
          </p>
        </div>
      </div>

      {previewUrl ? (
        <div className="overflow-hidden rounded-xl border border-[#334f7a] bg-white/5">
          <Image
            src={previewUrl}
            alt="Certificate preview"
            width={1200}
            height={900}
            unoptimized
            className="max-h-72 w-full object-contain bg-white"
          />
        </div>
      ) : file ? (
        <p className="text-xs text-white/62">
          {isPdf
            ? "PDF selected. We will score-check the first page of the PDF against the certificate template."
            : "Image selected. Clear PNG/JPG certificate images usually validate best."}
        </p>
      ) : null}

      {status === 'error' && (
        <p className="flex items-center gap-1 text-xs text-red-300">
          <AlertCircle className="w-3 h-3" /> Failed to upload. Please try again.
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || !certificateCode.trim() || uploading}
        className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : "Submit for Review"}
      </button>
    </div>
  );
}
