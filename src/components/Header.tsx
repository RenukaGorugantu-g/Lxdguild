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
  BookOpen,
  Building2,
  Briefcase,
  ChevronDown,
  Home,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  User,
  X,
} from "lucide-react";

const BRAND_LOGO_URL = "https://lxdguild.com/img/z-1.webp";

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
  const [isOfferMenuOpen, setIsOfferMenuOpen] = useState(false);
  const notificationCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userMenuCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offerMenuCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
        let nextProfile: HeaderProfile | null = profileResult.data;

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

        let nextProfile: HeaderProfile | null = profileResult.data;

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
      if (offerMenuCloseTimerRef.current) clearTimeout(offerMenuCloseTimerRef.current);
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
  const dashboardHref = user ? "/dashboard" : "/login";
  const jobBoardHref = user && (isCandidate || isVerifiedMVP || canViewJobBoard) ? "/dashboard/jobs" : "/jobs";
  const resourcesHref = "/dashboard/resources";
  const profileHref = user
    ? isEmployer
      ? "/dashboard/employer/profile"
      : isCandidate || isVerifiedMVP
        ? "/dashboard/candidate/profile"
        : "/dashboard"
    : "/membership";
  const isPublicMarketingRoute =
    !user &&
    (pathname === "/" ||
      pathname === "/candidate" ||
      pathname === "/employer" ||
      pathname === "/membership" ||
      pathname === "/login" ||
      pathname === "/register");

  const offerLinks: NavLink[] = [
    { href: "/candidate", label: "For Candidates" },
    { href: "/employer", label: "For Employers" },
    { href: "/membership", label: "Membership" },
  ];

  const primaryLinks: NavLink[] = [
    { href: jobBoardHref, label: "Job Board" },
    ...(user ? [{ href: "/dashboard/resources", label: "Resources" }] : []),
    { href: "/membership", label: "Membership" },
    { href: "/contact", label: "Contact" },
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
  const mobileTopNavVisible = Boolean(user) && isScrolled;

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

  const scheduleCloseOfferMenu = () => {
    if (offerMenuCloseTimerRef.current) clearTimeout(offerMenuCloseTimerRef.current);
    offerMenuCloseTimerRef.current = setTimeout(() => setIsOfferMenuOpen(false), 180);
  };

  const cancelCloseOfferMenu = () => {
    if (offerMenuCloseTimerRef.current) {
      clearTimeout(offerMenuCloseTimerRef.current);
      offerMenuCloseTimerRef.current = null;
    }
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[70] transition-all duration-300 ${
          isScrolled && user ? "pointer-events-none -translate-y-full opacity-0 lg:pointer-events-auto lg:translate-y-0 lg:opacity-100 lg:bg-[#f9fcf3]" : isScrolled ? "bg-[#f9fcf3]" : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div
            className="flex min-h-16 items-center justify-between rounded-[30px] border border-[#dfe8d8] bg-[#f9fcf3] px-4 shadow-[0_18px_45px_rgba(94,119,74,0.10)] sm:px-5"
          >
          <Link href={brandHref} className="group flex items-center" aria-label="LXD Guild home">
            <img src={BRAND_LOGO_URL} alt="LXD Guild" className="h-7 w-auto sm:h-8" />
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            <div className="relative" onMouseEnter={cancelCloseOfferMenu} onMouseLeave={scheduleCloseOfferMenu}>
              <button
                onClick={() => setIsOfferMenuOpen((open) => !open)}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#5e6c5a] transition-all hover:bg-[#eef5e5] hover:text-[#111827]"
              >
                What we offer
                <ChevronDown className={`h-4 w-4 transition-transform ${isOfferMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {isOfferMenuOpen && (
                <div className="absolute left-0 top-full mt-3 w-72 overflow-hidden rounded-[26px] border border-[#dfe8d8] bg-[#f9fcf3] shadow-[0_24px_80px_rgba(94,119,74,0.12)]">
                  <div className="border-b border-[#e6eedf] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#6d7d68]">
                    What we offer
                  </div>
                  <div className="space-y-1 p-2">
                    {offerLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOfferMenuOpen(false)}
                        className="block rounded-2xl px-3 py-3 text-sm font-semibold text-[#1f2937] transition-colors hover:bg-[#eef5e5]"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {primaryLinks.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "bg-[#ebf7e3] text-[#138d1a]"
                    : "text-[#5e6c5a] hover:bg-[#eef5e5] hover:text-[#111827]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {!user && (
              <div className="hidden items-center gap-2 lg:flex">
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[#111827] transition-all hover:bg-[#eef5e5]"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#118118,#2aa82b)] px-5 py-2.5 text-sm font-bold text-white transition-all hover:translate-y-[-1px] shadow-[0_16px_32px_rgba(24,124,29,0.18)]"
                >
                  <Sparkles className="h-4 w-4" /> Join the Guild
                </Link>
              </div>
            )}

            {user && (
              <div className="relative" onMouseEnter={cancelCloseNotifications} onMouseLeave={scheduleCloseNotifications}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative hidden h-11 w-11 items-center justify-center rounded-full border border-[#dfe8d8] bg-white text-[#475467] transition-all hover:bg-[#eef5e5] hover:text-[#111827] lg:inline-flex"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#34cd2f] ring-2 ring-white" />
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 top-full mt-3 w-80 overflow-hidden rounded-[24px] border border-[#dfe8d8] bg-[#f9fcf3] shadow-[0_24px_80px_rgba(94,119,74,0.14)]">
                    <div className="border-b border-[#e6eedf] px-4 py-3 text-sm font-semibold text-[#111827]">Notifications</div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-sm text-[#667085]">No notifications yet.</div>
                      ) : (
                        notifications.map((notification) => (
                          <div key={notification.id} className="border-b border-[#eef3ea] bg-white/60 p-3">
                            <p className="text-sm font-semibold text-[#111827]">{notification.title}</p>
                            <p className="mt-1 text-xs text-[#667085]">{notification.message}</p>
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
                  className="flex items-center gap-2 rounded-full border border-[#dfe8d8] bg-white px-2.5 py-1.5 transition-all hover:bg-[#eef5e5]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] text-xs font-bold text-[#091737]">
                    {profile?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="hidden pr-1 text-left sm:block">
                    <p className="text-xs font-bold leading-tight text-[#111827]">{profile?.name || "User"}</p>
                    <p className="text-[10px] leading-tight text-[#667085]">{isVerifiedMVP ? "MVP Verified" : roleLabel}</p>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-[#667085] transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-3 w-60 overflow-hidden rounded-[24px] border border-[#dfe8d8] bg-[#f9fcf3] shadow-[0_24px_80px_rgba(94,119,74,0.14)]">
                    {isVerifiedMVP && (
                      <div className="border-b border-[#e6eedf] bg-[linear-gradient(135deg,rgba(52,205,47,0.12),rgba(95,213,255,0.05))] px-4 py-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#111827]">
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
                          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-[#1f2937] transition-colors hover:bg-[#eef5e5]"
                        >
                          <link.icon className="h-4 w-4 text-[#15911b]" /> {link.label}
                        </Link>
                      ))}
                      {isEmployer && profile?.role === "employer_free" && (
                        <Link
                          href="/dashboard/employer/upgrade"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-[#1f2937] transition-colors hover:bg-[#eef5e5]"
                        >
                          <Settings className="h-4 w-4 text-[#15911b]" /> Upgrade Plan
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-[#e6eedf] p-2">
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-rose-700 transition-colors hover:bg-rose-50"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#dfe8d8] bg-white text-[#111827] transition-colors hover:bg-[#eef5e5]"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      </header>

      {mobileTopNavVisible ? (
      <div className="fixed inset-x-0 top-0 z-[69] mx-auto max-w-7xl px-4 sm:px-6 lg:hidden">
        <div
          className={`grid grid-cols-5 gap-2 rounded-b-[26px] border border-t-0 px-2 py-2 shadow-[0_18px_45px_rgba(94,119,74,0.12)] ${
            isPublicMarketingRoute
              ? "border-[#dfe8d8] bg-[#f9fcf3]"
              : "border-[#dbe6d7] bg-[#f9fcf3]"
          }`}
        >
          <Link
            href={brandHref}
            className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-colors ${
              pathname === brandHref ? "bg-[#eaf8e3] text-[#138d1a]" : "text-[#1f2937]"
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link
            href={jobBoardHref}
            className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-colors ${
              pathname.startsWith("/dashboard/jobs") ? "bg-[#eaf8e3] text-[#138d1a]" : "text-[#1f2937]"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Jobs</span>
          </Link>
          <Link
            href={profileHref}
            className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-colors ${
              pathname.startsWith("/dashboard/candidate/profile") || pathname.startsWith("/dashboard/employer/profile")
                ? "bg-[#eaf8e3] text-[#138d1a]"
                : "text-[#1f2937]"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Link>
          <Link
            href={resourcesHref}
            className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-colors ${
              pathname.startsWith("/dashboard/resources") ? "bg-[#eaf8e3] text-[#138d1a]" : "text-[#1f2937]"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Resources</span>
          </Link>
          <Link
            href={dashboardHref}
            className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-colors ${
              pathname === "/dashboard" || pathname === "/dashboard/candidate" || pathname === "/dashboard/employer" || pathname === "/dashboard/admin"
                ? "bg-[#eaf8e3] text-[#138d1a]"
                : "text-[#1f2937]"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
      ) : null}

      {isMobileMenuOpen && (
        <div className={`fixed inset-x-0 z-[71] mx-auto max-w-7xl px-4 sm:px-6 lg:hidden ${user ? (mobileTopNavVisible ? "top-[5.9rem]" : "top-[5.6rem]") : "top-[5.6rem]"}`}>
          <div className="space-y-1 rounded-[30px] border border-[#dbe6d7] bg-[#f9fcf3] px-3 py-3 shadow-[0_24px_80px_rgba(94,119,74,0.16)]">
            <div className="flex items-center justify-between px-3 pb-1 pt-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6d7d68]">
                More options
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dfe8d8] bg-white text-[#475467]"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-3 pb-1 pt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#6d7d68]">
              What we offer
            </div>
            {offerLinks.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center rounded-2xl px-3 py-3 text-sm font-semibold text-[#1f2937] transition-colors hover:bg-[#eef5e5]"
              >
                {link.label}
              </Link>
            ))}

            <div className="my-2 h-px bg-[#e4ece0]" />
            {primaryLinks.map((link) => (
              <Link
                key={`${link.label}-${link.href}`}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center rounded-2xl px-3 py-3 text-sm font-semibold text-[#1f2937] transition-colors hover:bg-[#eef5e5]"
              >
                <span className="inline-flex items-center gap-2">
                  {link.label}
                  {link.locked ? <Lock className="h-3.5 w-3.5 text-[#80ef7a]" /> : null}
                </span>
              </Link>
            ))}

            {!user && (
              <>
                <div className="my-2 h-px bg-[#e4ece0]" />
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center rounded-2xl px-3 py-3 text-sm font-semibold text-[#1f2937] transition-colors hover:bg-[#eef5e5]"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#34cd2f,#80ef7a)] px-4 py-3 text-sm font-bold text-[#091737]"
                >
                  Join the Guild
                </Link>
              </>
            )}

            {user && (
              <>
                <div className="my-2 h-px bg-[#e4ece0]" />
                {isEmployer && profile?.role === "employer_free" && (
                  <Link
                    href="/dashboard/employer/upgrade"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[#1f2937] transition-colors hover:bg-[#eef5e5]"
                  >
                    <Settings className="h-4 w-4 text-[#15911b]" /> Upgrade Plan
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-rose-700 transition-colors hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </>
  );
}

function CrownIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m2 7 4.5 5 5.5-8 5.5 8L22 7l-2 13H4L2 7Z" />
    </svg>
  );
}
