"use client";

import { useState } from "react";
import { Mail, MessageSquareMore, Send, Users } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, subject, message }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to send your message.");
      }

      setStatus("Your message has been sent. We’ll get back to you at lxdguild@gmail.com.");
      setName("");
      setEmail("");
      setCompany("");
      setSubject("");
      setMessage("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to send your message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marketing-page">
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-32">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="marketing-grid-card p-8 sm:p-10">
            <div className="marketing-kicker">
              <MessageSquareMore className="h-3.5 w-3.5" />
              Let&apos;s Talk
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-[-0.05em] text-[#111827] sm:text-5xl">Talk to the LXD Guild team.</h1>
            <p className="mt-4 text-sm leading-7 text-[#5b6757]">
              Whether you want employer pricing, hiring support, partnership details, or product help, send us a note and we&apos;ll respond directly.
            </p>
            <div className="mt-8 space-y-4">
              <InfoCard icon={Mail} title="Direct Inbox" copy="Messages from this form are sent to lxdguild@gmail.com." />
              <InfoCard icon={Users} title="Employer Support" copy="Use this for hiring, pricing, onboarding, and employer workflow questions." />
            </div>
          </section>

          <section className="marketing-panel rounded-[2rem] p-8 sm:p-10">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6d7d68]">Contact Form</p>
              <h2 className="mt-3 text-4xl font-bold text-[#111827]">Send us a message</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Your Name" value={name} onChange={setName} placeholder="Jane Doe" />
                <Field label="Email Address" type="email" value={email} onChange={setEmail} placeholder="jane@company.com" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Company" value={company} onChange={setCompany} placeholder="LXD Guild Studio" required={false} />
                <Field label="Subject" value={subject} onChange={setSubject} placeholder="Employer pricing inquiry" />
              </div>
              <label className="block text-sm font-medium text-[#111827]">
                Message
                <textarea
                  required
                  rows={7}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="marketing-input mt-2 min-h-[180px] resize-none"
                  placeholder="Tell us what you need help with..."
                />
              </label>

              {status ? <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{status}</div> : null}
              {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

              <button type="submit" disabled={loading} className="marketing-primary w-full disabled:opacity-60">
                <Send className="h-4 w-4" />
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-[#111827]">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="marketing-input mt-2"
        placeholder={placeholder}
      />
    </label>
  );
}

function InfoCard({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof Mail;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-2xl border border-[#dce7d4] bg-[#f8fbf4] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ebf7e3] text-[#138d1a]">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#111827]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[#5b6757]">{copy}</p>
        </div>
      </div>
    </div>
  );
}
