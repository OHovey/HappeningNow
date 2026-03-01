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
      className={`flex flex-col rounded-lg bg-white border transition-shadow ${
        isBestMonth
          ? 'ring-2 ring-emerald-400 border-emerald-300 shadow-md'
          : 'border-gray-200 shadow-sm'
      }`}
    >
      {/* Month header */}
      <div className="px-2 py-1.5 text-center border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-700">
          {monthName(month)}
        </span>
      </div>

      {/* Crowd bar (top) */}
      <div className="px-2 pt-2">
        <div
          className="h-2 rounded-full"
          style={{ backgroundColor: color }}
          title={`Crowd: ${crowdScore}/10`}
        />
        <p className="text-[10px] text-gray-500 mt-1 text-center leading-tight">
          {crowdScore}/10 &middot; {label}
        </p>
      </div>

      {/* Events/wildlife pills (middle) */}
      <div className="flex-1 px-2 py-2 space-y-1 min-h-[40px]">
        {events.length === 0 && (
          <p className="text-[10px] text-gray-300 text-center">No events</p>
        )}
        {events.map((evt) => {
          const isExpanded = expandedEvent === evt.id;
          const pillColor =
            evt.category === 'wildlife' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';

          return (
            <div key={evt.id}>
              <button
                onClick={() => setExpandedEvent(isExpanded ? null : evt.id)}
                className={`w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded-full truncate ${pillColor} hover:opacity-80 transition-opacity`}
                title={evt.name}
              >
                {evt.name}
              </button>
              {isExpanded && (
                <div className="mt-1 p-1.5 bg-gray-50 rounded text-[10px] text-gray-600 space-y-1">
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
                        className="text-blue-600 hover:underline"
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
                      className="text-orange-600 hover:underline"
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
      <div className="px-2 py-1.5 border-t border-gray-100 text-center">
        {weather ? (
          <div className="text-[10px] text-gray-500 space-y-0.5">
            <p className="font-medium text-gray-700">
              {formatTemperature(weather.temp_c)}
            </p>
            <p>{weather.rain_days}d rain</p>
            <p>{weather.sunshine_hours}h sun</p>
          </div>
        ) : (
          <p className="text-[10px] text-gray-300">No data</p>
        )}
      </div>
    </div>
  );
}
