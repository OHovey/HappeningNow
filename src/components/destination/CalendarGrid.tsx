'use client';

import MonthColumn from './MonthColumn';
import { computeBestMonths } from '@/lib/destination-utils';
import type { DestinationWithCoords, Event } from '@/lib/supabase/types';

interface CalendarGridProps {
  destination: DestinationWithCoords;
  events: Event[];
}

/**
 * Expand a month range into an array of month numbers (1-12), handling wrap-around.
 */
function expandMonthRange(start: number, end: number): number[] {
  const months: number[] = [];
  if (start <= end) {
    for (let m = start; m <= end; m++) months.push(m);
  } else {
    for (let m = start; m <= 12; m++) months.push(m);
    for (let m = 1; m <= end; m++) months.push(m);
  }
  return months;
}

/**
 * 12-month calendar grid showing crowd levels, events, and weather for each month.
 * Desktop: single horizontal row (grid-cols-12).
 * Mobile: collapses to grid-cols-3 / grid-cols-4.
 */
export default function CalendarGrid({ destination, events }: CalendarGridProps) {
  const { months: bestMonths } = computeBestMonths(
    destination.crowd_data,
    destination.weather_data,
  );

  return (
    <section aria-label="12-month calendar overview">
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2">
        {Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          const crowdScore = destination.crowd_data?.[String(month)] ?? 5;
          const weather = destination.weather_data?.[String(month)] ?? null;

          // Filter events active in this month (handle wrap-around)
          const monthEvents = events.filter((evt) => {
            const activeMonths = expandMonthRange(evt.start_month, evt.end_month);
            return activeMonths.includes(month);
          });

          const isBestMonth = bestMonths.includes(month);

          return (
            <MonthColumn
              key={month}
              month={month}
              crowdScore={crowdScore}
              weather={weather}
              events={monthEvents}
              isBestMonth={isBestMonth}
            />
          );
        })}
      </div>
    </section>
  );
}
