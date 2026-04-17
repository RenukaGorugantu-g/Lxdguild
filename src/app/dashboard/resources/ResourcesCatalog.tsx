"use client";

import { useMemo, useState } from "react";
import { Crown, Download, Filter, Lock, Search } from "lucide-react";

type ResourceItem = {
  id: string;
  title: string;
  category: string | null;
  fileLink: string;
  premiumOnly: boolean;
};

type ResourcesCatalogProps = {
  resources: ResourceItem[];
  hasMembership: boolean;
};

export default function ResourcesCatalog({ resources, hasMembership }: ResourcesCatalogProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    resources.forEach((resource) => {
      const category = resource.category || "Other";
      counts.set(category, (counts.get(category) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const category = resource.category || "Other";
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(category);
      const queryMatch =
        query.trim().length === 0 ||
        `${resource.title} ${resource.category || ""}`.toLowerCase().includes(query.trim().toLowerCase());
      return categoryMatch && queryMatch;
    });
  }, [query, resources, selectedCategories]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category]
    );
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm h-fit lg:sticky lg:top-28">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <Filter className="h-4 w-4 text-brand-600" />
          Filter by category
        </div>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search resources"
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
          </div>
        </div>

        <div className="mt-5 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {categories.map(([category, count]) => {
            const active = selectedCategories.includes(category);
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition-colors ${
                  active
                    ? "border-brand-300 bg-brand-50 text-brand-900"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <span>{category}</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-500">{count}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="space-y-6">
        <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-950">LXD Guild resources</h1>
              <p className="mt-2 text-sm text-zinc-600">
                Download free resources now. Member-only resources unlock for one year after membership purchase.
              </p>
            </div>

            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                hasMembership ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}
            >
              <Crown className="h-4 w-4" />
              {hasMembership ? "Member access active" : "Free access only"}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredResources.map((resource) => {
            const locked = resource.premiumOnly && !hasMembership;
            return (
              <article key={resource.id} className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {resource.category || "Other"}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                          resource.premiumOnly ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {resource.premiumOnly ? "Member benefit" : "Free resource"}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-zinc-950">{resource.title}</h2>
                  </div>

                  <div className="flex flex-col items-stretch gap-3 sm:flex-row">
                    <a
                      href={locked ? "/dashboard/membership" : resource.fileLink}
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-colors ${
                        locked
                          ? "bg-zinc-950 text-white hover:bg-zinc-800"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {locked ? <Lock className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                      {locked ? "Unlock with membership" : "Download"}
                    </a>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredResources.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-zinc-300 bg-white px-6 py-16 text-center text-sm text-zinc-500">
              No resources matched your current filters.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
