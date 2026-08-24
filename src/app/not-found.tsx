import Link from "next/link";

export default function NotFound() {
  return (
    <div className="marketing-page">
      <main className="marketing-container flex min-h-[60vh] items-center justify-center py-24">
        <section className="max-w-xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#138d1a]">404 | Page not found</p>
          <h1 className="marketing-title mt-4 text-5xl">This LXD Marketplace page is unavailable.</h1>
          <p className="marketing-copy mt-5">
            The page may have moved, expired, or never existed. Continue to L&amp;D jobs, professional tools, or employer hiring.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="marketing-primary rounded-full px-6">LXD Marketplace home</Link>
            <Link href="/jobs" className="marketing-secondary rounded-full px-6">Browse L&amp;D jobs</Link>
            <Link href="/contact" className="marketing-secondary rounded-full px-6">Contact LXD Guild</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
