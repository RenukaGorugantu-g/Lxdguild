import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LXD Guild - Skill-First Verified Talent Marketplace",
  description:
    "The premier verified talent marketplace for Learning & Development professionals. Validate your skills, access exclusive jobs, and connect with top L&D employers.",
  openGraph: {
    title: "LXD Guild - Skill-First Verified Talent Marketplace",
    description: "Discover verified Learning & Development professionals through skill exams.",
    siteName: "LXD Guild",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
