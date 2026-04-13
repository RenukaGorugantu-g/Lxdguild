"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, Globe, MapPin, Send, TextCursorInput } from "lucide-react";

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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to post job.");
      }

      setMessage("Job posted successfully.");
      setTitle("");
      setCompany("");
      setLocation("");
      setApplyUrl("");
      setDescription("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/dashboard/employer" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700">
              <ArrowLeft className="w-4 h-4" /> Back to Employer Hub
            </Link>
            <h1 className="text-3xl font-bold mt-4">Post a Job</h1>
            <p className="text-zinc-500 mt-2">Free and paid employers can post opportunities for verified MVP candidates.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Briefcase className="w-4 h-4" /> Open to all employers
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 dark:border-border bg-white dark:bg-surface-dark p-8 shadow-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Job Title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                  placeholder="Instructional Designer"
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Company
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                  placeholder="Maple Learning Solutions"
                />
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Location
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                  placeholder="Remote / India"
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Apply URL
                <input
                  value={applyUrl}
                  onChange={(e) => setApplyUrl(e.target.value)}
                  type="url"
                  required
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                  placeholder="https://example.com/apply"
                />
              </label>
            </div>

            <label className="space-y-2 text-sm font-medium">
              Job Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={8}
                className="w-full rounded-3xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                placeholder="Write a brief summary of the role, responsibilities, and required skills..."
              />
            </label>

            {(message || error) && (
              <div className={`rounded-2xl px-4 py-3 text-sm ${message ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                {message || error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "Posting job..." : "Post Job"}
            </button>
          </form>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-zinc-800 p-5 text-white">
            <div className="flex items-center gap-2 text-brand-300 mb-3">
              <Globe className="w-4 h-4" />
              <p className="text-xs uppercase tracking-[0.24em]">Visibility</p>
            </div>
            <p className="text-sm text-zinc-200">Jobs posted here will appear on the shared L&D job board for verified candidates.</p>
          </div>
          <div className="rounded-3xl bg-zinc-800 p-5 text-white">
            <div className="flex items-center gap-2 text-brand-300 mb-3">
              <MapPin className="w-4 h-4" />
              <p className="text-xs uppercase tracking-[0.24em]">Candidate Access</p>
            </div>
            <p className="text-sm text-zinc-200">All active employers can post jobs. Candidates with MVP status will see your role when they browse.</p>
          </div>
          <div className="rounded-3xl bg-zinc-800 p-5 text-white">
            <div className="flex items-center gap-2 text-brand-300 mb-3">
              <TextCursorInput className="w-4 h-4" />
              <p className="text-xs uppercase tracking-[0.24em]">Ready to Hire</p>
            </div>
            <p className="text-sm text-zinc-200">Use a concise title, location, and application link so candidates can apply fast.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
