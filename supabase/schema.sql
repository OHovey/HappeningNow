-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- Enable PostGIS extension for geospatial data types and functions
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- Events table: festivals, wildlife spectacles, and other happenings
-- =============================================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('festival', 'wildlife')),
  description TEXT,
  image_url TEXT,
  start_month INTEGER NOT NULL CHECK (start_month BETWEEN 1 AND 12),
  end_month INTEGER NOT NULL CHECK (end_month BETWEEN 1 AND 12),
  location geometry(Point, 4326) NOT NULL,
  country TEXT,
  region TEXT,
  scale INTEGER DEFAULT 5 CHECK (scale BETWEEN 1 AND 10),
  crowd_level TEXT CHECK (crowd_level IN ('quiet', 'moderate', 'busy')),
  booking_destination_id TEXT,
  getyourguide_location_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Spatial index for fast bounding-box and nearest-neighbour queries
CREATE INDEX IF NOT EXISTS events_location_idx ON events USING GIST (location);

-- Category filter index
CREATE INDEX IF NOT EXISTS events_category_idx ON events (category);

-- Month range filter index
CREATE INDEX IF NOT EXISTS events_month_idx ON events (start_month, end_month);

-- =============================================================================
-- Destinations table: places with crowd and weather data
-- =============================================================================
CREATE TABLE IF NOT EXISTS destinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  location geometry(Point, 4326) NOT NULL,
  crowd_data JSONB,   -- monthly crowd scores (1-10) per month
  weather_data JSONB,  -- monthly temp/rain/sunshine per month
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Spatial index for destination lookups
CREATE INDEX IF NOT EXISTS destinations_location_idx ON destinations USING GIST (location);

-- =============================================================================
-- Migration routes table: wildlife migration paths as LineStrings
-- =============================================================================
CREATE TABLE IF NOT EXISTS migration_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  species TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  route geometry(LineString, 4326) NOT NULL,
  peak_months INTEGER[] NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Spatial index for route overlap and intersection queries
CREATE INDEX IF NOT EXISTS migration_routes_route_idx ON migration_routes USING GIST (route);
