"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ApplyButtonInternal({ jobId, userId, alreadyApplied }: { jobId: string, userId: string, alreadyApplied: boolean }) {
  const [applied, setApplied] = useState(alreadyApplied);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleApply = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("job_applications")
        .insert({
          job_id: jobId,
          user_id: userId,
          status: 'applied'
        });

      if (error) {
        if (error.code === '23505') {
          setApplied(true);
        } else {
          alert("Error submittting application: " + error.message);
        }
      } else {
        setApplied(true);
        router.refresh();
      }
    } catch (err: any) {
      alert("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (applied) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 px-6 bg-green-50 text-green-700 rounded-xl font-bold border border-green-100">
        <CheckCircle className="w-5 h-5" /> Applied
      </div>
    );
  }

  return (
    <button
      onClick={handleApply}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg hover:shadow-brand-500/20 disabled:opacity-50"
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Apply for this Role"}
    </button>
  );
}
