"use client";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "map" | "card" | "text";
}

export function LoadingSkeleton({
  className = "",
  variant,
}: LoadingSkeletonProps) {
  switch (variant) {
    case "map":
      return (
        <div
          className={`h-screen w-full animate-pulse bg-gray-900 ${className}`}
          role="status"
          aria-label="Loading map"
        />
      );

    case "card":
      return (
        <div
          className={`rounded-lg bg-gray-200 dark:bg-gray-800 ${className}`}
          role="status"
          aria-label="Loading card"
        >
          <div className="animate-pulse space-y-3 p-4">
            <div className="h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-700" />
            <div className="h-4 w-1/2 rounded bg-gray-300 dark:bg-gray-700" />
            <div className="h-20 w-full rounded bg-gray-300 dark:bg-gray-700" />
          </div>
        </div>
      );

    case "text":
      return (
        <div
          className={`space-y-2 ${className}`}
          role="status"
          aria-label="Loading text"
        >
          <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-4/6 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      );

    default:
      return (
        <div
          className={`animate-pulse rounded bg-gray-200 dark:bg-gray-800 ${className}`}
          role="status"
          aria-label="Loading"
        />
      );
  }
}
