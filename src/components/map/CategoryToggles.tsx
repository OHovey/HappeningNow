'use client';

import { ALL_CATEGORIES, CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/constants';

interface CategoryTogglesProps {
  activeCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

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
      {ALL_CATEGORIES.map((key) => {
        const isActive = activeCategories.includes(key);
        const color = CATEGORY_COLORS[key];
        const label = CATEGORY_LABELS[key];

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
