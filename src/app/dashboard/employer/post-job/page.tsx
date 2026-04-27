"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness, Globe, Link2, MapPin } from "lucide-react";

type PostJobResponse = {
  success?: boolean;
  warning?: string;
  error?: string;
  job?: {
    id: string;
  };
};

export default function EmployerPostJobPage() {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const payload = { title, company, location, apply_url: applyUrl, description };

    try {
      const res = await fetch("/api/jobs/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as PostJobResponse;
      if (!res.ok) {
        throw new Error(data.error || "Unable to post job.");
      }

      if (data.warning) {
        setMessage(data.warning);
      }

      if (data.job?.id) {
        router.push(`/dashboard/jobs/${data.job.id}`);
        return;
      }

      router.push("/dashboard/employer");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbf3_0%,#f3f8ee_100%)] px-4 pb-16 pt-28 md:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Link
              href="/dashboard/employer"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#5f6d6b] transition hover:text-[#138d1a]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Employer Hub
            </Link>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#202634] md:text-[2rem]">
              Post a Job
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5f6d6b]">
              Keep it simple: add the role details candidates need and publish the listing directly.
            </p>
          </div>

          <Link
            href="/dashboard/employer"
            className="hidden rounded-xl border border-[#d6e3d2] bg-white px-4 py-2 text-sm font-semibold text-[#314036] transition hover:bg-[#f7fbf4] sm:inline-flex"
          >
            Cancel
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[#dce6d7] bg-white p-5 shadow-[0_16px_40px_rgba(87,108,67,0.07)] md:p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Job Title"
                value={title}
                onChange={setTitle}
                placeholder="e.g. Senior Instructional Designer"
                icon={BriefcaseBusiness}
              />
              <Field
                label="Company"
                value={company}
                onChange={setCompany}
                placeholder="Your company name"
                icon={Globe}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Location"
                value={location}
                onChange={setLocation}
                placeholder="Remote, Mumbai, London..."
                icon={MapPin}
              />
              <Field
                label="Application URL"
                value={applyUrl}
                onChange={setApplyUrl}
                placeholder="https://careers.yourcompany.com"
                icon={Link2}
                required={false}
                helper="Leave blank to use the internal apply flow."
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-[#3f4b59]">Job Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={8}
                className="w-full rounded-xl border border-[#dbe4d5] bg-[#fbfdf9] px-4 py-3 text-sm outline-none transition focus:border-[#8fd97e] focus:ring-2 focus:ring-[#8fd97e]"
                placeholder="Describe responsibilities, must-have skills, hiring expectations, and anything candidates should know before applying."
              />
            </div>

            {message || error ? (
              <div
                className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                  message
                    ? "border border-green-100 bg-green-50 text-green-700"
                    : "border border-red-100 bg-red-50 text-red-700"
                }`}
              >
                {message || error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs uppercase tracking-[0.14em] text-[#8c97aa]">
                Only live fields are shown here
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#21a421,#34cd2f)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(33,164,33,0.24)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
              >
                {isSubmitting ? "Posting..." : "Post Job"}
              </button>
            </div>
          </form>

          <div className="space-y-5">
            <div className="rounded-2xl border border-[#dce6d7] bg-white p-5 shadow-[0_16px_40px_rgba(87,108,67,0.07)]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#138d1a]">Preview</p>
              <h2 className="mt-3 text-xl font-semibold text-[#202634]">
                {title || "Senior Instructional Designer"}
              </h2>
              <p className="mt-1 text-sm font-semibold text-[#138d1a]">
                {company || "LXD Guild Global"}
              </p>

              <div className="mt-4 space-y-2 text-sm text-[#5f6d6b]">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#334155]" />
                  {location || "Remote"}
                </p>
                <p className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-[#334155]" />
                  {applyUrl || "Internal LXD Guild apply flow"}
                </p>
              </div>

              <div className="mt-4 rounded-xl bg-[#f6f8f2] px-4 py-4 text-sm leading-6 text-[#6f7b76]">
                {description ||
                  "Your job summary preview will appear here so you can quickly review the listing before publishing."}
              </div>
            </div>

            <div className="rounded-2xl border border-[#dce6d7] bg-white p-5 shadow-[0_16px_40px_rgba(87,108,67,0.07)]">
              <h3 className="text-base font-semibold text-[#202634]">Helpful links</h3>
              <p className="mt-2 text-sm leading-6 text-[#5f6d6b]">
                Need to review your current listings or update employer details first?
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/dashboard/employer"
                  className="inline-flex items-center justify-center rounded-xl border border-[#d6e3d2] bg-[#f7fbf4] px-4 py-2.5 text-sm font-semibold text-[#314036] transition hover:bg-[#edf6e7]"
                >
                  View Employer Hub
                </Link>
                <Link
                  href="/dashboard/employer/profile"
                  className="inline-flex items-center justify-center rounded-xl border border-[#d6e3d2] bg-white px-4 py-2.5 text-sm font-semibold text-[#314036] transition hover:bg-[#f7fbf4]"
                >
                  Edit Employer Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  required = true,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: typeof BriefcaseBusiness;
  required?: boolean;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#3f4b59]">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#8c97aa]" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full rounded-xl border border-[#dbe4d5] bg-[#fbfdf9] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#8fd97e] focus:ring-2 focus:ring-[#8fd97e]"
          placeholder={placeholder}
        />
      </div>
      {helper ? <span className="mt-2 block text-xs text-[#7b8793]">{helper}</span> : null}
    </label>
  );
}
