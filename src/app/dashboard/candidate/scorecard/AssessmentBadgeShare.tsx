"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Award, Copy, Download, ExternalLink, Share2, Sparkles } from "lucide-react";

type AssessmentBadgeShareProps = {
  candidateName: string;
  targetRole: string;
  designationBucket: string;
  score: number;
  isPass: boolean;
  weakSkills: string[];
  shareUrl: string;
};

export default function AssessmentBadgeShare({
  candidateName,
  targetRole,
  designationBucket,
  score,
  isPass,
  weakSkills,
  shareUrl,
}: AssessmentBadgeShareProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const badgeLabel = isPass ? "LXD Guild Verified" : "Assessment Completed";
  const badgeSubtitle = isPass ? `${designationBucket} track` : `Growth track: ${designationBucket}`;
  const badgeTone = isPass
    ? {
        accent: "#34cd2f",
        accentSoft: "#dff8d5",
        ring: "#8ff08a",
        status: "Verified Talent Signal",
      }
    : {
        accent: "#f59e0b",
        accentSoft: "#fff2d9",
        ring: "#fbbf24",
        status: "Learning Momentum",
      };

  const shareCopy = useMemo(() => {
    const intro = isPass
      ? `I just earned my ${badgeLabel} badge with LXD Guild in the ${designationBucket} ${targetRole} assessment.`
      : `I completed my ${targetRole} assessment with LXD Guild and unlocked my next learning path.`;

    const skillsLine = weakSkills.length
      ? ` Next focus areas: ${weakSkills.slice(0, 3).join(", ")}.`
      : "";

    return `${intro} Score: ${score}%.${skillsLine} Explore the platform here: ${shareUrl}`;
  }, [badgeLabel, designationBucket, isPass, score, shareUrl, targetRole, weakSkills]);

  const badgeSvg = useMemo(
    () => createBadgeSvg({ badgeLabel, badgeSubtitle, badgeTone, candidateName, targetRole, score, isPass }),
    [badgeLabel, badgeSubtitle, badgeTone, candidateName, targetRole, score, isPass]
  );

  async function copyShareText() {
    try {
      await navigator.clipboard.writeText(shareCopy);
      setFeedback("Share text copied.");
    } catch {
      setFeedback("Copy failed. You can still download the badge.");
    }
  }

  function downloadBadge() {
    const blob = new Blob([badgeSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lxd-guild-${isPass ? "verified" : "assessment"}-badge.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback("Badge downloaded.");
  }

  async function nativeShare() {
    if (!navigator.share) {
      setFeedback("Use the copy or download actions for desktop sharing.");
      return;
    }

    try {
      await navigator.share({
        title: `${badgeLabel} - ${candidateName}`,
        text: shareCopy,
        url: shareUrl,
      });
      setFeedback("Shared successfully.");
    } catch {
      setFeedback(null);
    }
  }

  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareCopy)}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] [color-scheme:light]">
      <div className="rounded-[2rem] border border-[#dbe4d4] bg-[linear-gradient(180deg,#ffffff_0%,#f7fbf3_100%)] p-5 text-[#091737] shadow-[0_20px_44px_rgba(87,108,67,0.12)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1e9a26]">Share your milestone</p>
            <h2 className="mt-3 text-3xl text-[#091737]">Assessment badge</h2>
          </div>
          <div className="rounded-full border border-[#dbe4d4] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#334155] shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
            {badgeTone.status}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.7rem] border border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(52,205,47,0.22),transparent_28%),linear-gradient(135deg,#f7f0e8_0%,#efe7db_100%)] p-4 text-[#091737] sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#5b6b78]">LXD Guild badge</p>
              <h3 className="mt-3 text-[1.7rem] leading-none text-[#091737] sm:text-[2rem]">{badgeLabel}</h3>
            </div>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] border text-sm font-bold sm:h-14 sm:w-14"
              style={{ backgroundColor: badgeTone.accentSoft, borderColor: badgeTone.ring, color: "#091737" }}
            >
              <Award className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>

          <div className="mt-5 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#64748b]">Issued to</p>
            <p className="text-xl font-bold text-[#091737]">{candidateName}</p>
            <p className="text-sm font-medium text-[#3c4c58]">{targetRole}</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MetricTile label="Track" value={designationBucket} />
            <MetricTile label="Score" value={`${score}%`} />
            <MetricTile label="Status" value={isPass ? "Verified" : "Completed"} />
          </div>

          <div className="mt-5 flex items-start gap-3 border-t border-[#d8ddd7] pt-4">
            <Sparkles className="mt-0.5 h-5 w-5 text-[#23b61f]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748b]">Social ready</p>
              <p className="mt-1 text-sm leading-6 text-[#334155]">Download and post this badge on LinkedIn, X, or your portfolio.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={downloadBadge}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] px-5 py-3 text-sm font-bold text-[#091737] shadow-[0_18px_34px_rgba(52,205,47,0.24)] transition hover:translate-y-[-1px] sm:w-auto"
          >
            <Download className="h-4 w-4" />
            Download badge
          </button>
          <button
            type="button"
            onClick={copyShareText}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#dbe4d4] bg-white px-5 py-3 text-sm font-semibold text-[#091737] transition hover:bg-[#f6faf2] sm:w-auto"
          >
            <Copy className="h-4 w-4" />
            Copy share text
          </button>
          <button
            type="button"
            onClick={nativeShare}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#dbe4d4] bg-white px-5 py-3 text-sm font-semibold text-[#091737] transition hover:bg-[#f6faf2] sm:w-auto"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>

        {feedback ? <p className="mt-4 text-sm font-medium text-[#138d1a]">{feedback}</p> : null}
      </div>

      <div className="rounded-[2rem] border border-[#dbe4d4] bg-[#f8f4ed] p-5 text-[#091737] shadow-[0_24px_54px_rgba(9,23,55,0.08)] sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#1c9219]">Bring more people on board</p>
        <h2 className="mt-3 text-3xl text-[#091737]">Turn this result into momentum</h2>
        <p className="mt-4 text-sm leading-7 text-[#475569]">
          Your assessment result can become a lightweight growth engine for your own profile and for LXD Guild.
        </p>

        <div className="mt-6 space-y-4">
          <GrowthIdea
            title="Share on LinkedIn"
            copy="Post the badge with a short reflection on your learning journey to attract peers, recruiters, and employers."
            href={linkedInHref}
            label="Open LinkedIn share"
          />
          <GrowthIdea
            title="Share on X"
            copy="Use the copied share text to talk about your role focus, score band, and the skills you are sharpening next."
            href={xHref}
            label="Open X share"
          />
          <GrowthIdea
            title="Keep the momentum going"
            copy="Explore jobs, premium membership, or recommended courses while your assessment achievement is still fresh."
            href="/dashboard/jobs"
            label="Browse opportunities"
            internal
          />
        </div>

        <div className="mt-6 border-t border-[#d8ddd7] px-0 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748b]">Good next ideas for LXD Guild</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#475569]">
            <li>Public verification pages for each earned badge.</li>
            <li>Referral rewards when badge shares bring new signups.</li>
            <li>Monthly top verified talent showcase for employer visibility.</li>
            <li>Portfolio-ready badge packs for LinkedIn banners and CVs.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[#d8ddd7] bg-[#fbfaf7] px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#64748b]">{label}</p>
      <p className="mt-2 text-sm font-bold text-[#091737]">{value}</p>
    </div>
  );
}

