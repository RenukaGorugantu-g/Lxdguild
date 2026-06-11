"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getBucketForTargetRoleOrNull, OTHER_TARGET_ROLE_VALUE, TARGET_ROLE_OPTIONS } from "@/lib/assessment";
import { ArrowRight, BriefcaseBusiness, Check, Eye, EyeOff, SearchCheck } from "lucide-react";

const CANONICAL_AUTH_REDIRECT_BASE =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://lxdmarketplace.lxdguild.com";

type PathCardProps = {
  selected: boolean;
  title: string;
  description: string;
  icon: typeof SearchCheck;
  onSelect: () => void;
};

type ExistingAccountState = {
  email: string;
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}

function getExperienceMetadata(value: string) {
  switch (value) {
    case "0.5":
      return { years: 0.5, level: "entry_level" };
    case "2":
      return { years: 2, level: "mid_level" };
    case "4":
      return { years: 4, level: "mid_level" };
    case "7":
      return { years: 7, level: "senior_level" };
    case "10":
      return { years: 10, level: "lead_level" };
    default:
      return { years: 2, level: "mid_level" };
  }
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const initialRole = roleParam === "employer" ? "employer_free" : "candidate_onhold";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [candidateTargetRole, setCandidateTargetRole] = useState("Instructional Designer");
  const [candidateOtherTargetRole, setCandidateOtherTargetRole] = useState("");
  const [candidateExperienceYears, setCandidateExperienceYears] = useState("2");
  const [employerDesignation, setEmployerDesignation] = useState("hiring_manager");
  const [companyName, setCompanyName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingAccount, setExistingAccount] = useState<ExistingAccountState | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const normalizedOtherCandidateRole = candidateOtherTargetRole.trim();
  const isCustomCandidateRole = candidateTargetRole === OTHER_TARGET_ROLE_VALUE;
  const resolvedCandidateTargetRole =
    selectedRole === "candidate_onhold"
      ? isCustomCandidateRole
        ? normalizedOtherCandidateRole
        : candidateTargetRole
      : "";
  const candidateBucket = getBucketForTargetRoleOrNull(resolvedCandidateTargetRole);
  const candidateExperience = getExperienceMetadata(candidateExperienceYears);
  const name = `${firstName} ${lastName}`.trim();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setExistingAccount(null);

    if (!agreedToTerms) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
      setLoading(false);
      return;
    }

    if (selectedRole === "candidate_onhold" && candidateTargetRole === OTHER_TARGET_ROLE_VALUE && !normalizedOtherCandidateRole) {
      setError("Please enter the role title so we can assign the right assessment after registration.");
      setLoading(false);
      return;
    }

    const verificationNextPath =
      selectedRole === "employer_free" ? "/dashboard/employer?verified=1" : "/dashboard/candidate/welcome?verified=1";
    const emailRedirectTo = `${CANONICAL_AUTH_REDIRECT_BASE.replace(/\/$/, "")}/auth/confirm?next=${encodeURIComponent(verificationNextPath)}`;

    const existingEmailResponse = await fetch("/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const existingEmailResult = (await existingEmailResponse.json()) as {
      exists?: boolean;
      error?: string;
    };

    if (!existingEmailResponse.ok) {
      setError(existingEmailResult.error || "We couldn't verify this email address right now.");
      setLoading(false);
      return;
    }

    if (existingEmailResult.exists) {
      setExistingAccount({ email });
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          name,
          role: selectedRole,
          candidate_target_role: selectedRole === "candidate_onhold" ? resolvedCandidateTargetRole : null,
          candidate_designation: selectedRole === "candidate_onhold" ? candidateBucket : null,
          experience_level:
            selectedRole === "candidate_onhold" && !isCustomCandidateRole
              ? candidateExperience.level
              : null,
          experience_years: selectedRole === "candidate_onhold" ? candidateExperience.years : null,
          employer_designation: selectedRole === "employer_free" ? employerDesignation : null,
          company_name: selectedRole === "employer_free" ? companyName : null,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    await fetch("/api/notifications/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        role: selectedRole,
        candidateTargetRole: selectedRole === "candidate_onhold" ? resolvedCandidateTargetRole : null,
        candidateDesignation: selectedRole === "candidate_onhold" ? candidateBucket : null,
        employerDesignation: selectedRole === "employer_free" ? employerDesignation : null,
        companyName: selectedRole === "employer_free" ? companyName : null,
      }),
    });

    setLoading(false);
    if (data.session) {
      router.replace(selectedRole === "employer_free" ? "/dashboard/employer" : "/dashboard/candidate/welcome");
      router.refresh();
      return;
    }

    router.replace(`/verify-email?email=${encodeURIComponent(email)}&role=${encodeURIComponent(selectedRole)}`);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faef_0%,#eff5e4_100%)] text-[#202733]">
      <main className="mx-auto flex w-full max-w-[1320px] items-center px-5 py-24 md:px-8 lg:px-10">
        <div className="grid w-full lg:grid-cols-[0.9fr_1fr]">
          <section className="flex flex-col justify-between bg-[#0a8615] px-7 py-8 text-white md:px-10 md:py-10 lg:min-h-[680px]">
            <div>
              <div className="max-w-[420px]">
                <h2 className="text-[1.7rem] font-medium tracking-[-0.04em]">Unlock your next career chapter.</h2>
                <p className="mt-6 text-[1rem] leading-7 text-[#b7f0b3]">
                  Join 50,000+ professionals who have accelerated their career path with our AI-driven ecosystem.
                </p>

                <div className="mt-8 space-y-6">
                  <BenefitItem
                    title="Personalized Job Matching"
                    description="AI algorithms that find roles based on your DNA, not just keywords."
                  />
                  <BenefitItem
                    title="Direct Talent Connection"
                    description="Skip the queue and message hiring managers directly in the platform."
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 max-w-[370px] rounded-[18px] bg-[#b4d8ab] px-5 py-5 text-[#294129] shadow-[0_18px_34px_rgba(20,63,24,0.14)]">
              <div className="mb-4 flex gap-1 text-[#f2b516]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index}>★</span>
                ))}
              </div>
              <p className="text-[1.02rem] italic leading-8">
                &quot;CareerFlow helped me land a Senior Designer role in just 3 weeks. The transparency is unlike any other platform.&quot;
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8edd0] text-sm font-bold text-[#485b34]">SM</div>
                <div>
                  <p className="font-medium text-[#294129]">Sarah Miller</p>
                  <p className="text-sm text-[#5d7a58]">Lead UX/UIX Designer</p>
                </div>
              </div>
            </div>

            <p className="mt-10 text-[11px] uppercase tracking-[0.12em] text-[#8bd98d]">© 2024 CareerFlow Ecosystem. All rights reserved.</p>
          </section>

          <section className="bg-[radial-gradient(circle_at_top_left,rgba(199,248,174,0.32),transparent_24%),linear-gradient(180deg,#f8faef_0%,#f4f8ec_100%)] px-6 py-8 md:px-10 md:py-10 lg:min-h-[680px]">
            <div className="mx-auto flex h-full w-full max-w-[520px] flex-col">
              <div className="flex items-center justify-between gap-5">
                <div className="w-full">
                  <div className="flex items-center justify-between text-[14px] text-[#676f7d]">
                    <span>Create Account</span>
                    <span>Step 1 of 3</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[#e1e6d7]">
                    <div className="h-1.5 w-[34%] rounded-full bg-[#1d6d1a]" />
                  </div>
                </div>
              </div>

              <form onSubmit={handleRegister} className="mt-8 flex flex-1 flex-col">
                <div className="space-y-4">
                  <div>
                    <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#5d6673]">Choose your path</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <PathCard
                        selected={selectedRole === "candidate_onhold"}
                        title="Job Seeker"
                        description="I&apos;m looking for my next role"
                        icon={SearchCheck}
                        onSelect={() => setSelectedRole("candidate_onhold")}
                      />
                      <PathCard
                        selected={selectedRole === "employer_free"}
                        title="Employer"
                        description="I&apos;m looking to hire talent"
                        icon={BriefcaseBusiness}
                        onSelect={() => setSelectedRole("employer_free")}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field id="first-name" label="First Name" placeholder="Jane" value={firstName} onChange={setFirstName} />
                    <Field id="last-name" label="Last Name" placeholder="Doe" value={lastName} onChange={setLastName} />
                  </div>

                  <Field
                    id="email"
                    label="Email Address"
                    type="email"
                    placeholder="jane.doe@example.com"
                    value={email}
                    onChange={setEmail}
                  />

                  <div>
                    <label htmlFor="password" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#5d6673]">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        className="h-[54px] w-full rounded-[10px] border border-[#d6dccd] bg-white px-4 pr-12 text-[15px] text-[#202733] outline-none transition-all placeholder:text-[#b4b8c0] focus:border-[#1c781d] focus:shadow-[0_0_0_4px_rgba(34,120,29,0.12)]"
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#8b93a0] transition-colors hover:bg-[#f0f2eb] hover:text-[#343c48]"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>

                  {selectedRole === "candidate_onhold" ? (
                    <>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label htmlFor="candidate-target-role" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#5d6673]">
                            Target Role
                          </label>
                          <select
                            id="candidate-target-role"
                            className="h-[54px] w-full rounded-[10px] border border-[#d6dccd] bg-white px-4 text-[15px] text-[#202733] outline-none transition-all focus:border-[#1c781d] focus:shadow-[0_0_0_4px_rgba(34,120,29,0.12)]"
                            value={candidateTargetRole}
                            onChange={(e) => setCandidateTargetRole(e.target.value)}
                          >
                            {TARGET_ROLE_OPTIONS.map((roleOption) => (
                              <option key={roleOption} value={roleOption}>
                                {roleOption}
                              </option>
                            ))}
                            <option value={OTHER_TARGET_ROLE_VALUE}>Other</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="candidate-experience" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#5d6673]">
                            Experience
                          </label>
                          <select
                            id="candidate-experience"
                            className="h-[54px] w-full rounded-[10px] border border-[#d6dccd] bg-white px-4 text-[15px] text-[#202733] outline-none transition-all focus:border-[#1c781d] focus:shadow-[0_0_0_4px_rgba(34,120,29,0.12)]"
                            value={candidateExperienceYears}
                            onChange={(e) => setCandidateExperienceYears(e.target.value)}
                          >
                            <option value="0.5">0-1 years</option>
                            <option value="2">1-3 years</option>
                            <option value="4">3-5 years</option>
                            <option value="7">5-8 years</option>
                            <option value="10">8+ years</option>
                          </select>
                        </div>
                      </div>
                      {candidateTargetRole === OTHER_TARGET_ROLE_VALUE ? (
                        <div className="mt-3">
                          <Field
                            id="candidate-other-target-role"
                            label="Role Title"
                            placeholder="e.g. Customer Success Trainer"
                            value={candidateOtherTargetRole}
                            onChange={setCandidateOtherTargetRole}
                          />
                          <p className="mt-2 text-xs leading-5 text-[#7a8577]">
                            We&apos;ll create the account now and you can assign the assessment track after registration.
                          </p>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="employer-designation" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#5d6673]">
                          Designation
                        </label>
                        <select
                          id="employer-designation"
                          className="h-[54px] w-full rounded-[10px] border border-[#d6dccd] bg-white px-4 text-[15px] text-[#202733] outline-none transition-all focus:border-[#1c781d] focus:shadow-[0_0_0_4px_rgba(34,120,29,0.12)]"
                          value={employerDesignation}
                          onChange={(e) => setEmployerDesignation(e.target.value)}
                        >
                          <option value="hiring_manager">Hiring Manager</option>
                          <option value="talent_acquisition">Talent Acquisition</option>
                          <option value="founder_ceo">Founder / CEO</option>
                          <option value="ld_leader">L&D Leader</option>
                          <option value="hr_business_partner">HR Business Partner</option>
                        </select>
                      </div>
                      <Field
                        id="company-name"
                        label="Company Name"
                        placeholder="Acme Labs"
                        value={companyName}
                        onChange={setCompanyName}
                        required={selectedRole === "employer_free"}
                      />
                    </div>
                  )}

                  <label className="flex items-start gap-3 text-[13px] leading-6 text-[#5e6775]">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded-[4px] border-[#c8d0bf] text-[#1d7f1e] focus:ring-[#1d7f1e]"
                    />
                    <span>
                      I agree to the{" "}
                      <Link href="#" className="font-semibold text-[#37414d] hover:text-[#1d7f1e]">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="#" className="font-semibold text-[#37414d] hover:text-[#1d7f1e]">
                        Privacy Policy.
                      </Link>
                    </span>
                  </label>

                  {error ? <div className="rounded-[14px] border border-[#f2c6c2] bg-[#fff2f0] px-4 py-3 text-sm text-[#bf4b42]">{error}</div> : null}
                  {existingAccount ? (
                    <div className="rounded-[18px] border border-[#d8e6d3] bg-[#f6fbf3] px-4 py-4 text-sm text-[#34513a]">
                      <p className="font-semibold text-[#1f2937]">This email is already registered.</p>
                      <p className="mt-1 leading-7">
                        Sign in with <span className="font-semibold">{existingAccount.email}</span>, or reset your password if you&apos;re having trouble logging in.
                      </p>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <Link
                          href={`/login?email=${encodeURIComponent(existingAccount.email)}&registered=1`}
                          className="inline-flex h-[48px] items-center justify-center rounded-[12px] bg-[#066c12] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#045b0e]"
                        >
                          Sign in instead
                        </Link>
                        <Link
                          href={`/forgot-password?email=${encodeURIComponent(existingAccount.email)}`}
                          className="inline-flex h-[48px] items-center justify-center rounded-[12px] border border-[#d7e2cf] bg-white px-5 text-sm font-semibold text-[#25303a] transition-colors hover:bg-[#f3f7ef]"
                        >
                          Forgot password
                        </Link>
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-[58px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#066c12] px-6 text-[1rem] font-medium text-white shadow-[0_14px_26px_rgba(6,108,18,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#045b0e] disabled:translate-y-0 disabled:opacity-60"
                  >
                    {loading ? "Creating account..." : "Create Account"}
                    {!loading ? <ArrowRight className="h-4.5 w-4.5" /> : null}
                  </button>
                </div>

                <p className="mt-7 text-center text-[15px] text-[#606a77]">
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold text-[#2d7a2f] transition-colors hover:text-[#1f5821]">
                    Sign In
                  </Link>
                </p>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function PathCard({ selected, title, description, icon: Icon, onSelect }: PathCardProps) {
  return (
    <label
      className={`relative cursor-pointer rounded-[14px] border bg-white px-4 py-4 transition-all ${
        selected
          ? "border-[#346f35] shadow-[0_10px_20px_rgba(55,94,54,0.14)]"
          : "border-[#dde2d6] hover:border-[#ccd3c5] hover:shadow-[0_10px_18px_rgba(91,105,68,0.08)]"
      }`}
    >
      <input type="radio" className="sr-only" checked={selected} onChange={onSelect} />
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-[10px] ${selected ? "bg-[#d9f2d0] text-[#21712a]" : "bg-[#edf0fb] text-[#66708f]"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-[1.1rem] font-medium text-[#3a4350]">{title}</p>
      <p className="mt-1 text-[13px] leading-6 text-[#7b8594]">{description}</p>
    </label>
  );
}

function BenefitItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/12">
        <Check className="h-4 w-4 text-[#bbf7bf]" />
      </span>
      <div>
        <p className="text-[1.02rem] font-medium text-white">{title}</p>
        <p className="mt-1 text-[15px] leading-7 text-[#b7f0b3]">{description}</p>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = true,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#5d6673]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        className="h-[54px] w-full rounded-[10px] border border-[#d6dccd] bg-white px-4 text-[15px] text-[#202733] outline-none transition-all placeholder:text-[#b4b8c0] focus:border-[#1c781d] focus:shadow-[0_0_0_4px_rgba(34,120,29,0.12)]"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function RegisterPageFallback() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faef_0%,#f1f7e8_100%)] px-5 py-10">
      <div className="mx-auto max-w-[520px] rounded-[28px] border border-white/80 bg-white/90 px-8 py-10 text-center shadow-[0_24px_60px_rgba(86,106,58,0.12)]">
        <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-[#20252f]">Create Account</h1>
        <p className="mt-3 text-[#5f6876]">Loading registration...</p>
      </div>
    </div>
  );
}
