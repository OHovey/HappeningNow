import Link from 'next/link';

interface InternalLinksProps {
  links: Array<{ href: string; label: string }>;
  title?: string;
}

const MAX_DISPLAYED_LINKS = 8;

/**
 * Related pages section with internal links.
 */
export default function InternalLinks({
  links,
  title = 'Explore More',
}: InternalLinksProps) {
  if (!links || links.length === 0) return null;

  const displayedLinks = links.slice(0, MAX_DISPLAYED_LINKS);

  return (
    <nav aria-label="Related pages">
      <h2 className="text-xl text-text-primary mb-4" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>{title}</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {displayedLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-text-secondary transition-all hover:text-accent hover:scale-[1.01]"
              style={{
                background: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <svg
                className="h-3.5 w-3.5 flex-shrink-0 text-text-tertiary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
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
