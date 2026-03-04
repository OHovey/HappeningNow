"use client";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "map" | "card" | "text";
}

export function LoadingSkeleton({
  className = "",
  variant,
}: LoadingSkeletonProps) {
  const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent";

  switch (variant) {
    case "map":
      return (
        <div
          className={`h-screen w-full ${className}`}
          role="status"
          aria-label="Loading map"
          style={{ background: 'var(--surface-sunken)' }}
        >
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-tertiary/20 border-t-text-secondary" />
              <span className="text-xs font-medium tracking-wide text-text-tertiary">Loading map</span>
            </div>
          </div>
        </div>
      );

    case "card":
      return (
        <div
          className={`${className}`}
          role="status"
          aria-label="Loading card"
          style={{
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div className="space-y-3 p-4">
            <div className={`h-4 w-3/4 rounded-full ${shimmer}`} style={{ background: 'var(--surface-sunken)' }} />
            <div className={`h-4 w-1/2 rounded-full ${shimmer}`} style={{ background: 'var(--surface-sunken)' }} />
            <div className={`h-20 w-full rounded-lg ${shimmer}`} style={{ background: 'var(--surface-sunken)' }} />
          </div>
        </div>
      );

    case "text":
      return (
        <div
          className={`space-y-2.5 ${className}`}
          role="status"
          aria-label="Loading text"
        >
          <div className={`h-4 w-full rounded-full ${shimmer}`} style={{ background: 'var(--surface-sunken)' }} />
          <div className={`h-4 w-5/6 rounded-full ${shimmer}`} style={{ background: 'var(--surface-sunken)' }} />
          <div className={`h-4 w-4/6 rounded-full ${shimmer}`} style={{ background: 'var(--surface-sunken)' }} />
        </div>
      );

    default:
      return (
        <div
          className={`rounded-lg ${shimmer} ${className}`}
          role="status"
          aria-label="Loading"
          style={{ background: 'var(--surface-sunken)' }}
        />
      );
  }
}
