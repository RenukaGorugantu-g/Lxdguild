"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Filter, Search, X } from "lucide-react";

export default function JobSidebar({ categories }: { categories: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") || "";
  const currentCategory = searchParams.get("category");
  const currentView = searchParams.get("view") || "all";
  const currentRemote = searchParams.get("remote") || "all";
  const currentSchedule = searchParams.get("schedule") || "all";
  const [query, setQuery] = useState(currentQuery);

  const pushWithParams = (params: URLSearchParams) => {
    params.delete("page");
    router.push(`/dashboard/jobs${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const submitSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    const nextQuery = query.trim();
    if (nextQuery) {
      params.set("q", nextQuery);
    } else {
      params.delete("q");
    }
    pushWithParams(params);
  };

  const setCategory = (cat: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) {
      params.set("category", cat);
    } else {
      params.delete("category");
    }
    pushWithParams(params);
  };

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "all") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    pushWithParams(params);
  };

  const setRemote = (remote: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (remote === "all") {
      params.delete("remote");
    } else {
      params.set("remote", remote);
    }
    pushWithParams(params);
  };

  const setSchedule = (schedule: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (schedule === "all") {
      params.delete("schedule");
    } else {
      params.set("schedule", schedule);
    }
    pushWithParams(params);
  };

  const clearFilters = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("category");
    params.delete("view");
    params.delete("remote");
    params.delete("schedule");
    pushWithParams(params);
  };

  const isFiltered =
    Boolean(currentQuery) || Boolean(currentCategory) || currentView !== "all" || currentRemote !== "all" || currentSchedule !== "all";

  return (
    <aside className="w-full shrink-0 space-y-6 lg:w-[290px]">
      <div className="marketing-grid-card p-5 lg:sticky lg:top-28">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
          <Filter className="h-4 w-4 text-[#23b61f]" />
          Filter jobs
        </div>

        <div className="mt-4 rounded-2xl border border-[#dde6d7] bg-white px-3 py-2">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[#96a193]" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitSearch();
                }
              }}
              placeholder="Title, company, remote..."
              className="h-10 flex-1 border-0 bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#96a193]"
            />
            <button
              type="button"
              onClick={submitSearch}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[#111827] transition hover:bg-[#f3f7ef]"
              aria-label="Search jobs"
            >
              <Search className="h-4 w-4 text-[#23b61f]" />
            </button>
          </div>
        </div>

        <FilterGroup
          title="View"
          items={[
            { label: "All Jobs", value: "all" },
            { label: "Standard", value: "standard" },
            { label: "Freelance", value: "freelance" },
          ]}
          currentValue={currentView}
          onChange={setView}
        />

        <FilterGroup
          title="Location"
          items={[
            { label: "All Locations", value: "all" },
            { label: "Remote", value: "remote" },
          ]}
          currentValue={currentRemote}
          onChange={setRemote}
        />

        <FilterGroup
          title="Schedule"
          items={[
            { label: "All Schedules", value: "all" },
            { label: "Full-time", value: "full-time" },
            { label: "Part-time", value: "part-time" },
          ]}
          currentValue={currentSchedule}
          onChange={setSchedule}
        />

        <div className="mt-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#6d7d68]">Roles</p>
          <div className="space-y-1">
            <FilterButton active={!currentCategory} label="All Roles" onClick={() => setCategory(null)} />
            {categories.map((cat) => (
              <FilterButton key={cat} active={currentCategory === cat} label={cat} onClick={() => setCategory(cat)} />
            ))}
          </div>
        </div>
      </div>

      {isFiltered && (
        <button
          onClick={clearFilters}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#5f705c] hover:text-[#111827]"
        >
          <X className="h-3 w-3" />
          Clear filters
        </button>
      )}

      <div className="rounded-[2rem] bg-[#33d31f] p-6 text-white shadow-[0_20px_50px_rgba(31,157,39,0.18)]">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Growth</p>
        <p className="text-sm font-semibold leading-6">Validate more skills to unlock stronger-fit premium roles.</p>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-2/3 rounded-full bg-white" />
        </div>
      </div>
    </aside>
  );
}

function FilterGroup({
  title,
  items,
  currentValue,
  onChange,
}: {
  title: string;
  items: Array<{ label: string; value: string }>;
  currentValue: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-6">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#6d7d68]">{title}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <FilterButton
            key={item.value}
            active={currentValue === item.value}
            label={item.label}
            onClick={() => onChange(item.value)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-all ${
        active ? "bg-[#f0f8ea] text-[#111827]" : "text-[#596655] hover:bg-[#f6f8f2]"
      }`}
    >
      {label}
      {active && <ChevronRight className="h-4 w-4 text-[#23b61f]" />}
    </button>
  );
}
