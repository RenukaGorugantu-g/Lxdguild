"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

type JobData = {
  id: string;
  title: string;
  company: string;
  location: string;
  apply_url: string;
  description: string;
};

export default function JobEditForm({ initialJob }: { initialJob: JobData }) {
  const [title, setTitle] = useState(initialJob.title || "");
  const [company, setCompany] = useState(initialJob.company || "");
  const [location, setLocation] = useState(initialJob.location || "");
  const [applyUrl, setApplyUrl] = useState(initialJob.apply_url || "");
  const [description, setDescription] = useState(initialJob.description || "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    setSaved(false);

    try {
      const res = await fetch(`/api/jobs/${initialJob.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, company, location, apply_url: applyUrl, description }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to update job.");
      }

      setMessage("Job updated successfully.");
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pt-28 pb-16 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Link href="/dashboard/employer" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700">
              <ArrowLeft className="w-4 h-4" /> Back to Employer Hub
            </Link>
            <h1 className="text-3xl font-bold mt-4">Edit Job Posting</h1>
            <p className="text-zinc-500 mt-2">Update this role and save changes to your job board listing.</p>
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
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Company
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
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
              />
            </label>

            {(message || error) && (
              <div className={`rounded-2xl px-4 py-3 text-sm ${message ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                {message || error}
              </div>
            )}

            {saved && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-3xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-700">
                <p>Changes saved. Your job listing has been updated in the database.</p>
                <Link href={`/dashboard/jobs/${initialJob.id}`} className="rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition">
                  View live job
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {saving ? "Saving changes..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
