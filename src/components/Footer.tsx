import Link from "next/link";
import { BookOpen } from "lucide-react";

// Inline SVG social icons (lucide-react doesn't ship brand icons)
const SocialLinkedIn = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
  </svg>
);
const SocialYoutube = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.45A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.97C5.12 20 12 20 12 20s6.88 0 8.59-.45a2.78 2.78 0 0 0 1.95-1.97A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
    <polygon fill="#0b0c1e" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
  </svg>
);
const SocialInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const SocialX = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const SocialFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const footerLinks = {
  Platform: [
    { label: "Job Board", href: "/dashboard/jobs" },
    { label: "Candidate Dashboard", href: "/dashboard/candidate" },
    { label: "Professional Profile", href: "/dashboard/candidate/profile" },
    { label: "Skill Validation Exam", href: "/dashboard/candidate/exam" },
  ],
  Academy: [
    { label: "AI in Instructional Design", href: "https://lxdguildacademy.com/mastering-ai-in-instructional-design/", external: true },
    { label: "CLXD Bootcamp", href: "https://lxdguildacademy.com/certified-learning-experience-designerclxd/", external: true },
    { label: "Storyline 360", href: "https://lxdguildacademy.com/storyline/", external: true },
    { label: "Camtasia", href: "https://lxdguildacademy.com/camtasia/", external: true },
  ],
  Company: [
    { label: "Home", href: "https://lxdguild.com", external: true },
    { label: "LXDVerse", href: "https://lxdguild.com/about.html", external: true },
    { label: "Events", href: "https://lxdguild.com/events.html", external: true },
    { label: "Contact", href: "https://lxdguild.com/contact.html", external: true },
  ],
  Legal: [
    { label: "Privacy Policy", href: "https://lxdguild.com/privacy-policy.html", external: true },
    { label: "Terms & Conditions", href: "https://lxdguild.com/terms-conditions.html", external: true },
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
    <footer className="bg-[#0b0c1e] border-t border-white/5 text-white">
      {/* CTA Banner */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-brand-400 uppercase mb-2">COME. CONNECT. COLLABORATE.</p>
            <h3 className="text-2xl font-bold text-white">Shaping the Future of Learning Experience Design</h3>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/register" className="px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 transition-all hover:scale-[1.02] text-sm">
              Join the Guild
            </Link>
            <a href="https://lxdguild.com/contact.html" target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-white/10 text-white/70 font-bold rounded-xl hover:bg-white/5 transition-all text-sm">
              Contact Us
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          {/* Brand Column */}
          <div className="col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-lg tracking-tight block">LXD Guild</span>
                <span className="text-[9px] text-brand-400 font-medium uppercase tracking-[0.2em]">Verified Talent Marketplace</span>
              </div>
            </Link>

            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              A vibrant space where learning professionals come together to grow, share, and shape the future of learning experience design.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-brand-600 text-white/40 hover:text-white transition-all hover:scale-110"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Nav Columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section} className="space-y-4">
              <h4 className="text-[10px] font-bold tracking-[0.25em] text-brand-400 uppercase">{section}</h4>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white/40 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-sm text-white/40 hover:text-white transition-colors">
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

      {/* Bottom Bar */}
      <div className="border-t border-white/5 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} LXD Guild. All rights reserved. Powered by{" "}
            <a href="https://lxdguild.com" target="_blank" rel="noopener noreferrer" className="text-brand-400/60 hover:text-brand-400 transition-colors">
              Maple Learning Solutions
            </a>.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://lxdguildacademy.com" target="_blank" rel="noopener noreferrer" className="text-xs text-white/25 hover:text-white/50 transition-colors">LXD Academy</a>
            <span className="text-white/10">·</span>
            <a href="https://lxdguild.com" target="_blank" rel="noopener noreferrer" className="text-xs text-white/25 hover:text-white/50 transition-colors">LXDVerse</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
