'use client';

import { useState } from 'react';
import { crowdScoreToColor, crowdScoreToLabel } from '@/lib/crowd-colors';
import { formatTemperature } from '@/lib/destination-utils';
import { monthName } from '@/lib/destination-utils';
import { buildBookingLink, buildGetYourGuideLink } from '@/lib/affiliates';
import type { Event } from '@/lib/supabase/types';

interface MonthColumnProps {
  month: number;
  crowdScore: number;
  weather: { temp_c: number; rain_days: number; sunshine_hours: number } | null;
  events: Event[];
  isBestMonth: boolean;
}

/**
 * Single month column in the calendar grid.
 * Layout priority: crowd bar top, events middle, weather bottom.
 */
export default function MonthColumn({
  month,
  crowdScore,
  weather,
  events,
  isBestMonth,
}: MonthColumnProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const color = crowdScoreToColor(crowdScore);
  const label = crowdScoreToLabel(crowdScore);

  return (
    <div
      className="flex flex-col transition-shadow"
      style={{
        background: 'var(--surface-elevated)',
        border: isBestMonth ? '2px solid #10b981' : '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: isBestMonth ? 'var(--shadow-md), 0 0 0 1px #10b98130' : 'var(--shadow-sm)',
      }}
    >
      {/* Month header */}
      <div className="px-2 py-1.5 text-center" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <span className="text-xs font-bold text-text-primary" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
          {monthName(month)}
        </span>
      </div>

      {/* Crowd bar (top) */}
      <div className="px-2 pt-2">
        <div
          className="h-1.5 rounded-full"
          style={{ backgroundColor: color }}
          title={`Crowd: ${crowdScore}/10`}
        />
        <p className="text-[10px] text-text-tertiary mt-1 text-center leading-tight">
          {crowdScore}/10 &middot; {label}
        </p>
      </div>

      {/* Events/wildlife pills (middle) */}
      <div className="flex-1 px-2 py-2 space-y-1 min-h-[40px]">
        {events.length === 0 && (
          <p className="text-[10px] text-text-tertiary/50 text-center">No events</p>
        )}
        {events.map((evt) => {
          const isExpanded = expandedEvent === evt.id;
          const pillBg = evt.category === 'wildlife' ? 'var(--wildlife-surface)' : 'var(--festival-surface)';
          const pillColor = evt.category === 'wildlife' ? 'var(--wildlife)' : 'var(--festival)';

          return (
            <div key={evt.id}>
              <button
                onClick={() => setExpandedEvent(isExpanded ? null : evt.id)}
                className="w-full text-left text-[10px] font-semibold px-1.5 py-0.5 truncate transition-opacity hover:opacity-80"
                style={{
                  background: pillBg,
                  color: pillColor,
                  borderRadius: 'var(--radius-full)',
                }}
                title={evt.name}
              >
                {evt.name}
              </button>
              {isExpanded && (
                <div className="mt-1 p-1.5 text-[10px] text-text-secondary space-y-1" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
                  {evt.description && (
                    <p className="line-clamp-2">{evt.description}</p>
                  )}
                  <div className="flex flex-col gap-0.5">
                    {evt.category !== 'wildlife' && (
                      <a
                        href={buildBookingLink({
                          destinationId: evt.booking_destination_id,
                          city: evt.country ? `${evt.name} ${evt.country}` : evt.name,
                          startMonth: month,
                        })}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="hover:underline"
                        style={{ color: 'var(--cta-booking)' }}
                      >
                        Book a stay
                      </a>
                    )}
                    <a
                      href={buildGetYourGuideLink({
                        locationId: evt.getyourguide_location_id,
                        query: evt.name,
                      })}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="hover:underline"
                      style={{ color: 'var(--cta-tours)' }}
                    >
                      Find tours
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Weather data (bottom) */}
      <div className="px-2 py-1.5 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {weather ? (
          <div className="text-[10px] text-text-secondary space-y-0.5">
            <p className="font-semibold text-text-primary">
              {formatTemperature(weather.temp_c)}
            </p>
            <p className="text-text-tertiary">{weather.rain_days}d rain</p>
            <p className="text-text-tertiary">{weather.sunshine_hours}h sun</p>
          </div>
        ) : (
          <p className="text-[10px] text-text-tertiary/40">No data</p>
        )}
      </div>
    </div>
  );
}
