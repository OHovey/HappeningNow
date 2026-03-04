-- Migration: Add data pipeline columns to events table and create affiliate_links table
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- =============================================================================
-- 1. Add pipeline columns to events table
-- =============================================================================

-- Exact dates for Ticketmaster / dated events (nullable — wildlife uses month-based)
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date DATE;

-- Event lifecycle status
ALTER TABLE events ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'archived', 'cancelled', 'postponed', 'review_needed'));

-- When was this event last confirmed by a data source?
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_confirmed_at TIMESTAMPTZ;

-- Confidence score: 1.0 = authoritative API, 0.5-0.9 = scraped
ALTER TABLE events ADD COLUMN IF NOT EXISTS confidence FLOAT NOT NULL DEFAULT 1.0
  CHECK (confidence >= 0.0 AND confidence <= 1.0);

-- Which data source created/last updated this event
ALTER TABLE events ADD COLUMN IF NOT EXISTS source TEXT
  CHECK (source IN ('ticketmaster', 'wikipedia', 'apify_tourism', 'apify_wildlife', 'manual'));

-- External ID from the source (for deduplication)
ALTER TABLE events ADD COLUMN IF NOT EXISTS source_id TEXT;

-- Index for status filtering (all queries will filter on status = 'active')
CREATE INDEX IF NOT EXISTS events_status_idx ON events (status);

-- Index for source dedup lookups
CREATE INDEX IF NOT EXISTS events_source_idx ON events (source, source_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS events_dates_idx ON events (start_date, end_date);

-- Set existing events to source = 'manual' and last_confirmed_at = now
UPDATE events SET source = 'manual', last_confirmed_at = now() WHERE source IS NULL;

-- =============================================================================
-- 2. Create affiliate_links cache table
-- =============================================================================

CREATE TABLE IF NOT EXISTS affiliate_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id TEXT NOT NULL,
  brand TEXT NOT NULL,
  date_start DATE,
  date_end DATE,
  original_url TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS affiliate_links_lookup_idx
  ON affiliate_links (destination_id, brand, date_start, date_end);

-- Index for TTL cleanup
CREATE INDEX IF NOT EXISTS affiliate_links_created_idx ON affiliate_links (created_at);
