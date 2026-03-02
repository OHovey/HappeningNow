'use client';

import type { SearchEventResult } from '@/lib/supabase/types';
import { getIndicatorTags } from '@/lib/scoring';
import { buildBookingLink, buildGetYourGuideLink } from '@/lib/affiliates';
import { CATEGORY_COLORS } from '@/lib/constants';

const TAG_STYLES: Record<string, string> = {
  'Highly Unique': 'bg-purple-100 text-purple-700',
  'Unique': 'bg-indigo-100 text-indigo-700',
  'Low Crowds': 'bg-green-100 text-green-700',
};

interface ResultCardProps {
  event: SearchEventResult & { _score: number };
  isSelected: boolean;
  onClick: () => void;
}

export default function ResultCard({ event, isSelected, onClick }: ResultCardProps) {
  const tags = getIndicatorTags(event);
  const categoryColor = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.other;

  const bookingUrl = event.booking_destination_id
    ? buildBookingLink({
        destinationId: event.booking_destination_id,
        city: event.country,
        startMonth: event.start_month,
      })
    : null;

  const gygUrl = event.getyourguide_location_id
    ? buildGetYourGuideLink({ locationId: event.getyourguide_location_id })
    : buildGetYourGuideLink({ query: event.name });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={`flex cursor-pointer gap-3 rounded-xl bg-white p-3 shadow-sm transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Image thumbnail */}
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ backgroundColor: categoryColor + '20' }}
          >
            <span className="text-2xl opacity-30" aria-hidden="true">
              {event.category === 'festival' ? '\u{1F3AA}' : '\u{1F43E}'}
            </span>
          </div>
        )}
        {/* Category accent bar */}
        <div
          className="absolute bottom-0 left-0 h-1 w-full"
          style={{ backgroundColor: categoryColor }}
        />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          {/* Event name */}
          <a
            href={`/event/${event.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 hover:underline"
          >
            {event.name}
          </a>

          {/* Country */}
          {event.country && (
            <p className="text-xs text-gray-400">{event.country}</p>
          )}

          {/* Description (2-line clamp) */}
          {event.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
              {event.description}
            </p>
          )}
        </div>

        {/* Indicator tags */}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                TAG_STYLES[tag] ?? 'bg-gray-100 text-gray-500'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Affiliate CTAs */}
        <div className="mt-1.5 flex gap-2">
          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={(e) => e.stopPropagation()}
              className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-blue-700"
            >
              Booking.com
            </a>
          )}
          <a
            href={gygUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={(e) => e.stopPropagation()}
            className="rounded bg-orange-500 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-orange-600"
          >
            GetYourGuide
          </a>
        </div>
      </div>
    </div>
  );
}
