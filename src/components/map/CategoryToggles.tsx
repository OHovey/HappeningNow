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
      className="flex gap-2"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {CATEGORIES.map(({ key, label, color }) => {
        const isActive = activeCategories.includes(key);

        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`
              flex items-center gap-1.5 rounded-full px-3 py-2
              min-h-[44px] text-sm font-medium transition-all duration-200
              ${
                isActive
                  ? 'bg-white shadow-md text-gray-900'
                  : 'bg-white/50 text-gray-400 hover:bg-white/70'
              }
            `}
            aria-label={`${isActive ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
            aria-pressed={isActive}
          >
            <span
              className="inline-block h-3 w-3 rounded-full transition-opacity duration-200"
              style={{
                backgroundColor: color,
                opacity: isActive ? 1 : 0.4,
              }}
            />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
