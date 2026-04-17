"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X, ChevronRight } from "lucide-react";

export default function JobSidebar({ categories }: { categories: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const currentView = searchParams.get("view") || "all";
  const currentRemote = searchParams.get("remote") || "all";
  const currentSchedule = searchParams.get("schedule") || "all";

  const setCategory = (cat: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) {
      params.set("category", cat);
    } else {
      params.delete("category");
    }
    router.push(`/dashboard/jobs?${params.toString()}`);
  };

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "all") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    router.push(`/dashboard/jobs?${params.toString()}`);
  };

  const setRemote = (remote: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (remote === "all") {
      params.delete("remote");
    } else {
      params.set("remote", remote);
    }
    router.push(`/dashboard/jobs${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const setSchedule = (schedule: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (schedule === "all") {
      params.delete("schedule");
    } else {
      params.set("schedule", schedule);
    }
    router.push(`/dashboard/jobs${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <aside className="w-full md:w-64 space-y-8 shrink-0">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-brand-600" />
          <h3 className="font-bold text-lg">Filters</h3>
        </div>

        <div className="space-y-1 mb-6">
          {[
            { label: "All Jobs", value: "all" },
            { label: "Standard", value: "standard" },
            { label: "Freelance", value: "freelance" },
          ].map((view) => (
            <button
              key={view.value}
              onClick={() => setView(view.value)}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${
                currentView === view.value
                  ? "bg-zinc-950 text-white shadow-md"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {view.label}
              {currentView === view.value && <ChevronRight className="w-4 h-4" />}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">Location</p>
          <div className="space-y-1">
            {[
              { label: "All Locations", value: "all" },
              { label: "Remote", value: "remote" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setRemote(option.value)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${
                  currentRemote === option.value
                    ? "bg-zinc-950 text-white shadow-md"
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {option.label}
                {currentRemote === option.value && <ChevronRight className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">Schedule</p>
          <div className="space-y-1">
            {[
              { label: "All Schedules", value: "all" },
              { label: "Full-time", value: "full-time" },
              { label: "Part-time", value: "part-time" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSchedule(option.value)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${
                  currentSchedule === option.value
                    ? "bg-zinc-950 text-white shadow-md"
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {option.label}
                {currentSchedule === option.value && <ChevronRight className="w-4 h-4" />}
              </button>
            ))}
          </div>
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

      {(currentCategory || currentView !== "all" || currentRemote !== "all" || currentSchedule !== "all") && (
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("category");
            params.delete("view");
            params.delete("remote");
            params.delete("schedule");
            router.push(`/dashboard/jobs${params.toString() ? `?${params.toString()}` : ""}`);
          }}
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
