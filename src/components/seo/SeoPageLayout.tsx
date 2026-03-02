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
 *
 * Structure:
 * 1. Breadcrumbs with JSON-LD
 * 2. H1 heading
 * 3. Intro text
 * 4. Email capture (after intro, before main content)
 * 5. Children slot (page-specific: map, event cards, etc.)
 * 6. Internal links (related pages)
 * 7. Back to map button
 *
 * Uses semantic HTML per AIDX-03: h1/h2/h3 hierarchy,
 * main/section/article elements, data-section attributes.
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
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumbs with JSON-LD */}
      <Breadcrumbs items={breadcrumbs} />

      {/* Page heading */}
      <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
        {title}
      </h1>

      {/* Intro paragraph */}
      <p className="mt-4 text-lg text-gray-600 leading-relaxed">
        {intro}
      </p>

      {/* Email capture - after intro, before main content */}
      <section data-section="email-capture" className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
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
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Map
        </Link>
      </div>
    </main>
  );
}
