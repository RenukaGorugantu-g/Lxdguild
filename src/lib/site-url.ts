export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  const fallbackUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://lxdmarketplace.lxdguild.com";

  return (
    configuredUrl || fallbackUrl
  ).replace(/\/$/, "");
}
