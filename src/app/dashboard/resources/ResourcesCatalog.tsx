"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Crown,
  Download,
  Filter,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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

  const freeResources = resources.filter((resource) => !resource.premiumOnly).length;
  const premiumResources = resources.filter((resource) => resource.premiumOnly).length;

  return (
    <div className="space-y-12">
      <section className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <h1 className="marketing-title max-w-3xl text-5xl sm:text-6xl">Build your resource library with confidence.</h1>
          <p className="marketing-copy max-w-2xl text-base leading-8">
            Your tools, templates, and premium packs are all in one place. Browse what is free now, unlock member-only
            resources when needed, and keep discovery simple without losing the current filtering experience.
          </p>
          <p className="marketing-copy max-w-2xl text-base leading-8">
            You&apos;re currently in the <span className="font-semibold text-[#138d1a]">Resources</span> phase. Use the
            library below to strengthen delivery quality, speed up production, and keep building your toolkit.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <a href="#resource-library" className="marketing-primary">
              Explore library
            </a>
            <a href="/dashboard/membership" className="marketing-secondary">
              {hasMembership ? "Membership active" : "Unlock premium"}
            </a>
          </div>
        </div>

        <div className="marketing-panel p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="marketing-soft-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Library Size</p>
              <p className="mt-3 text-4xl font-bold text-[#17a21c]">{resources.length}</p>
              <div className="mt-3 h-1.5 rounded-full bg-[#e2ecd8]">
                <div className="h-1.5 w-[86%] rounded-full bg-[#23b61f]" />
              </div>
            </div>
            <div className="marketing-soft-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#6d7d68]">Access</p>
              <p className="mt-3 text-4xl font-bold text-[#111827]">{hasMembership ? "Member" : "Free"}</p>
              <p className="mt-4 text-xs text-[#1da326]">
                {hasMembership ? "All premium packs available" : "Premium downloads stay gated"}
              </p>
            </div>
          </div>
          <div className="marketing-soft-card mt-4 p-4">
            <p className="text-sm font-semibold text-[#111827]">Library Progress</p>
            <div className="mt-5 grid grid-cols-4 gap-3">
              {[34, 52, 28, 68].map((height, index) => (
                <div
                  key={index}
                  className={`${index === 1 ? "bg-[#35d421]" : "bg-[#dff5d8]"} rounded-t-xl`}
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-[#138d1a]" />
          <h2 className="text-3xl font-bold text-[#111827]">Your Access</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <AccessCard
            icon={<Download className="h-5 w-5" />}
            title="Free Resources"
            caption="Download practical tools right away"
            value={`${freeResources} ready`}
            state="completed"
          />
          <AccessCard
            icon={<Crown className="h-5 w-5" />}
            title="Premium Packs"
            caption={hasMembership ? "All member downloads are unlocked" : "Unlock advanced templates and packs"}
            value={hasMembership ? "active" : "upgrade"}
            state={hasMembership ? "active" : "locked"}
          />
          <AccessCard
            icon={<Filter className="h-5 w-5" />}
            title="Smart Filters"
            caption="Narrow the library by category and search"
            value={`${categories.length} groups`}
            state="completed"
          />
          <AccessCard
            icon={<BookOpen className="h-5 w-5" />}
            title="Resource Growth"
            caption="Keep building a stronger delivery toolkit"
            value={`${premiumResources} premium`}
            state="locked"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.55fr]">
        <article className="marketing-grid-card p-8">
          <div className="grid gap-8 md:grid-cols-[260px_1fr] md:items-start">
            <div className="rounded-[1.8rem] bg-[#19324b] p-6 text-white shadow-[0_22px_44px_rgba(15,23,42,0.2)]">
              <div className="mx-auto flex h-40 w-full items-center justify-center rounded-[1.4rem] bg-[#224463]">
                <BookOpen className="h-16 w-16 text-[#b7ffd0]" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#eaf8e3] px-4 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#138d1a]">
                  Resource Focus
                </span>
                <span className="text-sm font-medium text-[#7a8577]">
                  {hasMembership ? "Full toolkit access" : "Free + upgrade-ready"}
                </span>
              </div>

              <h3 className="mt-5 text-4xl font-bold text-[#111827]">Resource Library</h3>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[#5b6757]">
                Keep the clean resource discovery you already like, then layer in a more structured dashboard-style
                experience. Browse free downloads, surface premium packs, and move straight into the materials you need.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a href="#resource-library" className="marketing-primary">
                  Browse Downloads
                </a>
                <a href="/dashboard/membership" className="marketing-secondary">
                  {hasMembership ? "Manage Membership" : "Unlock Member Access"}
                </a>
              </div>
            </div>
          </div>
        </article>

        <div className="space-y-6">
          <SideCard
            icon={<ShieldCheck className="h-5 w-5" />}
            accent="bg-[#eaf8e3] text-[#138d1a]"
            title="Member Access"
            copy={hasMembership ? "Your premium library is fully unlocked." : "Upgrade to unlock member-only packs."}
          />
          <SideCard
            icon={<Search className="h-5 w-5" />}
            accent="bg-[#e9ecff] text-[#6877d3]"
            title="Faster Discovery"
            copy="Search by keyword, narrow by category, and keep the resource list focused."
          />
          <article className="rounded-[1.9rem] border border-[#dde7d8] bg-[radial-gradient(circle_at_top,rgba(181,231,157,0.25),transparent_50%),rgba(255,255,255,0.85)] p-7 shadow-[0_16px_40px_rgba(87,108,67,0.08)]">
            <h3 className="text-2xl font-bold text-[#111827]">Library Insight</h3>
            <p className="mt-4 text-base leading-7 text-[#5b6757]">
              {hasMembership
                ? "You can now move across free and premium resources without friction."
                : "Start with free downloads now, then unlock premium packs when you want deeper implementation support."}
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#e8eef5]" />
                <div>
                  <p className="font-semibold text-[#111827]">Templates & checklists</p>
                  <p className="text-sm text-[#96a193]">Ready for faster execution</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#e8eef5]" />
                <div>
                  <p className="font-semibold text-[#111827]">Member-only packs</p>
                  <p className="text-sm text-[#96a193]">Advanced support for deeper work</p>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="space-y-6">
        <div className="text-center">
          <h2 className="marketing-title text-4xl">Experience the fluid flow</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="marketing-grid-card p-6">
            <p className="text-sm font-semibold text-[#111827]">Library health</p>
            <div className="mt-5 grid grid-cols-4 gap-3">
              {[34, 50, 42, 64].map((height, index) => (
                <div key={index} className={`${index === 3 ? "bg-[#35d421]" : "bg-[#dff5d8]"} rounded-t-xl`} style={{ height: `${height}px` }} />
              ))}
            </div>
          </div>
          <div className="marketing-grid-card p-6">
            <p className="text-sm font-semibold text-[#111827]">Membership access</p>
            <p className="mt-3 text-sm leading-7 text-[#5b6757]">
              {hasMembership ? "All premium resources are unlocked and ready to download." : "Free resources are available now. Premium packs unlock with membership."}
            </p>
          </div>
          <div className="marketing-grid-card p-6">
            <p className="text-sm font-semibold text-[#111827]">Fast discovery</p>
            <p className="mt-3 text-sm leading-7 text-[#5b6757]">
              Move through your toolkit without digging through long lists or mixed resource types.
            </p>
          </div>
        </div>
      </section>

      <div id="resource-library" className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="marketing-grid-card h-fit p-5 lg:sticky lg:top-28">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
            <Filter className="h-4 w-4 text-[#23b61f]" />
            Filter by category
          </div>

          <div className="mt-4 rounded-2xl border border-[#dde6d7] bg-white px-3 py-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-[#96a193]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search resources"
                className="w-full bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#96a193]"
              />
            </div>
          </div>

          <div className="mt-5 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {categories.map(([category, count]) => {
              const active = selectedCategories.includes(category);
              return (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition-colors ${
                    active
                      ? "border-[#dbe9d2] bg-[#f0f8ea] text-[#111827]"
                      : "border-[#e3e8de] bg-white text-[#5b6757] hover:bg-[#f7f9f4]"
                  }`}
                >
                  <span>{category}</span>
                  <span className="rounded-full bg-[#f2f5ef] px-2 py-0.5 text-xs font-semibold text-[#72806f]">{count}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="space-y-4">
          {filteredResources.map((resource) => {
            const locked = resource.premiumOnly && !hasMembership;
            return (
              <article key={resource.id} className="marketing-grid-card p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#f1f5ed] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#657261]">
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
                    <h2 className="text-xl font-bold text-[#111827]">{resource.title}</h2>
                  </div>

                  <a
                    href={locked ? "/dashboard/membership" : resource.fileLink}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-colors ${
                      locked ? "bg-[#111827] text-white hover:bg-[#1f2937]" : "bg-[#23b61f] text-white hover:bg-[#1da31b]"
                    }`}
                  >
                    {locked ? <Lock className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                    {locked ? "Unlock with membership" : "Download"}
                  </a>
                </div>
              </article>
            );
          })}

          {filteredResources.length === 0 && (
            <div className="marketing-grid-card border-dashed px-6 py-16 text-center text-sm text-[#6d7d68]">
              No resources matched your current filters.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function AccessCard({
  icon,
  title,
  caption,
  value,
  state,
}: {
  icon: React.ReactNode;
  title: string;
  caption: string;
  value: string;
  state: "completed" | "active" | "locked";
}) {
  const isCompleted = state === "completed";
  const isActive = state === "active";
  const isLocked = state === "locked";

  return (
    <article
      className={`rounded-[1.9rem] border p-7 shadow-[0_16px_40px_rgba(87,108,67,0.08)] ${
        isActive
          ? "border-[#8fd97e] bg-white ring-2 ring-[#a9e99d]/70"
          : isLocked
            ? "border-[#e7ece2] bg-white/72 text-[#b4bdb0]"
            : "border-[#d8e6d3] bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            isCompleted ? "bg-[#138d1a] text-white" : isActive ? "bg-[#138d1a] text-white" : "bg-[#ecf1e7] text-[#a0aa9b]"
          }`}
        >
          {icon}
        </div>
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
            isCompleted ? "text-[#138d1a]" : isActive ? "text-[#138d1a]" : "text-[#b4bdb0]"
          }`}
        >
          {value}
        </p>
      </div>
      <h3 className={`mt-8 text-2xl font-bold ${isLocked ? "text-[#bac1b8]" : "text-[#111827]"}`}>{title}</h3>
      <p className={`mt-3 text-base leading-7 ${isLocked ? "text-[#c4cbc2]" : "text-[#647061]"}`}>{caption}</p>
    </article>
  );
}

function SideCard({
  icon,
  accent,
  title,
  copy,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-[1.9rem] border border-[#dde7d8] bg-white px-7 py-6 shadow-[0_16px_40px_rgba(87,108,67,0.08)]">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>{icon}</div>
        <div>
          <h3 className="text-2xl font-bold text-[#111827]">{title}</h3>
          <p className="mt-1 text-sm text-[#7f8a7b]">{copy}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-[#c2c8be]" />
    </div>
  );
}
