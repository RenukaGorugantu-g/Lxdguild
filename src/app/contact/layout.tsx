import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | LXD Guild",
  description:
    "Talk to the LXD Guild team about hiring, partnerships, pricing, support, or product questions.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
