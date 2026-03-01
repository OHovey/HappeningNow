'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { MAP_DEFAULTS, OPENFREEMAP_STYLE } from '@/lib/constants';
import { createEventSource } from '@/lib/map/sources';
import {
  eventCircleLayer,
  pulseLayer,
  clusterLayer,
  clusterCountLayer,
} from '@/lib/map/layers';
import { startPulseAnimation } from '@/lib/map/animations';
import { filterGeoJSON, getCurrentMonth } from '@/lib/map/filters';
import type { GeoJSONEventProperties } from '@/lib/supabase/types';
import TimelineScrubber from '@/components/map/TimelineScrubber';
import CategoryToggles from '@/components/map/CategoryToggles';
import BottomSheet from '@/components/ui/BottomSheet';
import EventPanel from '@/components/panel/EventPanel';

const EMPTY_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

/** Debounce delay for moveend events (ms) */
const MOVEEND_DEBOUNCE_MS = 350;

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<number>(getCurrentMonth());
  const [activeCategories, setActiveCategories] = useState<string[]>([
    'festival',
    'wildlife',
  ]);
  const [allGeoJSON, setAllGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<GeoJSONEventProperties | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  /**
   * Fetch events from the bbox API for the current map viewport.
   * Returns parsed GeoJSON FeatureCollection.
   */
  const fetchBboxEvents = useCallback(
    async (map: maplibregl.Map, signal: AbortSignal) => {
      const bounds = map.getBounds();
      const bbox = [
        bounds.getWest(),  // min_lng
        bounds.getSouth(), // min_lat
        bounds.getEast(),  // max_lng
        bounds.getNorth(), // max_lat
      ].join(',');

      const params = new URLSearchParams({ bbox });
      if (selectedMonth) params.set('month', String(selectedMonth));
      if (activeCategories.length === 1) params.set('category', activeCategories[0]);

      const res = await fetch(`/api/events?${params}`, { signal });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
    [selectedMonth, activeCategories]
  );

  /**
   * Trigger a bbox fetch, update allGeoJSON state, and set source data
   * with client-side filtering applied.
   */
  const triggerBboxFetch = useCallback(
    async (map: maplibregl.Map, signal: AbortSignal) => {
      try {
        const data = await fetchBboxEvents(map, signal);
        setAllGeoJSON(data);
        setError(null);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Failed to load events';
        setError(message);
        console.error('Failed to fetch bbox events:', err);
      }
    },
    [fetchBboxEvents]
  );

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLE,
      center: MAP_DEFAULTS.center,
      zoom: MAP_DEFAULTS.zoom,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Add empty source initially; data will be set when bbox fetch completes
      map.addSource('events', createEventSource(EMPTY_GEOJSON));

      // Add layers
      map.addLayer(clusterLayer);
      map.addLayer(clusterCountLayer);
      map.addLayer(eventCircleLayer);
      map.addLayer(pulseLayer);

      // Start pulse animation
      cleanupRef.current = startPulseAnimation(map);

      // Cluster click handler
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        });
        if (!features.length) return;

        const clusterId = features[0].properties?.cluster_id;
        const source = map.getSource('events') as maplibregl.GeoJSONSource;

        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const geometry = features[0].geometry;
          if (geometry.type !== 'Point') return;

          map.easeTo({
            center: geometry.coordinates as [number, number],
            zoom,
          });
        });
      });

      // Event marker click handler -- open bottom sheet
      map.on('click', 'event-circles', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['event-circles'],
        });
        if (!features.length) return;

        const props = features[0].properties as GeoJSONEventProperties;
        setSelectedEvent(props);
        setIsBottomSheetOpen(true);
      });

      // Click on map background (not on a marker) -- close bottom sheet
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['event-circles', 'clusters'],
        });
        if (features.length === 0) {
          setIsBottomSheetOpen(false);
        }
      });

      // Cursor changes on hover
      map.on('mouseenter', 'event-circles', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'event-circles', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = '';
      });

      // Navigation controls
      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
        }),
        'top-right'
      );
      map.addControl(new maplibregl.FullscreenControl(), 'top-right');

      // Fire initial bbox fetch after map loads
      setLoading(true);
      const abortController = new AbortController();
      triggerBboxFetch(map, abortController.signal).finally(() => setLoading(false));
    });

    return () => {
      cleanupRef.current?.();
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced moveend handler -- re-fetch bbox events when user pans/zooms
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let abortController = new AbortController();
    let timer: ReturnType<typeof setTimeout>;

    const onMoveEnd = () => {
      clearTimeout(timer);
      abortController.abort();
      abortController = new AbortController();

      timer = setTimeout(async () => {
        setLoading(true);
        await triggerBboxFetch(map, abortController.signal);
        setLoading(false);
      }, MOVEEND_DEBOUNCE_MS);
    };

    map.on('moveend', onMoveEnd);
    return () => {
      map.off('moveend', onMoveEnd);
      clearTimeout(timer);
      abortController.abort();
    };
  }, [triggerBboxFetch]);

  // Re-fetch when filters change (month or category)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const abortController = new AbortController();
    setLoading(true);
    triggerBboxFetch(map, abortController.signal).finally(() => setLoading(false));

    return () => {
      abortController.abort();
    };
  }, [selectedMonth, activeCategories, triggerBboxFetch]);

  // Update source data when allGeoJSON or filters change (client-side refinement)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !allGeoJSON) return;

    const filtered = filterGeoJSON(allGeoJSON, selectedMonth, activeCategories);

    if (!map.isStyleLoaded()) {
      map.once('load', () => {
        const source = map.getSource('events') as maplibregl.GeoJSONSource | undefined;
        if (source) {
          source.setData(filtered);
        }
      });
      return;
    }

    const source = map.getSource('events') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(filtered);
    }
  }, [allGeoJSON, selectedMonth, activeCategories]);

  return (
    <div className="relative h-screen w-full">
      {/* Map container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900/50">
          <div className="rounded-lg bg-white px-6 py-4 shadow-lg">
            <p className="text-sm text-gray-600">Loading events...</p>
          </div>
        </div>
      )}

      {/* Error overlay with retry */}
      {error && (
        <div className="absolute inset-x-0 top-4 z-10 flex justify-center">
          <div className="mx-4 rounded-lg bg-red-50 px-4 py-3 shadow-lg">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => {
                const map = mapRef.current;
                if (map) {
                  setLoading(true);
                  const ctrl = new AbortController();
                  triggerBboxFetch(map, ctrl.signal).finally(() => setLoading(false));
                }
              }}
              className="mt-2 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Category toggles - top left */}
      <div className="absolute left-3 top-3 z-10">
        <CategoryToggles
          activeCategories={activeCategories}
          onCategoryChange={setActiveCategories}
        />
      </div>

      {/* Timeline scrubber - bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/30 to-transparent pb-3 pt-6">
        <TimelineScrubber
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>

      {/* Event detail bottom sheet */}
      <BottomSheet isOpen={isBottomSheetOpen} onClose={() => setIsBottomSheetOpen(false)}>
        {selectedEvent && (
          <EventPanel event={selectedEvent} onClose={() => setIsBottomSheetOpen(false)} />
        )}
      </BottomSheet>
    </div>
  );
}
