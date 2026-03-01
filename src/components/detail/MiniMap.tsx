'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { OPENFREEMAP_STYLE } from '@/lib/constants';

interface WaypointLabel {
  coordinates: [number, number];
  label: string;
}

interface MiniMapProps {
  /** Center coordinates [lng, lat] */
  coordinates: [lng: number, lat: number];
  /** Zoom level (default 10) */
  zoom?: number;
  /** Optional migration route coordinates for wildlife */
  routeCoordinates?: number[][];
  /** Optional active position along the migration route (current-month highlight) */
  activePosition?: [lng: number, lat: number];
  /** Optional labeled waypoints along the route */
  waypointLabels?: WaypointLabel[];
}

/**
 * Small embedded MapLibre map for detail pages.
 *
 * Shows a single marker at the given coordinates. For wildlife pages,
 * optionally renders a migration route line, waypoint labels, and a
 * highlighted dot for the current-month position.
 *
 * Must be loaded with next/dynamic ssr:false in consuming pages.
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

    map.on('load', () => {
      // Primary marker at main coordinates
      new maplibregl.Marker({ color: '#ef4444' })
        .setLngLat(coordinates)
        .addTo(map);

      // Migration route line
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
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#22c55e',
            'line-width': 3,
            'line-opacity': 0.7,
          },
        });

        // Fit bounds to show full route
        const bounds = new maplibregl.LngLatBounds();
        for (const coord of routeCoordinates) {
          bounds.extend(coord as [number, number]);
        }
        map.fitBounds(bounds, { padding: 40, maxZoom: 8 });
      }

      // Waypoint labels
      if (waypointLabels && waypointLabels.length > 0) {
        for (const wp of waypointLabels) {
          const el = document.createElement('div');
          el.className =
            'bg-white/90 text-gray-700 text-[10px] font-medium px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none';
          el.textContent = wp.label;

          new maplibregl.Marker({ element: el })
            .setLngLat(wp.coordinates)
            .addTo(map);
        }
      }

      // Active position highlight (current-month dot)
      if (activePosition) {
        const dot = document.createElement('div');
        dot.className =
          'w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-md';

        new maplibregl.Marker({ element: dot })
          .setLngLat(activePosition)
          .addTo(map);
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
      className="w-full rounded-lg overflow-hidden"
      style={{ aspectRatio: '16 / 9', maxHeight: 200 }}
      aria-label="Location map"
      role="img"
    />
  );
}
