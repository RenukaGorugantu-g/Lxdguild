import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GlobalEnhancements from "@/components/GlobalEnhancements";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lxdguild.com"),
  title: "LXD Guild - Skill-First Verified Talent Marketplace",
  description:
    "The premier verified talent marketplace for Learning & Development professionals. Validate your skills, access exclusive jobs, and connect with top L&D employers.",
  icons: {
    icon: [
      { url: "/lxd-guild-email-logo.png" },
    ],
    shortcut: ["/lxd-guild-email-logo.png"],
    apple: ["/lxd-guild-email-logo.png"],
  },
  openGraph: {
    title: "LXD Guild - Skill-First Verified Talent Marketplace",
    description: "Discover verified Learning & Development professionals through skill exams.",
    siteName: "LXD Guild",
    images: [
      {
        url: "/lxd-guild-email-logo.png",
        alt: "LXD Guild logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${manrope.variable} ${fraunces.variable}`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] font-sans text-[var(--foreground)]" style={{ colorScheme: "light" }}>
        <Header />
        <main className="flex-1 pb-28 lg:pb-0">{children}</main>
        <Footer />
        <GlobalEnhancements />
      </body>
    </html>
  );
}
