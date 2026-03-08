import type { LayerSpecification, Map as MaplibreMap } from 'maplibre-gl';
import type { DestinationWithCoords } from '@/lib/supabase/types';
import { estimateTouristVolume } from '@/lib/crowd-colors';

/** A single cell from crowd-grid.json */
export interface CrowdGridCell {
  lat: number;
  lon: number;
  weight: number; // 0-1 global density (absolute popularity)
  scores: Record<string, number>; // 1-10 per-cell seasonal variation
}

/**
 * Build a GeoJSON FeatureCollection for the crowd heatmap.
 * Merges grid cells (global coverage) with destination points.
 *
 * Each feature gets a `crowd_weight` property that combines:
 *   - Global density (weight) — so Paris is hotter than a village
 *   - Seasonal variation (scores) — so summer is hotter than winter
 */
export function buildCrowdHeatmapSource(
  destinations: DestinationWithCoords[],
  month: number,
  gridCells?: CrowdGridCell[],
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  // Grid cells — global coverage
  if (gridCells) {
    for (const cell of gridCells) {
      const seasonalScore = cell.scores[String(month)] ?? 5;
      // Combine global weight with seasonal score:
      // weight gives absolute density, seasonal score modulates it
      const combinedWeight = cell.weight * (seasonalScore / 10);
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [cell.lon, cell.lat],
        },
        properties: {
          crowd_weight: combinedWeight,
          crowd_score: seasonalScore,
        },
      });
    }
  }

  // Destination points — higher fidelity for known locations
  for (const dest of destinations) {
    const score = dest.crowd_data?.[String(month)] ?? 5;
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [dest.lng, dest.lat],
      },
      properties: {
        name: dest.name,
        slug: dest.slug,
        crowd_weight: score / 10,
        crowd_score: score,
        tourist_volume: estimateTouristVolume(score),
      },
    });
  }

  return { type: 'FeatureCollection', features };
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
    // Weight by combined density × seasonal score (0-1)
    'heatmap-weight': [
      'interpolate', ['linear'], ['get', 'crowd_weight'],
      0, 0,
      0.1, 0.2,
      0.5, 0.6,
      1, 1,
    ],
    // Intensity by zoom
    'heatmap-intensity': [
      'interpolate', ['linear'], ['zoom'],
      0, 1,
      4, 2,
      8, 3,
    ],
    // Cool-to-warm color ramp
    'heatmap-color': [
      'interpolate', ['linear'], ['heatmap-density'],
      0, 'rgba(124, 58, 237, 0)',
      0.1, 'rgba(99, 102, 241, 0.2)',
      0.3, 'rgba(59, 130, 246, 0.4)',    // blue
      0.5, 'rgba(245, 158, 11, 0.5)',    // amber
      0.7, 'rgba(249, 115, 22, 0.6)',    // orange
      0.85, 'rgba(239, 68, 68, 0.7)',    // red
      1.0, 'rgba(220, 38, 38, 0.8)',     // deep red
    ],
    // Radius — blend between neighbours at global scale
    'heatmap-radius': [
      'interpolate', ['linear'], ['zoom'],
      0, 20,
      3, 40,
      6, 60,
      9, 80,
    ],
    'heatmap-opacity': 0.7,
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
