"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";

export default function FeaturedJobControl({
  jobId,
  featuredRank,
  canFeature,
}: {
  jobId: string;
  featuredRank: number | null;
  canFeature: boolean;
}) {
  const router = useRouter();
  const [isFeatured, setIsFeatured] = useState(featuredRank !== null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggleFeatured() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !isFeatured }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Featured status could not be updated.");
      setIsFeatured(!isFeatured);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Featured status could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggleFeatured}
        disabled={busy || (!isFeatured && !canFeature)}
        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
          isFeatured
            ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
        }`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
        {isFeatured ? "Unfeature job" : "Feature job"}
      </button>
      {error ? <p role="alert" className="max-w-xs text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
