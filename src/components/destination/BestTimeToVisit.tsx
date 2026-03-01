import { computeBestMonths, monthName } from '@/lib/destination-utils';

interface BestTimeToVisitProps {
  crowdData: Record<string, number> | null;
  weatherData: Record<string, { temp_c: number; rain_days: number; sunshine_hours: number }> | null;
}

/**
 * Best-time-to-visit recommendation section.
 * Highlights 2-3 best months as colored pills with explanation text.
 * Server component.
 */
export default function BestTimeToVisit({ crowdData, weatherData }: BestTimeToVisitProps) {
  const { months, explanation } = computeBestMonths(crowdData, weatherData);

  return (
    <section aria-label="Best time to visit" className="space-y-2">
      <h2 className="text-lg font-semibold text-gray-900">Best Time to Visit</h2>
      <div className="flex flex-wrap items-center gap-2">
        {months.map((m) => (
          <span
            key={m}
            className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700"
          >
            {monthName(m)}
          </span>
        ))}
      </div>
      <p className="text-sm text-gray-600">{explanation}</p>
    </section>
  );
}
