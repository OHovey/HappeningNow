'use client';

interface CrowdBadgeProps {
  level: 'quiet' | 'moderate' | 'busy';
}

const CROWD_CONFIG = {
  quiet: {
    label: 'Low crowds',
    bg: 'bg-emerald-800/90',
    dot: 'bg-emerald-400',
  },
  moderate: {
    label: 'Moderate',
    bg: 'bg-amber-800/90',
    dot: 'bg-amber-400',
  },
  busy: {
    label: 'Peak crowds',
    bg: 'bg-red-900/90',
    dot: 'bg-red-400',
  },
} as const;

/**
 * Color-coded crowd indicator badge.
 * Shows Low/Moderate/Peak crowds with matching color.
 */
export default function CrowdBadge({ level }: CrowdBadgeProps) {
  const config = CROWD_CONFIG[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${config.bg} px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase text-white/95`}
      style={{
        backdropFilter: 'blur(8px)',
        letterSpacing: '0.04em',
      }}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${config.dot}`}
        style={{ boxShadow: '0 0 4px currentColor' }}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
