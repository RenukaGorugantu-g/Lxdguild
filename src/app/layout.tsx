import type { Metadata } from "next";
import Script from "next/script";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GlobalEnhancements from "@/components/GlobalEnhancements";
import { toJsonLdScriptProps } from "@/lib/seo";

const GOOGLE_ANALYTICS_ID = "G-0Z52K8S4R4";
const SITE_URL = "https://lxdmarketplace.lxdguild.com";

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
    default: "LXD Guild Marketplace | Verified L&D Talent and Jobs",
    template: "%s | LXD Guild Marketplace",
  },
  description:
    "Verified marketplace for Learning and Development professionals. Discover instructional designer jobs, hire L&D talent, and grow careers with skill validation and AI-powered tools.",
  applicationName: "LXD Guild Marketplace",
  keywords: [
    "L&D jobs",
    "Learning and development jobs",
    "Instructional designer jobs",
    "eLearning developer jobs",
    "Learning experience designer",
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
    title: "LXD Guild Marketplace | Verified L&D Talent and Jobs",
    description:
      "Discover instructional designer jobs, verified L&D professionals, and skill-first hiring tools built for the learning industry.",
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
    title: "LXD Guild Marketplace | Verified L&D Talent and Jobs",
    description:
      "Discover instructional designer jobs, verified L&D professionals, and skill-first hiring tools built for the learning industry.",
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
