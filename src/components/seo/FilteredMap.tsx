'use client';

import { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { OPENFREEMAP_STYLE } from '@/lib/constants';
import type { EventGeoJSON } from '@/lib/supabase/types';

interface FilteredMapProps {
  events: EventGeoJSON;
  /** Optional initial center [lng, lat]. Defaults to fit bounds of events. */
  center?: [number, number];
  /** Optional initial zoom. Defaults to fitting all events. */
  zoom?: number;
}

/**
 * Interactive embedded map filtered to page context.
 *
 * Uses MapLibre with OpenFreeMap tiles. Shows markers for the
 * page's events only. Supports pan/zoom/click interaction.
 *
 * Includes a noscript/SSR fallback listing event locations for
 * Googlebot (no JS crawling per RESEARCH.md Pitfall 4).
 */
function FilteredMapInner({ events, center, zoom }: FilteredMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLE,
      center: center ?? [0, 20],
      zoom: zoom ?? 2,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      map.addSource('seo-events', {
        type: 'geojson',
        data: events,
      });

      map.addLayer({
        id: 'seo-event-circles',
        type: 'circle',
        source: 'seo-events',
        paint: {
          'circle-radius': 8,
          'circle-color': [
            'match',
            ['get', 'category'],
            'festival', '#f97316',
            'wildlife', '#22c55e',
            '#3b82f6',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      });

      // Click marker shows tooltip
      map.on('click', 'seo-event-circles', (e) => {
        const feature = e.features?.[0];
        if (!feature || feature.geometry.type !== 'Point') return;

        const coords = feature.geometry.coordinates.slice() as [number, number];
        const name = feature.properties?.name ?? 'Event';

        new maplibregl.Popup({ closeButton: false, maxWidth: '200px' })
          .setLngLat(coords)
          .setHTML(`<p class="font-medium text-sm">${name}</p>`)
          .addTo(map);
      });

      map.on('mouseenter', 'seo-event-circles', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'seo-event-circles', () => {
        map.getCanvas().style.cursor = '';
      });

      // Fit bounds to events if no explicit center
      if (!center && events.features.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        for (const f of events.features) {
          if (f.geometry.type === 'Point') {
            bounds.extend(f.geometry.coordinates as [number, number]);
          }
        }
        map.fitBounds(bounds, { padding: 50, maxZoom: 10 });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [events, center, zoom]);

  // Extract location names for SSR fallback
  const locationNames = events.features
    .map((f) => f.properties?.name)
    .filter(Boolean)
    .slice(0, 10);

  return (
    <section data-section="map" className="relative">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Map</h2>
      <div
        ref={containerRef}
        className="h-[400px] w-full rounded-lg border border-gray-200 overflow-hidden"
        aria-label="Map showing event locations"
      />
      {/* SSR/noscript fallback for Googlebot */}
      <noscript>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">
            Event locations: {locationNames.join(', ')}
            {events.features.length > 10 && ` and ${events.features.length - 10} more`}.
          </p>
        </div>
      </noscript>
    </section>
  );
}

// Dynamic import wrapper with SSR disabled
import dynamic from 'next/dynamic';

const FilteredMap = dynamic(() => Promise.resolve(FilteredMapInner), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
      <p className="text-sm text-gray-500">Loading map...</p>
    </div>
  ),
});

export default FilteredMap;
