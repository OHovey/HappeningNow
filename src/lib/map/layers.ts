import type { LayerSpecification } from 'maplibre-gl';

/** Circle layer for individual event markers */
export const eventCircleLayer: LayerSpecification = {
  id: 'event-circles',
  type: 'circle',
  source: 'events',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': [
      'match',
      ['get', 'category'],
      'festival', '#f97316',
      'concert', '#a855f7',
      'sport', '#ef4444',
      'arts', '#ec4899',
      'event', '#3b82f6',
      'wildlife', '#22c55e',
      '#3b82f6',
    ],
    'circle-radius': [
      'interpolate', ['linear'], ['get', 'scale'],
      1, 5,
      10, 12,
    ],
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
  },
};

/** Overlay circle for pulse animation */
export const pulseLayer: LayerSpecification = {
  id: 'event-circles-pulse',
  type: 'circle',
  source: 'events',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': [
      'match',
      ['get', 'category'],
      'festival', '#f97316',
      'concert', '#a855f7',
      'sport', '#ef4444',
      'arts', '#ec4899',
      'event', '#3b82f6',
      'wildlife', '#22c55e',
      '#3b82f6',
    ],
    'circle-radius': 8,
    'circle-opacity': 0.4,
  },
};

/** Circle layer for clusters */
export const clusterLayer: LayerSpecification = {
  id: 'clusters',
  type: 'circle',
  source: 'events',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': [
      'step',
      ['get', 'point_count'],
      '#51bbd6',
      10, '#f1f075',
      50, '#f28cb1',
    ],
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      15,
      10, 20,
      50, 25,
    ],
  },
};

/** Symbol layer for cluster counts */
export const clusterCountLayer: LayerSpecification = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'events',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['Noto Sans Regular'],
    'text-size': 12,
  },
};
