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
            'festival', '#c2410c',
            'wildlife', '#15803d',
            '#4338ca',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#faf8f5',
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
          .setHTML(`<p style="font-weight:600;font-size:13px;color:#1c1917;font-family:system-ui;">${name}</p>`)
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
      <h2 className="text-2xl text-text-primary mb-4" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>Map</h2>
      <div
        ref={containerRef}
        className="h-[400px] w-full overflow-hidden"
        style={{
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}
        aria-label="Map showing event locations"
      />
      {/* SSR/noscript fallback for Googlebot */}
      <noscript>
        <div
          className="p-4"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <p className="text-sm text-text-secondary">
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
    <div
      className="h-[400px] w-full flex items-center justify-center"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-text-tertiary/20 border-t-text-secondary" />
        <p className="text-xs text-text-tertiary">Loading map</p>
      </div>
    </div>
  ),
});

export default FilteredMap;