function GrowthIdea({
  title,
  copy,
  href,
  label,
  internal,
}: {
  title: string;
  copy: string;
  href: string;
  label: string;
  internal?: boolean;
}) {
  const className =
    "inline-flex items-center gap-2 text-sm font-semibold text-[#138d1a] transition hover:text-[#0b7f14]";

  return (
    <div className="rounded-[1.35rem] border border-[#d8ddd7] bg-white px-4 py-4">
      <p className="text-base font-bold text-[#091737]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#475569]">{copy}</p>
      {internal ? (
        <Link href={href} className={`${className} mt-4`}>
          {label}
          <ExternalLink className="h-4 w-4" />
        </Link>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" className={`${className} mt-4`}>
          {label}
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

function createBadgeSvg({
  badgeLabel,
  badgeSubtitle,
  badgeTone,
  candidateName,
  targetRole,
  score,
  isPass,
}: {
  badgeLabel: string;
  badgeSubtitle: string;
  badgeTone: { accent: string; accentSoft: string; ring: string; status: string };
  candidateName: string;
  targetRole: string;
  score: number;
  isPass: boolean;
}) {
  const safeName = escapeXml(candidateName);
  const safeRole = escapeXml(targetRole);
  const safeBadge = escapeXml(badgeLabel);
  const safeSubtitle = escapeXml(badgeSubtitle);
  const safeStatus = escapeXml(badgeTone.status);

  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg width="1200" height="628" viewBox="0 0 1200 628" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="628" rx="34" fill="#081737"/>
    <rect x="28" y="28" width="1144" height="572" rx="30" fill="#0b1f43"/>
    <circle cx="1036" cy="112" r="174" fill="${badgeTone.accent}" fill-opacity="0.14"/>
    <circle cx="176" cy="76" r="148" fill="#5fd5ff" fill-opacity="0.12"/>
    <rect x="70" y="76" width="1060" height="476" rx="28" fill="#f7f1e9"/>
    <rect x="96" y="104" width="1008" height="98" rx="22" fill="#ffffff"/>
    <text x="132" y="146" fill="#64748B" font-family="Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="4">LXD GUILD BADGE</text>
    <text x="132" y="248" fill="#091737" font-family="Georgia, serif" font-size="64" font-style="italic" font-weight="700">${safeBadge}</text>
    <text x="132" y="288" fill="${badgeTone.accent}" font-family="Arial, sans-serif" font-size="22" font-weight="700">${safeSubtitle}</text>
    <rect x="132" y="332" width="468" height="116" rx="22" fill="#ffffff"/>
    <text x="164" y="370" fill="#64748B" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3">ISSUED TO</text>
    <text x="164" y="416" fill="#091737" font-family="Arial, sans-serif" font-size="34" font-weight="700">${safeName}</text>
    <text x="164" y="446" fill="#334155" font-family="Arial, sans-serif" font-size="22" font-weight="500">${safeRole}</text>
    <rect x="640" y="332" width="150" height="116" rx="22" fill="#ffffff"/>
    <text x="672" y="370" fill="#64748B" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3">SCORE</text>
    <text x="672" y="423" fill="#091737" font-family="Arial, sans-serif" font-size="42" font-weight="700">${score}%</text>
    <rect x="816" y="332" width="248" height="116" rx="22" fill="${badgeTone.accentSoft}"/>
    <text x="848" y="370" fill="#64748B" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3">STATUS</text>
    <text x="848" y="423" fill="#091737" font-family="Arial, sans-serif" font-size="32" font-weight="700">${isPass ? "Verified" : "Completed"}</text>
    <rect x="132" y="484" width="932" height="38" rx="19" fill="#eef4ea"/>
    <text x="164" y="510" fill="#475569" font-family="Arial, sans-serif" font-size="18" font-weight="600">${safeStatus} • Skill-first progress for modern L&amp;D careers</text>
    <circle cx="1016" cy="156" r="46" fill="${badgeTone.accentSoft}" stroke="${badgeTone.ring}" stroke-width="8"/>
    <path d="M996 156L1010 170L1038 142" stroke="#091737" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
