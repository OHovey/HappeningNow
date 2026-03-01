'use client';

import { MONTH_NAMES } from '@/lib/constants';

interface TimelineScrubberProps {
  selectedMonth: number;
  onMonthChange: (month: number) => void;
}

export default function TimelineScrubber({
  selectedMonth,
  onMonthChange,
}: TimelineScrubberProps) {
  return (
    <div
      className="flex gap-1.5 overflow-x-auto px-3 py-2 scrollbar-none sm:justify-center sm:overflow-x-visible"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {MONTH_NAMES.map((name, index) => {
        const month = index + 1;
        const isActive = month === selectedMonth;

        return (
          <button
            key={month}
            onClick={() => onMonthChange(month)}
            className={`
              flex-shrink-0 rounded-full px-3 py-2 text-sm font-medium
              min-h-[44px] min-w-[44px] transition-colors duration-200
              ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white/80 text-gray-600 hover:bg-white hover:text-gray-900'
              }
            `}
            aria-label={`Show events in ${name}`}
            aria-pressed={isActive}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
