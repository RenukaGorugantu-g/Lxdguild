import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildNoIndexMetadata(
    "Create Your LXD Guild Account",
    "Register for LXD Guild to access candidate tools, employer hiring workflows, and the L&D marketplace."
  ),
  alternates: {
    canonical: "/register",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
