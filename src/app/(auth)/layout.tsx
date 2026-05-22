import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Account Access",
    template: "%s | LXD Guild Marketplace",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
