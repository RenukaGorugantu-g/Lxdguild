"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Check, X, Loader2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CertificateReviewList({ certificates }: { certificates: any[] }) {
  const [processing, setProcessing] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const handleReview = async (certId: string, userId: string, action: 'approved' | 'rejected') => {
    setProcessing(certId);
    try {
      const response = await fetch('/api/notifications/certificate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certId, userId, action }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process certificate review.');
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to process certificate review.");
    } finally {
      setProcessing(null);
    }
  };

  if (!certificates || certificates.length === 0) {
    return <p className="text-zinc-500 text-sm">No pending certificates to review.</p>;
  }

  return (
    <div className="space-y-4">
      {certificates.map((cert) => (
        <div key={cert.id} className="flex items-center justify-between p-4 border rounded-xl bg-zinc-50 dark:bg-black/20">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-brand-50 rounded-lg">
                <GraduationCap className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">{cert.profiles?.name || 'Unknown User'}</p>
              <p className="text-xs text-zinc-500">{cert.profiles?.email}</p>
              <a 
                href={cert.certificate_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-[10px] text-brand-600 hover:underline flex items-center gap-1 mt-1"
              >
                View Certificate <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleReview(cert.id, cert.user_id, 'approved')}
              disabled={!!processing}
              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              title="Approve"
            >
              {processing === cert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => handleReview(cert.id, cert.user_id, 'rejected')}
              disabled={!!processing}
              className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              title="Reject"
            >
              {processing === cert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function GraduationCap(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
