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
    <aside className="w-full shrink-0 space-y-8 md:w-64">
      <div className="premium-card-light p-5">
        <div className="mb-6 flex items-center gap-2">
          <Filter className="h-5 w-5 text-[#34cd2f]" />
          <h3 className="text-lg font-bold text-zinc-950">Filters</h3>
        </div>

        <div className="mb-6 space-y-1">
          {[
            { label: "All Jobs", value: "all" },
            { label: "Standard", value: "standard" },
            { label: "Freelance", value: "freelance" },
          ].map((view) => (
            <button
              key={view.value}
              onClick={() => setView(view.value)}
              className={`flex w-full items-center justify-between rounded-xl p-3 text-sm font-medium transition-all ${
                currentView === view.value
                  ? "bg-[#091737] text-white shadow-md"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {view.label}
              {currentView === view.value && <ChevronRight className="h-4 w-4" />}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Location</p>
          <div className="space-y-1">
            {[
              { label: "All Locations", value: "all" },
              { label: "Remote", value: "remote" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setRemote(option.value)}
                className={`flex w-full items-center justify-between rounded-xl p-3 text-sm font-medium transition-all ${
                  currentRemote === option.value
                    ? "bg-[#091737] text-white shadow-md"
                    : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {option.label}
                {currentRemote === option.value && <ChevronRight className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">Schedule</p>
          <div className="space-y-1">
            {[
              { label: "All Schedules", value: "all" },
              { label: "Full-time", value: "full-time" },
              { label: "Part-time", value: "part-time" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSchedule(option.value)}
                className={`flex w-full items-center justify-between rounded-xl p-3 text-sm font-medium transition-all ${
                  currentSchedule === option.value
                    ? "bg-[#091737] text-white shadow-md"
                    : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {option.label}
                {currentSchedule === option.value && <ChevronRight className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setCategory(null)}
            className={`flex w-full items-center justify-between rounded-xl p-3 text-sm font-medium transition-all ${
              !currentCategory
                ? "bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] text-[#091737] shadow-md shadow-brand-500/20"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            All Roles
            {!currentCategory && <ChevronRight className="h-4 w-4" />}
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex w-full items-center justify-between rounded-xl p-3 text-sm font-medium transition-all ${
                currentCategory === cat
                  ? "bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] text-[#091737] shadow-md shadow-brand-500/20"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {cat}
              {currentCategory === cat && <ChevronRight className="h-4 w-4" />}
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
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#80ef7a] hover:text-white"
        >
          <X className="h-3 w-3" /> Clear filters
        </button>
      )}

      <div className="premium-glass-section p-6 text-white">
         <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#34cd2f]">Growth</p>
         <p className="mb-4 text-sm font-bold leading-tight">Validate more skills to unlock stronger-fit premium roles.</p>
         <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-2/3 bg-[linear-gradient(135deg,#34cd2f,#80ef7a)]"></div>
        </div>
      </div>
    </aside>
  );
}
