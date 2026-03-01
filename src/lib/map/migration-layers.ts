import type { LayerSpecification } from 'maplibre-gl';
import type { MigrationRouteWithGeoJSON } from '@/lib/supabase/types';
import { computeActivePosition, computeActivePositionIndex } from '@/lib/route-utils';

// ---------------------------------------------------------------------------
// Species color mapping
// ---------------------------------------------------------------------------

/** Distinct colors per species group for migration route rendering. */
export const SPECIES_COLORS: Record<string, string> = {
  whales: '#0ea5e9',
  wildebeest: '#a3660a',
  butterflies: '#f59e0b',
  birds: '#8b5cf6',
  caribou: '#10b981',
  turtles: '#06b6d4',
};

const DEFAULT_SPECIES_COLOR = '#6b7280';

/** Lookup species color with gray fallback. */
export function getSpeciesColor(species: string): string {
  return SPECIES_COLORS[species.toLowerCase()] ?? DEFAULT_SPECIES_COLOR;
}

// ---------------------------------------------------------------------------
// Route splitting for trail effect
// ---------------------------------------------------------------------------

/**
 * Split the route coordinate array at the given index to create two LineStrings
 * for the trail effect (solid behind dot, dashed ahead).
 */
export function splitRouteAtPosition(
  coordinates: number[][],
  positionIndex: number,
): { completed: number[][]; upcoming: number[][] } {
  const idx = Math.max(0, Math.min(positionIndex, coordinates.length - 1));

  // Completed includes the position point; upcoming starts from position point
  const completed = coordinates.slice(0, idx + 1);
  const upcoming = coordinates.slice(idx);

  // Ensure at least 2 points for valid LineString (duplicate if needed)
  if (completed.length < 2) {
    return {
      completed: completed.length === 1 ? [completed[0], completed[0]] : [coordinates[0], coordinates[0]],
      upcoming: upcoming.length < 2 ? [coordinates[idx], coordinates[idx]] : upcoming,
    };
  }
  if (upcoming.length < 2) {
    return {
      completed,
      upcoming: [coordinates[idx], coordinates[idx]],
    };
  }

  return { completed, upcoming };
}

// ---------------------------------------------------------------------------
// GeoJSON source builders
// ---------------------------------------------------------------------------

/**
 * Build three GeoJSON sources for a single migration route:
 * - completedSource: LineString from start to current position (solid trail)
 * - upcomingSource: LineString from current position to end (dashed trail)
 * - dotSource: Point at the current position
 */
export function buildRouteSources(
  route: MigrationRouteWithGeoJSON,
  selectedMonth: number,
): {
  completedSource: GeoJSON.Feature;
  upcomingSource: GeoJSON.Feature;
  dotSource: GeoJSON.Feature;
} {
  const coords = route.route_geojson?.coordinates ?? [];
  const positionIndex = computeActivePositionIndex(coords, route.peak_months, selectedMonth);
  const position = computeActivePosition(coords, route.peak_months, selectedMonth);
  const { completed, upcoming } = splitRouteAtPosition(coords, positionIndex);

  return {
    completedSource: {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: completed },
      properties: { routeId: route.id, species: route.species },
    },
    upcomingSource: {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: upcoming },
      properties: { routeId: route.id, species: route.species },
    },
    dotSource: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: position ?? (coords[0] ? [coords[0][0], coords[0][1]] : [0, 0]),
      },
      properties: { routeId: route.id, species: route.species },
    },
  };
}

// ---------------------------------------------------------------------------
// Layer factories
// ---------------------------------------------------------------------------

/**
 * Create completed (solid) and upcoming (dashed) line layers for a route.
 */
export function createRouteLayerPair(
  routeId: string,
  species: string,
): { completedLayer: LayerSpecification; upcomingLayer: LayerSpecification } {
  const color = getSpeciesColor(species);

  const completedLayer: LayerSpecification = {
    id: `route-${routeId}-completed`,
    type: 'line',
    source: `route-${routeId}-completed`,
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': color,
      'line-width': 3,
      'line-opacity': 0.9,
    },
  };

  const upcomingLayer: LayerSpecification = {
    id: `route-${routeId}-upcoming`,
    type: 'line',
    source: `route-${routeId}-upcoming`,
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-color': color,
      'line-width': 2,
      'line-opacity': 0.4,
      'line-dasharray': [2, 4],
    },
  };

  return { completedLayer, upcomingLayer };
}

/**
 * Create the main dot circle layer for a migration route.
 */
export function createDotLayer(routeId: string, species: string): LayerSpecification {
  return {
    id: `route-${routeId}-dot`,
    type: 'circle',
    source: `route-${routeId}-dot`,
    paint: {
      'circle-radius': 7,
      'circle-color': getSpeciesColor(species),
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
      'circle-opacity': 1,
    },
  };
}

/**
 * Create the pulse overlay circle layer for a migration route dot.
 */
export function createDotPulseLayer(routeId: string, species: string): LayerSpecification {
  return {
    id: `route-${routeId}-dot-pulse`,
    type: 'circle',
    source: `route-${routeId}-dot`,
    paint: {
      'circle-radius': 12,
      'circle-color': getSpeciesColor(species),
      'circle-opacity': 0.3,
    },
  };
}
