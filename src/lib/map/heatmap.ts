import type { LayerSpecification, Map as MaplibreMap } from 'maplibre-gl';
import type { DestinationWithCoords } from '@/lib/supabase/types';
import { estimateTouristVolume } from '@/lib/crowd-colors';

/**
 * Build a GeoJSON FeatureCollection from destinations for the crowd heatmap.
 * Each destination becomes a Point feature with crowd_score for the given month.
 */
export function buildCrowdHeatmapSource(
  destinations: DestinationWithCoords[],
  month: number,
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: destinations.map((dest) => {
      const score = dest.crowd_data?.[String(month)] ?? 5;
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [dest.lng, dest.lat],
        },
        properties: {
          name: dest.name,
          slug: dest.slug,
          crowd_score: score,
          tourist_volume: estimateTouristVolume(score),
        },
      };
    }),
  };
}

/**
 * MapLibre heatmap layer configuration for crowd density.
 * Cool-to-warm gradient: transparent purple -> blue -> amber -> orange -> red.
 * Renders as a subtle background wash below event markers.
 */
export const crowdHeatmapLayer: LayerSpecification = {
  id: 'crowd-heatmap',
  type: 'heatmap',
  source: 'crowd-heatmap',
  paint: {
    // Weight each point by its crowd score (1 = no weight, 10 = full weight)
    'heatmap-weight': [
      'interpolate', ['linear'], ['get', 'crowd_score'],
      1, 0,
      10, 1,
    ],
    // Increase intensity as user zooms in
    'heatmap-intensity': [
      'interpolate', ['linear'], ['zoom'],
      0, 1,
      9, 3,
    ],
    // Cool-to-warm color ramp on heatmap-density (0-1)
    'heatmap-color': [
      'interpolate', ['linear'], ['heatmap-density'],
      0, 'rgba(124, 58, 237, 0)',     // transparent purple
      0.2, 'rgba(99, 102, 241, 0.4)', // indigo
      0.4, 'rgba(59, 130, 246, 0.5)', // blue
      0.6, 'rgba(245, 158, 11, 0.6)', // amber
      0.8, 'rgba(249, 115, 22, 0.7)', // orange
      1.0, 'rgba(239, 68, 68, 0.8)',  // red
    ],
    // Regional blob size increases with zoom (enlarged for visibility with ~30 sparse data points)
    'heatmap-radius': [
      'interpolate', ['linear'], ['zoom'],
      0, 30,
      3, 50,
      6, 80,
      9, 100,
    ],
    // Subtle background wash
    'heatmap-opacity': 0.6,
  },
};

/**
 * Toggle visibility of the crowd heatmap layer.
 */
export function toggleHeatmapVisibility(map: MaplibreMap, visible: boolean): void {
  map.setLayoutProperty(
    'crowd-heatmap',
    'visibility',
    visible ? 'visible' : 'none',
  );
}
