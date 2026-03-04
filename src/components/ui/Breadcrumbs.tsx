import Link from 'next/link';

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const SITE_URL = 'https://happeningnow.travel';

/**
 * Breadcrumb navigation with BreadcrumbList JSON-LD structured data.
 *
 * Includes generous padding so it never looks crammed against viewport edges.
 */
export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.href
        ? { item: `${SITE_URL}${item.href}` }
        : {}),
    })),
  };

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="px-4 py-3 sm:px-6 md:px-8"
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-text-tertiary">
          {items.map((crumb, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={index} className="flex items-center gap-1.5">
                {index > 0 && (
                  <svg
                    className="h-3 w-3 text-text-tertiary/40"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
                {isLast ? (
                  <span aria-current="page" className="font-medium text-text-primary">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.href ?? '/'}
                    className="transition-colors hover:text-text-secondary"
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
    </>
  );
}
