'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { OPENFREEMAP_STYLE } from '@/lib/constants';

interface WaypointLabel {
  coordinates: [number, number];
  label: string;
}

interface MiniMapProps {
  coordinates: [lng: number, lat: number];
  zoom?: number;
  routeCoordinates?: number[][];
  activePosition?: [lng: number, lat: number];
  waypointLabels?: WaypointLabel[];
}

/**
 * Small embedded MapLibre map for detail pages.
 * Forces a resize after mount to ensure full container width rendering.
 */
export default function MiniMap({
  coordinates,
  zoom = 10,
  routeCoordinates,
  activePosition,
  waypointLabels,
}: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLE,
      center: coordinates,
      zoom,
      interactive: false,
      attributionControl: false,
    });

    mapRef.current = map;

    // Force resize after style loads to fill full container width
    map.once('style.load', () => {
      map.resize();
    });

    map.on('load', () => {
      // Additional resize to catch late container dimension changes
      requestAnimationFrame(() => map.resize());

      new maplibregl.Marker({ color: '#c2410c' })
        .setLngLat(coordinates)
        .addTo(map);

      if (routeCoordinates && routeCoordinates.length >= 2) {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routeCoordinates,
            },
          },
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#15803d',
            'line-width': 3,
            'line-opacity': 0.7,
          },
        });

        const bounds = new maplibregl.LngLatBounds();
        for (const coord of routeCoordinates) {
          bounds.extend(coord as [number, number]);
        }
        map.fitBounds(bounds, { padding: 40, maxZoom: 8 });
      }

      if (waypointLabels && waypointLabels.length > 0) {
        for (const wp of waypointLabels) {
          const el = document.createElement('div');
          el.style.cssText =
            'background:rgba(250,248,245,0.9);color:var(--text-secondary);font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.1);white-space:nowrap;pointer-events:none;';
          el.textContent = wp.label;
          new maplibregl.Marker({ element: el }).setLngLat(wp.coordinates).addTo(map);
        }
      }

      if (activePosition) {
        const dot = document.createElement('div');
        dot.style.cssText =
          'width:16px;height:16px;border-radius:50%;background:#b45309;border:2px solid white;box-shadow:0 0 8px rgba(180,83,9,0.4);';
        new maplibregl.Marker({ element: dot }).setLngLat(activePosition).addTo(map);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [coordinates, zoom, routeCoordinates, activePosition, waypointLabels]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden"
      style={{
        height: 220,
        minHeight: 180,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
      }}
      aria-label="Location map"
      role="img"
    />
  );
}
