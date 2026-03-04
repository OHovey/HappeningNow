'use client';

import type { SearchEventResult } from '@/lib/supabase/types';
import { getIndicatorTags } from '@/lib/scoring';
import { buildBookingLink, buildGetYourGuideLink } from '@/lib/affiliates';
import { CATEGORY_COLORS } from '@/lib/constants';

const TAG_STYLES: Record<string, { bg: string; text: string }> = {
  'Highly Unique': { bg: 'rgba(67, 56, 202, 0.1)', text: 'var(--accent)' },
  'Unique': { bg: 'rgba(67, 56, 202, 0.08)', text: 'var(--accent)' },
  'Low Crowds': { bg: 'var(--wildlife-surface)', text: 'var(--wildlife)' },
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
      className="flex cursor-pointer gap-3 p-3 transition-all"
      style={{
        background: 'var(--surface-elevated)',
        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
      }}
    >
      {/* Image thumbnail */}
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden" style={{ borderRadius: 'var(--radius-md)' }}>
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
            style={{ backgroundColor: categoryColor + '15' }}
          >
            <span className="text-2xl opacity-30" aria-hidden="true">
              {event.category === 'festival' ? '\u{1F3AA}' : '\u{1F43E}'}
            </span>
          </div>
        )}
        {/* Category accent bar */}
        <div
          className="absolute bottom-0 left-0 h-0.5 w-full"
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
            className="text-sm font-semibold text-text-primary transition-colors hover:text-accent"
          >
            {event.name}
          </a>

          {/* Country */}
          {event.country && (
            <p className="text-xs text-text-tertiary">{event.country}</p>
          )}

          {/* Description (2-line clamp) */}
          {event.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">
              {event.description}
            </p>
          )}
        </div>

        {/* Indicator tags */}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {tags.map((tag) => {
            const style = TAG_STYLES[tag] ?? { bg: 'var(--surface)', text: 'var(--text-tertiary)' };
            return (
              <span
                key={tag}
                className="inline-block px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  background: style.bg,
                  color: style.text,
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {tag}
              </span>
            );
          })}
        </div>

        {/* Affiliate CTAs */}
        <div className="mt-1.5 flex gap-2">
          {bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={(e) => e.stopPropagation()}
              className="px-2 py-0.5 text-[10px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--cta-booking)', borderRadius: 'var(--radius-sm)' }}
            >
              Booking.com
            </a>
          )}
          <a
            href={gygUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={(e) => e.stopPropagation()}
            className="px-2 py-0.5 text-[10px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--cta-tours)', borderRadius: 'var(--radius-sm)' }}
          >
            GetYourGuide
          </a>
        </div>
      </div>
    </div>
  );
}
