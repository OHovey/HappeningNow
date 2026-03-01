'use client';

import type { GeoJSONEventProperties } from '@/lib/supabase/types';
import { formatMonthRange } from '@/lib/affiliates';
import CrowdBadge from '@/components/ui/CrowdBadge';
import AffiliateLinks from '@/components/panel/AffiliateLinks';
import EmailCapture from '@/components/panel/EmailCapture';

interface EventPanelProps {
  event: GeoJSONEventProperties;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  festival: 'from-orange-400 to-orange-600',
  wildlife: 'from-green-400 to-green-600',
};

/**
 * Event detail content rendered inside the BottomSheet.
 *
 * Layout:
 * 1. Hero image (or gradient placeholder with category color)
 * 2. Crowd badge overlaying top-right corner
 * 3. Event name heading
 * 4. Date range and location subtitle
 * 5. Description
 * 6. Affiliate CTA buttons
 * 7. Email capture form with interest checkboxes
 */
export default function EventPanel({ event, onClose }: EventPanelProps) {
  const dateText = formatMonthRange(event.start_month, event.end_month);
  const locationText = [event.region, event.country].filter(Boolean).join(', ');
  const gradientClass = CATEGORY_COLORS[event.category] || 'from-blue-400 to-blue-600';

  return (
    <div className="pb-6">
      {/* Hero image / placeholder */}
      <div className="relative h-48 w-full overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientClass}`}
          >
            <span className="text-4xl opacity-30" aria-hidden="true">
              {event.category === 'wildlife' ? '🦁' : '🎪'}
            </span>
          </div>
        )}

        {/* Crowd badge overlay */}
        {event.crowd_level && (
          <div className="absolute right-3 top-3">
            <CrowdBadge level={event.crowd_level} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4 px-5 pt-4">
        {/* Event name */}
        <h2 className="text-xl font-bold text-gray-900">{event.name}</h2>

        {/* Date and location */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
          {dateText && (
            <span className="inline-flex items-center gap-1">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {dateText}
            </span>
          )}
          {locationText && (
            <span className="inline-flex items-center gap-1">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {locationText}
            </span>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="text-sm leading-relaxed text-gray-600">
            {event.description}
          </p>
        )}

        {/* Affiliate CTAs */}
        <AffiliateLinks event={event} />

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* Email capture */}
        <EmailCapture eventCategory={event.category} />
      </div>
    </div>
  );
}
