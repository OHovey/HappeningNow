/**
 * Inline FTC affiliate disclosure badge.
 * Renders a subtle "Affiliate link" label near affiliate CTAs.
 */
export default function FtcDisclosure() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] tracking-wide text-text-tertiary">
      <svg
        className="h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Affiliate link
    </span>
  );
}
