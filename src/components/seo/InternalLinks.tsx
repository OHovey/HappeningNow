import Link from 'next/link';

interface InternalLinksProps {
  links: Array<{ href: string; label: string }>;
  title?: string;
}

const MAX_DISPLAYED_LINKS = 8;

/**
 * Related pages section with internal links.
 *
 * Renders a "Related Pages" (or custom title) section with styled
 * link items. Uses Next.js Link for client-side navigation.
 * Displays a maximum of 8 links.
 */
export default function InternalLinks({
  links,
  title = 'Explore More',
}: InternalLinksProps) {
  if (!links || links.length === 0) return null;

  const displayedLinks = links.slice(0, MAX_DISPLAYED_LINKS);

  return (
    <nav aria-label="Related pages">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {displayedLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-blue-600"
            >
              <svg
                className="h-4 w-4 flex-shrink-0 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
