"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function CertificateUpload({ userId }: { userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitOutcome, setSubmitOutcome] = useState<'pending_review' | 'approved'>('pending_review');
  const [validationHint, setValidationHint] = useState<string>('');
  const supabase = createClient();

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
        body: JSON.stringify({ userId, certificateUrl: publicUrl, filePath }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to submit certificate.');
      }

      setSubmitOutcome(result.status === 'approved' ? 'approved' : 'pending_review');
      if (result.status !== 'approved') {
        if (!result.templateLoaded) {
          setValidationHint('Template image not loaded on server. Check CERTIFICATE_TEMPLATE_IMAGE_PATH.');
        } else if (!result.uploadedLoaded) {
          setValidationHint('Uploaded file could not be loaded for validation. Check certificate storage read access.');
        } else if (typeof result.similarityScore === 'number') {
          setValidationHint(
            `Auto-match score ${result.similarityScore.toFixed(3)} is below threshold ${Number(result.minSimilarity ?? 0.9).toFixed(3)}.`
          );
        } else {
          setValidationHint('Could not compute image similarity for this file. Please retry with a clear PNG/JPG.');
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
      <div className="p-6 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-2xl flex items-center gap-4">
        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h4 className="font-bold text-green-900 dark:text-green-400">Certificate Uploaded</h4>
          <p className="text-sm text-green-700 dark:text-green-500">
            {submitOutcome === 'approved'
              ? 'Your certificate is approved. You can browse and apply to jobs from the Job Board.'
              : 'Our team will review your certificate within 24-48 hours.'}
          </p>
          {submitOutcome === 'pending_review' && validationHint && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{validationHint}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-surface-dark border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Upload className="w-6 h-6 text-brand-600" />
        <h3 className="text-lg font-bold">Submit External Certificate</h3>
      </div>
      <p className="text-sm text-zinc-500">
        Upload your certificate here. PNG/JPG are auto-validated against the LXD certificate template; unmatched files will go to admin review.
      </p>
      
      <div className="relative group">
        <input 
          type="file" 
          accept=".pdf,.jpg,.png" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
        />
        <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center group-hover:border-brand-500 transition-colors">
          <Upload className="w-8 h-8 text-zinc-300 mx-auto mb-2 group-hover:text-brand-500" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {file ? file.name : "Click or drag to upload (PNG, JPG, PDF)"}
          </p>
        </div>
      </div>

      {status === 'error' && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Failed to upload. Please try again.
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : "Submit for Review"}
      </button>
    </div>
  );
}
