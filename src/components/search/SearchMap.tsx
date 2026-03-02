'use client';

import { useRef, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { OPENFREEMAP_STYLE } from '@/lib/constants';
import type { SearchEventResult } from '@/lib/supabase/types';

interface SearchMapProps {
  results: (SearchEventResult & { _score: number })[];
  selectedResultId: string | null;
  onMarkerClick: (eventId: string) => void;
  userLocation: { lat: number; lng: number } | null;
}

function buildResultsGeoJSON(
  results: SearchEventResult[],
): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: results.map((r) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [r.lng, r.lat],
      },
      properties: {
        id: r.id,
        name: r.name,
        category: r.category,
      },
    })),
  };
}

export default function SearchMap({
  results,
  selectedResultId,
  onMarkerClick,
  userLocation,
}: SearchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLE,
      center: [0, 20],
      zoom: 2,
    });

    mapRef.current = map;

    map.once('style.load', () => map.resize());

    map.on('load', () => {
      // Result markers source
      map.addSource('search-results', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Base result circles
      map.addLayer({
        id: 'search-result-circles',
        type: 'circle',
        source: 'search-results',
        paint: {
          'circle-radius': 8,
          'circle-color': '#ef4444',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });

      // Highlighted result layer (filtered to selected)
      map.addLayer({
        id: 'search-result-highlight',
        type: 'circle',
        source: 'search-results',
        filter: ['==', ['get', 'id'], ''],
        paint: {
          'circle-radius': 14,
          'circle-color': '#3b82f6',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 3,
        },
      });

      // Click handler
      map.on('click', 'search-result-circles', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['search-result-circles'],
        });
        if (features.length > 0) {
          const id = features[0].properties?.id;
          if (id) onMarkerClick(id);
        }
      });

      // Cursor
      map.on('mouseenter', 'search-result-circles', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'search-result-circles', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    return () => {
      userMarkerRef.current?.remove();
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update results source data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('search-results') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(buildResultsGeoJSON(results));
    }

    // Fit bounds to show all results + user location
    if (results.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      for (const r of results) {
        bounds.extend([r.lng, r.lat]);
      }
      if (userLocation) {
        bounds.extend([userLocation.lng, userLocation.lat]);
      }
      map.fitBounds(bounds, { padding: 60, maxZoom: 12 });
    }
  }, [results, userLocation]);

  // Update selected marker highlight
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('search-result-highlight')) {
      map.setFilter('search-result-highlight', [
        '==',
        ['get', 'id'],
        selectedResultId ?? '',
      ]);
    }
  }, [selectedResultId]);

  // Update user location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    userMarkerRef.current?.remove();

    if (userLocation) {
      const el = document.createElement('div');
      el.className = 'search-user-marker';
      el.style.cssText =
        'width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3);';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);

      userMarkerRef.current = marker;
    }
  }, [userLocation]);

  return <div ref={containerRef} className="h-full w-full" />;
}
