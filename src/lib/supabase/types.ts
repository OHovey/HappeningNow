/**
 * Database types matching the PostGIS schema in supabase/schema.sql.
 * Keep in sync with any schema migrations.
 */

// ---------------------------------------------------------------------------
// Row types (matching table columns)
// ---------------------------------------------------------------------------

export interface Event {
  id: string;
  name: string;
  slug: string;
  category: "festival" | "wildlife";
  description: string | null;
  image_url: string | null;
  start_month: number;
  end_month: number;
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
  category: "festival" | "wildlife";
  description: string | null;
  image_url: string | null;
  start_month: number;
  end_month: number;
  scale: number;
  crowd_level: "quiet" | "moderate" | "busy" | null;
  country: string | null;
  region: string | null;
  booking_destination_id: string | null;
  getyourguide_location_id: string | null;
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

export interface Database {
  public: {
    Tables: {
      events: {
        Row: Event;
        Insert: Omit<Event, "id" | "created_at" | "scale"> & {
          id?: string;
          created_at?: string;
          scale?: number;
        };
        Update: Partial<Omit<Event, "id">>;
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
    };
    Enums: Record<string, never>;
  };
}
