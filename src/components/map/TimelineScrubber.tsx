'use client';

import { useEffect, useRef, useMemo } from 'react';
import { MONTH_NAMES } from '@/lib/constants';

interface TimelineScrubberProps {
  selectedMonth: number;
  onMonthChange: (month: number) => void;
}

interface MonthCell {
  year: number;
  month: number; // 1–12
  label: string; // e.g. "Mar'26"
}

function buildTimeline(): { cells: MonthCell[]; currentIndex: number } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-based

  const cells: MonthCell[] = [];
  let currentIndex = 0;

  // Start from Jan of current year, span 3 full years
  for (let y = currentYear; y <= currentYear + 2; y++) {
    for (let m = 1; m <= 12; m++) {
      const shortYear = String(y).slice(2);
      cells.push({
        year: y,
        month: m,
        label: `${MONTH_NAMES[m - 1]}\u2009'${shortYear}`,
      });
      if (y === currentYear && m === currentMonth) {
        currentIndex = cells.length - 1;
      }
    }
  }

  return { cells, currentIndex };
}

export default function TimelineScrubber({
  selectedMonth,
  onMonthChange,
}: TimelineScrubberProps) {
  const { cells, currentIndex } = useMemo(() => buildTimeline(), []);
  const currentRef = useRef<HTMLButtonElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const now = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, []);

  // Auto-scroll to current month on mount
  useEffect(() => {
    if (currentRef.current) {
      currentRef.current.scrollIntoView({
        inline: 'center',
        behavior: 'instant',
      });
    }
  }, []);

  return (
    <div
      ref={scrollContainerRef}
      className="flex gap-1 overflow-x-auto px-3 py-2 scrollbar-none"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {cells.map((cell, i) => {
        const isActive = cell.month === selectedMonth;
        const isPast =
          cell.year < now.year ||
          (cell.year === now.year && cell.month < now.month);
        const isCurrent =
          cell.year === now.year && cell.month === now.month;
        const isYearBoundary =
          i > 0 && cells[i - 1].month === 12 && cell.month === 1;

        return (
          <div key={`${cell.year}-${cell.month}`} className="flex items-center flex-shrink-0">
            {/* Year separator */}
            {isYearBoundary && (
              <span
                className="flex-shrink-0 px-2 text-[10px] font-medium select-none"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                aria-hidden="true"
              >
                {cell.year}
              </span>
            )}

            <button
              ref={i === currentIndex ? currentRef : undefined}
              onClick={() => onMonthChange(cell.month)}
              className="flex-shrink-0 min-h-[44px] min-w-[44px] px-3 py-2 text-sm font-semibold transition-all duration-200 relative"
              style={{
                borderRadius: 'var(--radius-full)',
                background: isActive
                  ? 'var(--surface-elevated)'
                  : 'transparent',
                color: isActive
                  ? 'var(--text-primary)'
                  : isPast
                    ? 'rgba(255,255,255,0.35)'
                    : 'rgba(255,255,255,0.7)',
                boxShadow: isActive
                  ? 'var(--shadow-lg), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : 'none',
                textShadow: isActive
                  ? 'none'
                  : isPast
                    ? 'none'
                    : '0 1px 2px rgba(0,0,0,0.3)',
                opacity: isPast && !isActive ? 0.6 : 1,
              }}
              aria-label={`Show events in ${MONTH_NAMES[cell.month - 1]} ${cell.year}`}
              aria-pressed={isActive}
            >
              {cell.label}
              {/* "Today" dot for current month when not selected */}
              {isCurrent && !isActive && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.6)' }}
                />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
