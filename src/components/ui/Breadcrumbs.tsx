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
 * Pattern: Home > Region > Event/Species Name
 * Region links point to future SEO listing URLs (e.g. /festivals/southeast-asia).
 * Last item renders as a span (current page), not a link.
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
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
          {items.map((crumb, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={index} className="flex items-center gap-1">
                {index > 0 && (
                  <span aria-hidden="true" className="text-gray-400">
                    &gt;
                  </span>
                )}
                {isLast ? (
                  <span aria-current="page" className="text-gray-900 font-medium">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.href ?? '/'}
                    className="hover:text-gray-700 transition-colors"
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
