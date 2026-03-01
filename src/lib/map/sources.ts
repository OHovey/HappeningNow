import type { GeoJSONSourceSpecification } from 'maplibre-gl';

/**
 * Creates a MapLibre GeoJSON source config with clustering enabled.
 */
export function createEventSource(
  geojson: GeoJSON.FeatureCollection
): GeoJSONSourceSpecification {
  return {
    type: 'geojson',
    data: geojson,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  };
}
