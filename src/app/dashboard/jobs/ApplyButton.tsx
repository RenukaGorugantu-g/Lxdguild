"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ExternalLink, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ApplyButton({ 
  jobId, 
  userId, 
  externalUrl, 
  alreadyApplied 
}: { 
  jobId: string, 
  userId: string, 
  externalUrl: string,
  alreadyApplied: boolean
}) {
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(alreadyApplied);
  const supabase = createClient();
  const router = useRouter();

  const handleApply = async () => {
    if (applied) {
      window.open(externalUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setIsApplying(true);
    try {
      // 1. Record application in LXD platform
      const { error } = await supabase.from("job_applications").insert({
        job_id: jobId,
        user_id: userId,
        status: "applied"
      });

      if (error && error.code !== '23505') { // Ignore unique constraint violation if they somehow applied twice
        console.error("Error recording application:", error);
      } else {
        setApplied(true);
      }

      // 2. Open external job link
      window.open(externalUrl, "_blank", "noopener,noreferrer");
      
      router.refresh(); // Refresh to update server components if needed
    } catch (err) {
      console.error("Application failed:", err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <button 
      onClick={handleApply}
      disabled={isApplying}
      className={`shrink-0 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-colors ${
        applied 
          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' 
          : 'bg-brand-600 hover:bg-brand-700 text-white'
      }`}
    >
      {isApplying ? (
        "Processing..."
      ) : applied ? (
        <>Applied <CheckCircle className="w-4 h-4" /></>
      ) : (
        <>Apply Now <ExternalLink className="w-4 h-4" /></>
      )}
    </button>
  );
}
