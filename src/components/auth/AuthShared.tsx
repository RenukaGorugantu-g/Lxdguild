"use client";

import { Leaf, LucideIcon } from "lucide-react";

export function AuthLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? "gap-2.5" : "gap-3"}`}>
      <span className={`inline-flex items-center justify-center rounded-xl bg-[#066c12] text-white ${compact ? "h-8 w-8" : "h-10 w-10"}`}>
        <Leaf className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </span>
      <span className={`font-bold tracking-[-0.04em] text-[#066c12] ${compact ? "text-sm" : "text-[2.5rem] leading-none"}`}>LXD Guild</span>
    </div>
  );
}

export function SocialButton({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex h-[52px] items-center justify-center gap-3 rounded-[14px] border border-[#d7ddd0] bg-white px-5 text-[15px] font-medium text-[#333a45] transition-all hover:-translate-y-0.5 hover:border-[#c0c8b8] hover:shadow-[0_10px_18px_rgba(68,81,49,0.08)]"
    >
      <Icon className="h-4.5 w-4.5" />
      {label}
    </button>
  );
}

export function DividerLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#b0b7a6]">
      <span className="h-px flex-1 bg-[#d9dfcf]" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-[#d9dfcf]" />
    </div>
  );
}
