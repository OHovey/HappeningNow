/**
 * Database types matching the PostGIS schema in supabase/schema.sql.
 * Keep in sync with any schema migrations.
 */

export type EventCategory = 'festival' | 'concert' | 'sport' | 'arts' | 'event' | 'wildlife';

// ---------------------------------------------------------------------------
// Row types (matching table columns)
// ---------------------------------------------------------------------------

export interface Event {
  id: string;
  name: string;
  slug: string;
  category: EventCategory;
  description: string | null;
  image_url: string | null;
  start_month: number;
  end_month: number;
  /** Exact start date for dated events (Ticketmaster etc). Null for month-based events. */
  start_date: string | null;
  /** Exact end date for dated events. Null for month-based events. */
  end_date: string | null;
  /** Event lifecycle status */
  status: "active" | "archived" | "cancelled" | "postponed" | "review_needed";
  /** When was this event last confirmed by a data source */
  last_confirmed_at: string | null;
  /** Confidence score: 1.0 = authoritative API, 0.5-0.9 = scraped */
  confidence: number;
  /** Which data source created/last updated this event */
  source: "ticketmaster" | "wikipedia" | "apify_tourism" | "apify_wildlife" | "manual" | null;
  /** External ID from the source (for deduplication) */
  source_id: string | null;
  /** PostGIS geometry stored as WKB — not directly usable in TS; use GeoJSON exports */
  location: unknown;
  country: string | null;
  region: string | null;
  scale: number;
  crowd_level: "quiet" | "moderate" | "busy" | null;
  booking_destination_id: string | null;
  getyourguide_location_id: string | null;
  migration_route_id: string | null;
  created_at: string;
}

export interface Destination {
  id: string;
  name: string;
  slug: string;
  country: string;
  region: string | null;
  location: unknown;
  /** Monthly crowd scores (1-10) keyed by month number */
  crowd_data: Record<string, number> | null;
  /** Monthly weather data keyed by month number */
  weather_data: Record<string, { temp_c: number; rain_days: number; sunshine_hours: number }> | null;
  /** Booking.com destination ID for the search widget (null if not mapped) */
  booking_destination_id: string | null;
  created_at: string;
}

/** Destination with extracted lng/lat coordinates (from get_destinations_with_coords RPC). */
export interface DestinationWithCoords extends Omit<Destination, 'location'> {
  lng: number;
  lat: number;
}

export interface MigrationRoute {
  id: string;
  species: string;
  name: string;
  slug: string;
  /** PostGIS LineString geometry — use GeoJSON exports for rendering */
  route: unknown;
  peak_months: number[];
  description: string | null;
  image_url: string | null;
  created_at: string;
}

/** Event with extracted lng/lat coordinates (from get_event_with_coords RPC). */
export interface EventWithCoords extends Omit<Event, 'location'> {
  lng: number;
  lat: number;
  /** Route GeoJSON from linked migration_route (wildlife events only) */
  route_geojson?: {
    type: 'LineString';
    coordinates: number[][];
  } | null;
  /** Peak viewing months from linked migration_route (wildlife events only) */
  peak_months?: number[] | null;
}

/** Event result from search_events_nearby RPC with extracted coordinates and distance. */
export interface SearchEventResult {
  id: string;
  name: string;
  slug: string;
  category: EventCategory;
  description: string | null;
  image_url: string | null;
  start_month: number;
  end_month: number;
  lng: number;
  lat: number;
  country: string | null;
  region: string | null;
  scale: number;
  crowd_level: "quiet" | "moderate" | "busy" | null;
  booking_destination_id: string | null;
  getyourguide_location_id: string | null;
  distance_meters: number;
}

/** MigrationRoute with parsed GeoJSON route geometry (from RPC). */
export interface MigrationRouteWithGeoJSON extends Omit<MigrationRoute, 'route'> {
  route_geojson: {
    type: 'LineString';
    coordinates: number[][];
  } | null;
}

// ---------------------------------------------------------------------------
// GeoJSON types for map rendering
// ---------------------------------------------------------------------------

/** Properties attached to each event Feature returned by get_events_geojson() */
export interface GeoJSONEventProperties {
  id: string;
  name: string;
  slug: string;
  category: EventCategory;
  description: string | null;
  image_url: string | null;
  start_month: number;
  end_month: number;
  start_date?: string | null;
  end_date?: string | null;
  scale: number;
  crowd_level: "quiet" | "moderate" | "busy" | null;
  country: string | null;
  region: string | null;
  booking_destination_id: string | null;
  getyourguide_location_id: string | null;
  status?: string;
  source?: string | null;
}

export interface GeoJSONEvent {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [longitude: number, latitude: number];
  };
  properties: GeoJSONEventProperties;
}

export interface EventGeoJSON {
  type: "FeatureCollection";
  features: GeoJSONEvent[];
}

// ---------------------------------------------------------------------------
// Supabase Database type (for typed client queries)
// ---------------------------------------------------------------------------

export interface AffiliateLink {
  id: string;
  destination_id: string;
  brand: string;
  date_start: string | null;
  date_end: string | null;
  original_url: string;
  affiliate_url: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      events: {
        Row: Event;
        Insert: Omit<Event, "id" | "created_at" | "scale" | "status" | "confidence"> & {
          id?: string;
          created_at?: string;
          scale?: number;
          status?: Event["status"];
          confidence?: number;
        };
        Update: Partial<Omit<Event, "id">>;
      };
      affiliate_links: {
        Row: AffiliateLink;
        Insert: Omit<AffiliateLink, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<AffiliateLink, "id">>;
      };
      destinations: {
        Row: Destination;
        Insert: Omit<Destination, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Destination, "id">>;
      };
      migration_routes: {
        Row: MigrationRoute;
        Insert: Omit<MigrationRoute, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<MigrationRoute, "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_events_geojson: {
        Args: Record<string, never>;
        Returns: EventGeoJSON;
      };
      get_events_bbox: {
        Args: {
          min_lng: number;
          min_lat: number;
          max_lng: number;
          max_lat: number;
          filter_month: number | null;
          filter_category: string | null;
        };
        Returns: EventGeoJSON;
      };
      get_event_with_coords: {
        Args: { event_slug: string };
        Returns: EventWithCoords[];
      };
      get_wildlife_with_route: {
        Args: { route_slug: string };
        Returns: MigrationRouteWithGeoJSON[];
      };
      get_destinations_with_coords: {
        Args: Record<string, never>;
        Returns: DestinationWithCoords[];
      };
      get_all_routes_with_geojson: {
        Args: Record<string, never>;
        Returns: MigrationRouteWithGeoJSON[];
      };
      search_events_nearby: {
        Args: {
          user_lng: number;
          user_lat: number;
          radius_meters: number;
          start_m: number | null;
          end_m: number | null;
          filter_category: string | null;
        };
        Returns: SearchEventResult[];
      };
    };
    Enums: Record<string, never>;
  };
}
