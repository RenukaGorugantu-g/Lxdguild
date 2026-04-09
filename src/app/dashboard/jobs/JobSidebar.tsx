"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X, ChevronRight } from "lucide-react";

export default function JobSidebar({ categories }: { categories: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  const setCategory = (cat: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) {
      params.set("category", cat);
    } else {
      params.delete("category");
    }
    router.push(`/dashboard/jobs?${params.toString()}`);
  };

  return (
    <aside className="w-full md:w-64 space-y-8 shrink-0">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-brand-600" />
          <h3 className="font-bold text-lg">Filters</h3>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setCategory(null)}
            className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${
              !currentCategory 
                ? "bg-brand-600 text-white shadow-md shadow-brand-500/20" 
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            All Roles
            {!currentCategory && <ChevronRight className="w-4 h-4" />}
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${
                currentCategory === cat 
                  ? "bg-brand-600 text-white shadow-md shadow-brand-500/20" 
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {cat}
              {currentCategory === cat && <ChevronRight className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {currentCategory && (
        <button
          onClick={() => setCategory(null)}
          className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider hover:underline"
        >
          <X className="w-3 h-3" /> Clear filters
        </button>
      )}

      {/* Aesthetic Card */}
      <div className="p-6 bg-gradient-to-br from-zinc-900 to-black rounded-2xl text-white shadow-xl">
         <p className="text-[10px] font-bold text-brand-500 uppercase mb-2 tracking-widest">Growth</p>
         <p className="text-sm font-bold mb-4 leading-tight">Validate more skills to unlock senior roles.</p>
         <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 w-2/3"></div>
         </div>
      </div>
    </aside>
  );
}
