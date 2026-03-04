'use client';

import Link from 'next/link';
import type { GeoJSONEventProperties } from '@/lib/supabase/types';
import { formatMonthRange } from '@/lib/affiliates';
import CrowdBadge from '@/components/ui/CrowdBadge';
import AffiliateLinks from '@/components/panel/AffiliateLinks';
import EmailCapture from '@/components/panel/EmailCapture';

interface EventPanelProps {
  event: GeoJSONEventProperties;
  onClose: () => void;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  festival: 'linear-gradient(160deg, #c2410c 0%, #7c2d12 50%, #451a03 100%)',
  wildlife: 'linear-gradient(160deg, #15803d 0%, #065f46 50%, #022c22 100%)',
};

/**
 * Event detail panel — editorial travel magazine aesthetic.
 * Three visual zones: hero+info, action CTAs, email capture.
 */
export default function EventPanel({ event, onClose }: EventPanelProps) {
  const dateText = formatMonthRange(event.start_month, event.end_month);
  const locationText = [event.region, event.country].filter(Boolean).join(', ');
  const gradient = CATEGORY_GRADIENTS[event.category] || 'linear-gradient(160deg, #4338ca 0%, #312e81 50%, #1e1b4b 100%)';
  const categoryColor = event.category === 'wildlife' ? 'var(--wildlife)' : 'var(--festival)';

  return (
    <div className="pb-8">
      {/* ── ZONE 1: Hero + Event Identity ── */}
      <div className="relative">
        {/* Hero image or gradient — shorter, more cinematic crop */}
        <div className="grain-overlay relative h-36 w-full overflow-hidden sm:h-44">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full" style={{ background: gradient }} />
          )}
          {/* Fade to content background */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, transparent 30%, var(--surface-elevated) 100%)',
            }}
          />

          {/* Crowd badge — top right */}
          {event.crowd_level && (
            <div className="absolute right-4 top-3">
              <CrowdBadge level={event.crowd_level} />
            </div>
          )}
        </div>

        {/* Event name — overlaps the hero fade */}
        <div className="relative -mt-10 px-6">
          <h2
            className="text-2xl leading-tight text-text-primary sm:text-[1.65rem]"
            style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}
          >
            {event.name}
          </h2>
        </div>
      </div>

      {/* Metadata row — date, location, crowd hint */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-6">
        {dateText && (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary">
            <svg className="h-3.5 w-3.5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {dateText}
          </span>
        )}
        {locationText && (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary">
            <svg className="h-3.5 w-3.5 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {locationText}
          </span>
        )}
        {event.crowd_level && (
          <span
            className="text-[13px] font-medium"
            style={{ color: categoryColor }}
          >
            {event.crowd_level === 'quiet' && 'Low season'}
            {event.crowd_level === 'moderate' && 'Moderate crowds'}
            {event.crowd_level === 'busy' && 'Book early!'}
          </span>
        )}
      </div>

      {/* Description */}
      {event.description && (
        <p className="mt-4 px-6 text-[13.5px] leading-relaxed text-text-secondary">
          {event.description}
        </p>
      )}

      {/* View full page — subtle inline link, not a competing button */}
      <div className="mt-4 px-6">
        <Link
          href={event.category === 'wildlife' ? `/wildlife/${event.slug}` : `/event/${event.slug}`}
          className="group inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
          style={{ color: categoryColor }}
        >
          View full details
          <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* ── ZONE 2: Action CTAs ── */}
      <div className="mt-6 px-6">
        <AffiliateLinks event={event} />
      </div>

      {/* ── ZONE 3: Email Capture ── */}
      <div
        className="mx-4 mt-6 px-4 py-5"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <EmailCapture eventCategory={event.category} />
      </div>
    </div>
  );
}
