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
import { createBrowserClient } from '@/lib/supabase/client';
import TimelineScrubber from '@/components/map/TimelineScrubber';
import CategoryToggles from '@/components/map/CategoryToggles';

const EMPTY_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

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

  // Fetch GeoJSON from Supabase
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserClient();
      const { data, error: rpcError } = await supabase.rpc('get_events_geojson');

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      const geojson = (data as GeoJSON.FeatureCollection) ?? EMPTY_GEOJSON;
      setAllGeoJSON(geojson);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load events';
      setError(message);
      console.error('Failed to fetch events GeoJSON:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      // Add empty source initially; data will be set when GeoJSON loads
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
    });

    return () => {
      cleanupRef.current?.();
      map.remove();
    };
  }, []);

  // Update source data when filters or data change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !allGeoJSON) return;

    const filtered = filterGeoJSON(allGeoJSON, selectedMonth, activeCategories);

    // Wait for map to be loaded before updating source
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
              onClick={fetchData}
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
    </div>
  );
}
