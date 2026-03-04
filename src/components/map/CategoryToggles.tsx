'use client';

import { CATEGORY_COLORS } from '@/lib/constants';

interface CategoryTogglesProps {
  activeCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

const CATEGORIES = [
  { key: 'festival', label: 'Festivals', color: CATEGORY_COLORS.festival },
  { key: 'wildlife', label: 'Wildlife', color: CATEGORY_COLORS.wildlife },
] as const;

export default function CategoryToggles({
  activeCategories,
  onCategoryChange,
}: CategoryTogglesProps) {
  function toggle(category: string) {
    if (activeCategories.includes(category)) {
      // Remove category — but keep at least one active
      const next = activeCategories.filter((c) => c !== category);
      if (next.length > 0) {
        onCategoryChange(next);
      }
    } else {
      onCategoryChange([...activeCategories, category]);
    }
  }

  return (
    <div
      className="flex gap-1.5"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {CATEGORIES.map(({ key, label, color }) => {
        const isActive = activeCategories.includes(key);

        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            className="map-control flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] text-sm font-medium transition-all duration-200"
            aria-label={`${isActive ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
            aria-pressed={isActive}
            style={{
              color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full transition-all duration-200"
              style={{
                backgroundColor: color,
                opacity: isActive ? 1 : 0.3,
                boxShadow: isActive ? `0 0 6px ${color}60` : 'none',
              }}
            />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
