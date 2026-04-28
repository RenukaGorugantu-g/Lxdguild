"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import {
  canViewJobBoardRole,
  getBaseRole,
  getRoleDisplayLabel,
  isCandidateRole,
  isEmployerRole,
  isVerifiedCandidateRole,
} from "@/lib/profile-role";
import {
  BadgeCheck,
  Bell,
  Building2,
  Briefcase,
  ChevronDown,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  User,
  X,
} from "lucide-react";

type HeaderProfile = {
  name?: string | null;
  role?: string | null;
  verification_status?: string | null;
  membership_status?: string | null;
  membership_plan?: string | null;
  membership_expires_at?: string | null;
};

type HeaderNotification = {
  id: string;
  title: string;
  message: string;
  is_read?: boolean | null;
};

type NavLink = {
  href: string;
  label: string;
  external?: boolean;
  locked?: boolean;
};

function deriveProfileFromUser(user: SupabaseUser): HeaderProfile {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const roleFromMetadata = typeof metadata?.role === "string" ? metadata.role : null;
  
  // Default to candidate_onhold if no role in metadata (will be fixed by server-side logic)
  const defaultRole = roleFromMetadata || "candidate_onhold";

  return {
    name:
      typeof metadata?.name === "string" && metadata.name.trim().length > 0
        ? metadata.name
        : user.email?.split("@")[0] || "User",
    role: defaultRole,
    membership_status: null,
    membership_plan: null,
    membership_expires_at: null,
  };
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<HeaderProfile | null>(null);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notificationCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userMenuCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const profileResult = await supabase
          .from("profiles")
          .select("name, role, verification_status, membership_status, membership_plan, membership_expires_at")
          .eq("id", user.id)
          .single();
        let nextProfile = profileResult.data;

        if (profileResult.error?.code === "42703") {
          const fallback = await supabase
            .from("profiles")
            .select("name, role, verification_status, membership_status")
            .eq("id", user.id)
            .single();
          nextProfile = fallback.data
            ? {
                ...fallback.data,
                membership_plan: null,
                membership_expires_at: null,
              }
            : null;
        }

        if (!nextProfile) {
          nextProfile = deriveProfileFromUser(user);
        }

        setProfile(nextProfile);
      } else {
        setProfile(null);
      }
    };

    fetchUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        return;
      }

      void (async () => {
        const profileResult = await supabase
          .from("profiles")
          .select("name, role, verification_status, membership_status, membership_plan, membership_expires_at")
          .eq("id", nextUser.id)
          .single();

        let nextProfile = profileResult.data;

        if (profileResult.error?.code === "42703") {
          const fallback = await supabase
            .from("profiles")
            .select("name, role, verification_status, membership_status")
            .eq("id", nextUser.id)
            .single();
          nextProfile = fallback.data
            ? {
                ...fallback.data,
                membership_plan: null,
                membership_expires_at: null,
              }
            : null;
        }

        setProfile(nextProfile || deriveProfileFromUser(nextUser));
      })();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id || !isNotificationsOpen) return;

      const response = await fetch("/api/notifications");
      if (!response.ok) return;
      const result = await response.json();
      setNotifications(result.notifications || []);
    };

    fetchNotifications();
  }, [isNotificationsOpen, user]);

  useEffect(() => {
    return () => {
      if (notificationCloseTimerRef.current) clearTimeout(notificationCloseTimerRef.current);
      if (userMenuCloseTimerRef.current) clearTimeout(userMenuCloseTimerRef.current);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = "/login";
  };

  const isEmployer = isEmployerRole(profile?.role);
  const isCandidate = isCandidateRole(profile?.role);
  const isVerifiedMVP = isVerifiedCandidateRole(profile?.role);
  const canViewJobBoard = canViewJobBoardRole(profile?.role);
  const canApplyToJobs = isVerifiedMVP || profile?.role === "candidate_onhold";
  const roleLabel = getRoleDisplayLabel(profile);
  const baseRole = getBaseRole(profile);
  const brandHref = baseRole === "candidate" ? "/candidate" : baseRole === "employer" ? "/employer" : "/";
  const isPublicMarketingRoute =
    !user &&
    (pathname === "/" ||
      pathname === "/candidate" ||
      pathname === "/employer" ||
      pathname === "/membership" ||
      pathname === "/login" ||
      pathname === "/register");

  const primaryLinks: NavLink[] = [
    { href: "/membership", label: "Membership" },
    { href: "/contact", label: "Contact" },
    { href: "https://lxdguild.com", label: "Community", external: true },
    { href: "https://lxdguildacademy.com", label: "Academy", external: true },
    ...(isCandidate || isVerifiedMVP || canViewJobBoard
      ? [{ href: "/dashboard/jobs", label: "Marketplace", locked: !canApplyToJobs }]
      : []),
    { href: user ? "/dashboard/resources" : "/candidate", label: "Resources" },
  ];

  const dashboardLinks = user
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/membership", label: "Membership", icon: CrownIcon },
        ...(isEmployer ? [{ href: "/dashboard/employer", label: "Employer Hub", icon: Briefcase }] : []),
        ...(isEmployer ? [{ href: "/dashboard/employer/profile", label: "Employer Profile", icon: Building2 }] : []),
        ...(isCandidate ? [{ href: "/dashboard/candidate/profile", label: "My Profile", icon: User }] : []),
        ...(isCandidate ? [{ href: "/dashboard/candidate/applications", label: "My Applications", icon: Briefcase }] : []),
        ...(isCandidate || isVerifiedMVP || canViewJobBoard ? [{ href: "/dashboard/jobs", label: "Job Board", icon: Briefcase }] : []),
      ]
    : [];

  const unreadNotifications = notifications.filter((notification) => !notification.is_read).length;

  const scheduleCloseNotifications = () => {
    if (notificationCloseTimerRef.current) clearTimeout(notificationCloseTimerRef.current);
    notificationCloseTimerRef.current = setTimeout(() => setIsNotificationsOpen(false), 1800);
  };

  const cancelCloseNotifications = () => {
    if (notificationCloseTimerRef.current) {
      clearTimeout(notificationCloseTimerRef.current);
      notificationCloseTimerRef.current = null;
    }
  };

  const scheduleCloseUserMenu = () => {
    if (userMenuCloseTimerRef.current) clearTimeout(userMenuCloseTimerRef.current);
    userMenuCloseTimerRef.current = setTimeout(() => setIsUserMenuOpen(false), 1800);
  };

  const cancelCloseUserMenu = () => {
    if (userMenuCloseTimerRef.current) {
      clearTimeout(userMenuCloseTimerRef.current);
      userMenuCloseTimerRef.current = null;
    }
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        isPublicMarketingRoute
          ? isScrolled
            ? "border-b border-[#dfe8d8] bg-[#f9fcf3]/92 backdrop-blur-2xl"
            : "bg-[#f9fcf3]"
          : isScrolled
            ? "border-b border-white/10 bg-[var(--bg-dark)]/92 backdrop-blur-2xl"
            : "bg-[var(--bg-dark)]"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div
          className={`flex min-h-16 items-center justify-between rounded-[28px] px-4 sm:px-5 ${
            isPublicMarketingRoute
              ? "border border-[#dfe8d8] bg-white/86 shadow-[0_18px_45px_rgba(94,119,74,0.08)]"
              : "border border-white/10 bg-[linear-gradient(180deg,rgba(9,23,55,0.96),rgba(9,23,55,0.88))] shadow-[0_24px_80px_rgba(3,10,26,0.45)]"
          }`}
        >
          <Link href={brandHref} className="group flex items-center gap-3">
            <div className="leading-tight">
              <span className={`block text-lg font-extrabold tracking-[0.03em] ${isPublicMarketingRoute ? "text-[#138d1a]" : "text-white"}`}>LXD Guild</span>
              <span className={`hidden text-[10px] font-semibold uppercase tracking-[0.26em] sm:block ${isPublicMarketingRoute ? "text-[#74826e]" : "text-[#cde3e1]/72"}`}>
                Career ecosystem
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            {primaryLinks.map((link) =>
              link.external ? (
                <a
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    isPublicMarketingRoute
                      ? "text-[#5e6c5a] hover:bg-[#eef5e5] hover:text-[#111827]"
                      : "text-[#cde3e1] hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    pathname === link.href || pathname.startsWith(link.href + "/")
                      ? isPublicMarketingRoute
                        ? "bg-[#ebf7e3] text-[#138d1a]"
                        : "bg-white/14 text-white"
                      : isPublicMarketingRoute
                        ? "text-[#5e6c5a] hover:bg-[#eef5e5] hover:text-[#111827]"
                        : "text-[#cde3e1] hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {link.label}
                    {link.locked ? <Lock className="h-3.5 w-3.5 text-[#80ef7a]" /> : null}
                  </span>
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {!user && (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/login"
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    isPublicMarketingRoute
                      ? "text-[#111827] hover:bg-[#eef5e5]"
                      : "text-[#cde3e1] hover:bg-white/8 hover:text-white"
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all hover:translate-y-[-1px] ${
                    isPublicMarketingRoute
                      ? "bg-[linear-gradient(135deg,#118118,#2aa82b)] text-white shadow-[0_16px_32px_rgba(24,124,29,0.18)]"
                      : "bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] text-[#091737] shadow-[0_18px_40px_rgba(52,205,47,0.24)]"
                  }`}
                >
                  <Sparkles className="h-4 w-4" /> Get Started
                </Link>
              </div>
            )}

            {user && (
              <div className="relative" onMouseEnter={cancelCloseNotifications} onMouseLeave={scheduleCloseNotifications}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/82 transition-all hover:bg-white/12"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#34cd2f] ring-2 ring-[#091737]" />
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 top-full mt-3 w-80 overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,23,55,0.98),rgba(16,33,72,0.92))] shadow-[0_24px_80px_rgba(3,10,26,0.45)] backdrop-blur-2xl">
                    <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-white">Notifications</div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-[#cde3e1]/72">No notifications yet.</div>
                      ) : (
                        notifications.map((notification) => (
                          <div key={notification.id} className="border-b border-white/6 bg-white/[0.04] p-3">
                            <p className="text-sm font-semibold text-white">{notification.title}</p>
                            <p className="mt-1 text-xs text-[#cde3e1]/72">{notification.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="relative" onMouseEnter={cancelCloseUserMenu} onMouseLeave={scheduleCloseUserMenu}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-2.5 py-1.5 transition-all hover:bg-white/12"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] text-xs font-bold text-[#091737]">
                    {profile?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="hidden pr-1 text-left sm:block">
                    <p className="text-xs font-bold leading-tight text-white">{profile?.name || "User"}</p>
                    <p className="text-[10px] leading-tight text-[#cde3e1]/72">{isVerifiedMVP ? "MVP Verified" : roleLabel}</p>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-white/55 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-3 w-60 overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,23,55,0.98),rgba(16,33,72,0.92))] shadow-[0_24px_80px_rgba(3,10,26,0.45)] backdrop-blur-2xl">
                    {isVerifiedMVP && (
                      <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(52,205,47,0.18),rgba(95,213,255,0.08))] px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                          <BadgeCheck className="h-4 w-4 text-[#34cd2f]" /> MVP Verified Candidate
                        </div>
                      </div>
                    )}
                    <div className="space-y-1 p-2">
                      {dashboardLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-[#cde3e1] transition-colors hover:bg-white/8 hover:text-white"
                        >
                          <link.icon className="h-4 w-4 text-[#34cd2f]" /> {link.label}
                        </Link>
                      ))}
                      {isEmployer && profile?.role === "employer_free" && (
                        <Link
                          href="/dashboard/employer/upgrade"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-[#cde3e1] transition-colors hover:bg-white/8 hover:text-white"
                        >
                          <Settings className="h-4 w-4 text-[#34cd2f]" /> Upgrade Plan
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-white/10 p-2">
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/82 transition-colors hover:bg-white/12 lg:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="mx-auto mt-3 max-w-7xl px-4 sm:px-6 lg:hidden">
          <div className="space-y-1 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,23,55,0.98),rgba(16,33,72,0.94))] px-3 py-3 shadow-[0_24px_80px_rgba(3,10,26,0.45)] backdrop-blur-2xl">
            {primaryLinks.map((link) =>
              link.external ? (
                <a
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center rounded-2xl px-3 py-3 text-sm font-semibold text-[#cde3e1] transition-colors hover:bg-white/6 hover:text-white"
                >
                  <span className="inline-flex items-center gap-2">
                    {link.label}
                    {link.locked ? <Lock className="h-3.5 w-3.5 text-[#80ef7a]" /> : null}
                  </span>
                </a>
              ) : (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center rounded-2xl px-3 py-3 text-sm font-semibold text-[#cde3e1] transition-colors hover:bg-white/6 hover:text-white"
                >
                  <span className="inline-flex items-center gap-2">
                    {link.label}
                    {link.locked ? <Lock className="h-3.5 w-3.5 text-[#80ef7a]" /> : null}
                  </span>
                </Link>
              )
            )}

            {!user && (
              <>
                <div className="my-2 h-px bg-white/10" />
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center rounded-2xl px-3 py-3 text-sm font-semibold text-[#cde3e1] transition-colors hover:bg-white/6 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] px-4 py-3 text-sm font-bold text-[#091737]"
                >
                  Join Guild
                </Link>
              </>
            )}

            {user && (
              <>
                <div className="my-2 h-px bg-white/10" />
                {dashboardLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[#cde3e1] transition-colors hover:bg-white/6 hover:text-white"
                  >
                    <link.icon className="h-4 w-4 text-[#34cd2f]" /> {link.label}
                  </Link>
                ))}
                {isEmployer && profile?.role === "employer_free" && (
                  <Link
                    href="/dashboard/employer/upgrade"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[#cde3e1] transition-colors hover:bg-white/6 hover:text-white"
                  >
                    <Settings className="h-4 w-4 text-[#34cd2f]" /> Upgrade Plan
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-rose-300 transition-colors hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function CrownIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m2 7 4.5 5 5.5-8 5.5 8L22 7l-2 13H4L2 7Z" />
    </svg>
  );
}
