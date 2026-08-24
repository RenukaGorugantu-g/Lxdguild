import type { Metadata } from "next";
import Script from "next/script";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GlobalEnhancements from "@/components/GlobalEnhancements";
import { toJsonLdScriptProps } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";

const GOOGLE_ANALYTICS_ID = "G-0Z52K8S4R4";
const SITE_URL = getSiteUrl();

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LXD Marketplace | Learning Experience Design Jobs & Talent",
    template: "%s | LXD Guild Marketplace",
  },
  description:
    "LXD Marketplace for verified learning experience designers, instructional designers, eLearning developers, and employers hiring across India.",
  applicationName: "LXD Guild Marketplace",
  keywords: [
    "LXD Marketplace",
    "Learning Experience Design Marketplace",
    "Learning Experience Design",
    "Learning Experience Designer",
    "LXD professionals",
    "L&D jobs",
    "Learning and development jobs",
    "Learning and Development professionals",
    "Instructional Design Marketplace",
    "Instructional Design",
    "Instructional Designer",
    "Instructional designer jobs",
    "eLearning Marketplace",
    "eLearning professionals",
    "eLearning Developer",
    "eLearning developer jobs",
    "Learning Designer jobs",
    "L&D talent marketplace",
    "Instructional design careers",
    "Hire L&D professionals",
    "Corporate training jobs",
    "LXD Guild",
  ],
  alternates: {
    canonical: "/",
  },
  category: "education",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: ["/icon.png"],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "LXD Marketplace | Learning Experience Design Jobs & Talent",
    description:
      "Find L&D jobs, verified learning talent, and hiring tools built for learning teams in India.",
    siteName: "LXD Guild",
    type: "website",
    url: "/",
    locale: "en_IN",
    images: [
      {
        url: "/opengraph-image",
        alt: "LXD Guild marketplace preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LXD Marketplace | Learning Experience Design Jobs & Talent",
    description:
      "Find L&D jobs, verified learning talent, and hiring tools built for learning teams in India.",
    images: ["/twitter-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LXD Guild",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    sameAs: [
      "https://in.linkedin.com/company/lxd-guild",
      "https://www.youtube.com/@lxdguild",
      "https://www.instagram.com/lxd_guild/",
      "https://x.com/GuildLxd20077",
      "https://www.facebook.com/100648556092707/",
    ],
  };

  return (
    <html
      lang="en"
      className={`h-full antialiased ${manrope.variable} ${fraunces.variable}`}
      style={{ colorScheme: "light" }}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] font-sans text-[var(--foreground)]" style={{ colorScheme: "light" }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={toJsonLdScriptProps(organizationJsonLd)} />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ANALYTICS_ID}');
          `}
        </Script>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <GlobalEnhancements />
      </body>
    </html>
  );
}
