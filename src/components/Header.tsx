"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { 
  Briefcase, User, LayoutDashboard, BookOpen, Menu, X, 
  ChevronDown, LogOut, BadgeCheck, Settings, Bell
} from "lucide-react";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from("profiles").select("name, role, verification_status").eq("id", user.id).single();
        setProfile(data);
      }
    };
    fetchUser();
  }, [pathname]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      const response = await fetch('/api/notifications');
      if (!response.ok) return;
      const result = await response.json();
      setNotifications(result.notifications || []);
    };
    fetchNotifications();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = "/login";
  };

  const navLinks = [
    { href: "https://lxdguild.com", label: "HOME", external: true },
    { href: "https://lxdguild.com/about.html", label: "LXDVERSE", external: true },
    { href: "https://lxdguildacademy.com", label: "ACADEMY", external: true },
    { href: "https://lxdguild.com/events.html", label: "EVENTS", external: true },
    { href: "https://lxdguild.com/contact.html", label: "CONTACT", external: true },
  ];

  const isEmployer = profile?.role?.startsWith("employer");
  const isCandidate = profile?.role?.startsWith("candidate");
  const isVerifiedMVP = profile?.role === "candidate_mvp";
  const isAdmin = profile?.role === "admin";
  const canAccessJobBoard = isVerifiedMVP || isAdmin;

  const dashboardLinks = user ? [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(isEmployer ? [
      { href: "/dashboard/employer", label: "Employer Hub", icon: Briefcase },
    ] : []),
    ...(isCandidate ? [
      { href: "/dashboard/candidate/profile", label: "My Profile", icon: User },
      { href: "/dashboard/candidate/applications", label: "My Applications", icon: Briefcase },
    ] : []),
    ...(canAccessJobBoard ? [
      { href: "/dashboard/jobs", label: "Job Board", icon: Briefcase },
    ] : []),
  ] : [];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0b0c1e]/95 backdrop-blur-xl shadow-2xl shadow-brand-900/20 border-b border-white/5"
          : "bg-[#0b0c1e]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <span className="font-bold text-white text-lg tracking-tight">LXD Guild</span>
            <span className="hidden sm:block text-[9px] text-brand-400 uppercase tracking-[0.2em] font-medium -mt-0.5">Verified Talent Marketplace</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="px-3 py-2 text-xs font-semibold tracking-widest text-white/60 hover:text-brand-400 transition-colors"
            >
              {link.label}
            </a>
          ))}
          {user && (
            <div className="w-px h-4 bg-white/10 mx-2" />
          )}
          {dashboardLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "text-white bg-brand-600/30 border border-brand-500/30"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative inline-flex items-center justify-center p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/80"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter((notification) => !notification.is_read).length > 0 && (
                  <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-rose-500 border border-black" />
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#12142a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-white/5 text-sm font-semibold text-white">Notifications</div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-sm text-zinc-400">No notifications yet.</div>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className="p-3 border-b border-white/5 bg-white/5">
                          <p className="text-sm font-semibold text-white">{notification.title}</p>
                          <p className="text-xs text-zinc-400 mt-1">{notification.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-brand-500 to-accent-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                  {profile?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-white leading-tight">{profile?.name || "User"}</p>
                  <p className="text-[10px] text-white/40 leading-tight">{isVerifiedMVP ? "✦ MVP Verified" : profile?.role || "Member"}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#12142a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {isVerifiedMVP && (
                    <div className="px-4 py-3 border-b border-white/5 bg-gradient-to-r from-brand-900/50 to-accent-900/20">
                      <div className="flex items-center gap-2 text-brand-300 text-xs font-bold">
                        <BadgeCheck className="w-4 h-4 text-brand-400" /> MVP Verified Candidate
                      </div>
                    </div>
                  )}
                  <div className="p-2 space-y-0.5">
                    <Link href="/dashboard" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                      <LayoutDashboard className="w-4 h-4 text-brand-400" /> Dashboard
                    </Link>
                    {isCandidate && (
                      <Link href="/dashboard/candidate/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <User className="w-4 h-4 text-brand-400" /> My Profile
                      </Link>
                    )}
                    {isCandidate && (
                      <Link href="/dashboard/candidate/applications" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <Briefcase className="w-4 h-4 text-brand-400" /> My Applications
                      </Link>
                    )}
                    {canAccessJobBoard && (
                      <Link href="/dashboard/jobs" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <Briefcase className="w-4 h-4 text-brand-400" /> Job Board
                      </Link>
                    )}
                    {isEmployer && (
                      <Link href="/dashboard/employer" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <Briefcase className="w-4 h-4 text-brand-400" /> Employer Hub
                      </Link>
                    )}
                    {isEmployer && (
                      <Link href="/dashboard/employer/post-job" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <Briefcase className="w-4 h-4 text-brand-400" /> Post Job
                      </Link>
                    )}
                    {isEmployer && profile?.role === "employer_free" && (
                      <Link href="/dashboard/employer/upgrade" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                        <Settings className="w-4 h-4 text-brand-400" /> Upgrade Plan
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-white/5 p-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-4 py-2 text-sm text-white/70 font-semibold hover:text-white transition-colors">
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 hover:shadow-brand-500/40 hover:scale-[1.02] transition-all"
              >
                Join Now
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-white/60 hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#0b0c1e] border-t border-white/5 px-6 py-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
          {navLinks.map(link => (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center px-3 py-3 text-xs font-bold tracking-widest text-white/60 hover:text-brand-400 rounded-xl hover:bg-white/5 transition-colors"
            >
              {link.label}
            </a>
          ))}
          {user && (
            <>
              <div className="h-px bg-white/5 my-2" />
              {dashboardLinks.map(link => (
                <Link key={link.href} href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm text-white/70 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                >
                  <link.icon className="w-4 h-4 text-brand-400" /> {link.label}
                </Link>
              ))}
              <button onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
