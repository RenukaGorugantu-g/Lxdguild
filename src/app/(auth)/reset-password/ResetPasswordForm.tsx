"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordForm() {
  const [supabase] = useState(() => createClient());
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);

    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || "We couldn't update your password.");
      setLoading(false);
      return;
    }

    setStatus("Password updated. Taking you back to sign in...");
    window.setTimeout(() => {
      router.replace("/login?reset=1");
      router.refresh();
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faef_0%,#eef6e4_100%)] text-[#202733]">
      <main className="mx-auto flex min-h-screen w-full max-w-[760px] items-center px-5 py-16 md:px-8">
        <div className="w-full rounded-[34px] border border-white/80 bg-white/92 p-6 shadow-[0_28px_70px_rgba(86,106,58,0.14)] md:p-10">
          <div className="max-w-[520px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#66715d]">Set a new password</p>
            <h1 className="mt-4 text-[2.2rem] font-semibold tracking-[-0.05em] text-[#20252f]">Choose your new password</h1>
            <p className="mt-4 text-[1rem] leading-8 text-[#5f6876]">
              Use a fresh password for your LXD Guild account, then sign back in and continue where you left off.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 max-w-[520px] space-y-4">
            <PasswordField
              id="password"
              label="New password"
              value={password}
              show={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
              onChange={setPassword}
            />
            <PasswordField
              id="confirm-password"
              label="Confirm password"
              value={confirmPassword}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((value) => !value)}
              onChange={setConfirmPassword}
            />

            {error ? <div className="rounded-[16px] border border-[#f2c6c2] bg-[#fff2f0] px-4 py-3 text-sm text-[#bf4b42]">{error}</div> : null}
            {status ? <div className="rounded-[16px] border border-[#dbe4d1] bg-[#f8fbf4] px-4 py-3 text-sm text-[#44514e]">{status}</div> : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-[60px] w-full items-center justify-center gap-2 rounded-[14px] bg-[#066c12] px-6 text-[1.05rem] font-semibold text-white shadow-[0_14px_26px_rgba(6,108,18,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#045b0e] disabled:translate-y-0 disabled:opacity-60"
            >
              {loading ? "Updating password..." : "Save new password"}
              {!loading ? <ArrowRight className="h-4.5 w-4.5" /> : null}
            </button>
          </form>

          <div className="mt-8">
            <Link href="/login" className="text-[0.98rem] font-semibold text-[#2f6d2d] transition-colors hover:text-[#194e17]">
              Back to sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  show,
  onToggle,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-bold uppercase tracking-[0.08em] text-[#434a57]">
        {label}
      </label>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7c8591]" />
        <input
          id={id}
          type={show ? "text" : "password"}
          required
          minLength={8}
          className="h-[58px] w-full rounded-[14px] border border-[#d2d8cb] bg-white pl-12 pr-12 text-[1rem] text-[#1f242d] outline-none transition-all placeholder:text-[#9aa2ad] focus:border-[#2f8632] focus:shadow-[0_0_0_4px_rgba(51,140,49,0.12)]"
          placeholder="Min. 8 characters"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#6d7581] transition-colors hover:bg-[#f0f3eb] hover:text-[#27303b]"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
        </button>
      </div>
    </div>
  );
}
