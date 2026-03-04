'use client';

interface CrowdHeatmapToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

/**
 * Toggle button for the crowd heatmap overlay.
 * Styled as a frosted glass map control.
 */
export default function CrowdHeatmapToggle({
  enabled,
  onToggle,
}: CrowdHeatmapToggleProps) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="map-control flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] text-sm font-medium transition-all duration-200"
      aria-label={enabled ? 'Hide crowd heatmap' : 'Show crowd heatmap'}
      aria-pressed={enabled}
      style={{
        color: enabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
      }}
    >
      {/* Heat/flame icon */}
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
        />
      </svg>
      <span className="hidden sm:inline">Crowds</span>
    </button>
  );
}
