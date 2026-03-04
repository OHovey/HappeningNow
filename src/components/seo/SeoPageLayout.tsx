import Breadcrumbs from '@/components/ui/Breadcrumbs';
import type { BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import EmailCapture from '@/components/panel/EmailCapture';
import InternalLinks from '@/components/seo/InternalLinks';
import Link from 'next/link';

interface SeoPageLayoutProps {
  title: string;
  intro: string;
  breadcrumbs: BreadcrumbItem[];
  relatedLinks: Array<{ href: string; label: string }>;
  /** Optional event category for email capture targeting. Defaults to 'festivals'. */
  eventCategory?: string;
  children: React.ReactNode;
}

/**
 * Shared layout wrapper for all programmatic SEO pages.
 */
export default function SeoPageLayout({
  title,
  intro,
  breadcrumbs,
  relatedLinks,
  eventCategory = 'festivals',
  children,
}: SeoPageLayoutProps) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8" style={{ color: 'var(--text-primary)' }}>
      {/* Breadcrumbs with JSON-LD */}
      <Breadcrumbs items={breadcrumbs} />

      {/* Page heading */}
      <h1
        className="mt-4 text-3xl sm:text-4xl text-text-primary"
        style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}
      >
        {title}
      </h1>

      {/* Intro paragraph */}
      <p className="mt-4 text-lg text-text-secondary leading-relaxed">
        {intro}
      </p>

      {/* Email capture - after intro, before main content */}
      <section
        data-section="email-capture"
        className="mt-6 p-5"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <EmailCapture eventCategory={eventCategory} />
      </section>

      {/* Main page content (map, event grid, etc.) */}
      <div className="mt-8">
        {children}
      </div>

      {/* Related pages / internal links */}
      <section data-section="related" className="mt-12">
        <InternalLinks links={relatedLinks} />
      </section>

      {/* Back to map */}
      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-text-primary transition-all hover:scale-[1.01]"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-elevated)',
          }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Map
        </Link>
      </div>
    </main>
  );
}
