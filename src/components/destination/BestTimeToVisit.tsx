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
    <section aria-label="Best time to visit" className="space-y-3">
      <h2 className="text-lg text-text-primary" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
        Best Time to Visit
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        {months.map((m) => (
          <span
            key={m}
            className="inline-flex items-center px-3.5 py-1.5 text-sm font-semibold"
            style={{
              background: 'var(--wildlife-surface)',
              color: 'var(--wildlife)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--wildlife-muted)',
            }}
          >
            {monthName(m)}
          </span>
        ))}
      </div>
      <p className="text-sm text-text-secondary leading-relaxed">{explanation}</p>
    </section>
  );
}
