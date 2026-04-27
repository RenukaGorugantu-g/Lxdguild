import Link from "next/link";
import { BookOpen } from "lucide-react";

const SocialLinkedIn = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const SocialYoutube = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon fill="#091737" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
  </svg>
);

const SocialInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const SocialX = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const SocialFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const footerLinks = {
  Platform: [
    { label: "Candidate", href: "/candidate" },
    { label: "Employer", href: "/employer" },
    { label: "Job Board", href: "/dashboard/jobs" },
    { label: "Candidate Dashboard", href: "/dashboard/candidate" },
    { label: "Professional Profile", href: "/dashboard/candidate/profile" },
  ],
  Membership: [
    { label: "Membership Benefits", href: "/membership" },
    { label: "Resources", href: "/dashboard/resources" },
    { label: "Membership", href: "/dashboard/membership" },
    { label: "Skill Validation Exam", href: "/dashboard/candidate/exam" },
  ],
  Company: [
    { label: "Community", href: "https://lxdguild.com", external: true },
    { label: "Academy", href: "https://lxdguildacademy.com", external: true },
    { label: "Events", href: "https://lxdguild.com/events.html", external: true },
    { label: "Contact", href: "/contact" },
  ],
};

const socialLinks = [
  { Icon: SocialLinkedIn, href: "https://in.linkedin.com/company/lxd-guild", label: "LinkedIn" },
  { Icon: SocialYoutube, href: "https://www.youtube.com/@lxdguild", label: "YouTube" },
  { Icon: SocialInstagram, href: "https://www.instagram.com/lxd_guild/", label: "Instagram" },
  { Icon: SocialX, href: "https://x.com/GuildLxd20077", label: "X" },
  { Icon: SocialFacebook, href: "https://www.facebook.com/100648556092707/", label: "Facebook" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#08122a] text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-10 md:flex-row md:items-center">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-[#34cd2f]">Come. Connect. Collaborate.</p>
            <h3 className="text-2xl font-bold text-white">A clearer path for L&D talent, jobs, and resources.</h3>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/register" className="rounded-full bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] px-6 py-3 text-sm font-bold text-[#091737] shadow-[0_18px_40px_rgba(52,205,47,0.24)] transition-all hover:translate-y-[-1px]">
              Join the Guild
            </Link>
            <Link href="/contact" className="rounded-full border border-white/14 px-6 py-3 text-sm font-bold text-[#cde3e1] transition-all hover:bg-white/6">
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2 space-y-6">
            <Link href="/" className="group flex w-fit items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] text-[#091737] shadow-[0_18px_40px_rgba(52,205,47,0.24)]">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-lg font-bold tracking-tight text-white">LXD Guild</span>
                <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-[#cde3e1]/70">Verified Talent Marketplace</span>
              </div>
            </Link>

            <p className="max-w-xs text-sm leading-relaxed text-[#cde3e1]/72">
              A vibrant space where learning professionals come together to grow, share, and shape the future of learning experience design.
            </p>

            <div className="flex items-center gap-2">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/6 text-[#cde3e1]/60 transition-all hover:scale-105 hover:bg-white/12 hover:text-white"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section} className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#34cd2f]">{section}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-[#cde3e1]/70 transition-colors hover:text-white">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-sm text-[#cde3e1]/70 transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-[#cde3e1]/45">
            © {new Date().getFullYear()} LXD Guild. All rights reserved. Powered by{" "}
            <a href="https://lxdguild.com" target="_blank" rel="noopener noreferrer" className="text-[#34cd2f]/80 transition-colors hover:text-[#34cd2f]">
              Maple Learning Solutions
            </a>.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://lxdguildacademy.com" target="_blank" rel="noopener noreferrer" className="text-xs text-[#cde3e1]/45 transition-colors hover:text-white">
              LXD Academy
            </a>
            <span className="text-white/10">·</span>
            <a href="https://lxdguild.com" target="_blank" rel="noopener noreferrer" className="text-xs text-[#cde3e1]/45 transition-colors hover:text-white">
              LXDVerse
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
