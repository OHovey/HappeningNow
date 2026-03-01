'use client';

interface CrowdBadgeProps {
  level: 'quiet' | 'moderate' | 'busy';
}

const CROWD_CONFIG = {
  quiet: {
    label: 'Low crowds',
    bg: 'bg-green-500',
    color: '#22c55e',
  },
  moderate: {
    label: 'Moderate crowds',
    bg: 'bg-amber-500',
    color: '#f59e0b',
  },
  busy: {
    label: 'Peak crowds',
    bg: 'bg-red-500',
    color: '#ef4444',
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
      className={`inline-flex items-center gap-1.5 rounded-full ${config.bg} px-2.5 py-1 text-xs font-medium text-white`}
    >
      <span
        className="inline-block h-2 w-2 rounded-full bg-white/60"
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}
