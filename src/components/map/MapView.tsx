'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { MAP_DEFAULTS, OPENFREEMAP_STYLE, ALL_CATEGORIES } from '@/lib/constants';
import { createEventSource } from '@/lib/map/sources';
import {
  eventCircleLayer,
  pulseLayer,
  clusterLayer,
  clusterCountLayer,
} from '@/lib/map/layers';
import { startPulseAnimation } from '@/lib/map/animations';
import { filterGeoJSON, getCurrentMonth } from '@/lib/map/filters';
import {
  buildCrowdHeatmapSource,
  crowdHeatmapLayer,
  toggleHeatmapVisibility,
} from '@/lib/map/heatmap';
import {
  buildRouteSources,
  createRouteLayerPair,
  createDotLayer,
  createDotPulseLayer,
} from '@/lib/map/migration-layers';
import { crowdScoreToLabel } from '@/lib/crowd-colors';
import type {
  GeoJSONEventProperties,
  DestinationWithCoords,
  MigrationRouteWithGeoJSON,
} from '@/lib/supabase/types';
import { createBrowserClient } from '@/lib/supabase/client';
import { buildGetYourGuideLink, formatMonthRange } from '@/lib/affiliates';
import TimelineScrubber from '@/components/map/TimelineScrubber';
import SpeciesLegend from '@/components/map/SpeciesLegend';
import MapFilterBar from '@/components/map/MapFilterBar';
import MarkerPopup from '@/components/map/MarkerPopup';
import BottomSheet from '@/components/ui/BottomSheet';
import EventPanel from '@/components/panel/EventPanel';
import Link from 'next/link';

const EMPTY_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

/** Debounce delay for moveend events (ms) */
const MOVEEND_DEBOUNCE_MS = 350;

interface MapViewProps {
  flyToTarget?: { lat: number; lng: number; zoom: number };
}

export default function MapView({ flyToTarget }: MapViewProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const routePulseCleanupRef = useRef<(() => void) | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const destinationsRef = useRef<DestinationWithCoords[]>([]);
  const migrationRoutesRef = useRef<MigrationRouteWithGeoJSON[]>([]);

  const [selectedMonth, setSelectedMonth] = useState<number>(getCurrentMonth());
  const [activeCategories, setActiveCategories] = useState<string[]>([...ALL_CATEGORIES]);
  const [allGeoJSON, setAllGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<GeoJSONEventProperties | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<MigrationRouteWithGeoJSON | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [destinations, setDestinations] = useState<DestinationWithCoords[]>([]);
  const [migrationRoutes, setMigrationRoutes] = useState<MigrationRouteWithGeoJSON[]>([]);
  const [activeSpecies, setActiveSpecies] = useState<string[]>([]);

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

  /**
   * Fetch all destinations for the heatmap (once on mount).
   */
  const fetchDestinations = useCallback(async () => {
    try {
      const supabase = createBrowserClient();
      const { data, error: rpcError } = await supabase.rpc(
        'get_destinations_with_coords' as never,
      );
      if (rpcError) {
        console.warn(
          'Heatmap disabled: RPC error. If get_destinations_with_coords does not exist, run supabase/functions/get_destinations_with_coords.sql in Supabase SQL Editor.',
          rpcError,
        );
        return;
      }
      const dests = (data ?? []) as unknown as DestinationWithCoords[];
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[Heatmap] Loaded ${dests.length} destinations.`,
          dests.length > 0
            ? `First: ${dests[0].name}, crowd_score sample: ${dests[0].crowd_data?.['1'] ?? 'N/A'}`
            : 'No data.',
        );
      }
      setDestinations(dests);
      destinationsRef.current = dests;
    } catch (err) {
      console.error('Failed to fetch destinations:', err);
    }
  }, []);

  /**
   * Fetch all migration routes with GeoJSON for route rendering.
   */
  const fetchMigrationRoutes = useCallback(async () => {
    try {
      const supabase = createBrowserClient();
      const { data, error: rpcError } = await supabase.rpc(
        'get_all_routes_with_geojson' as never,
      );
      if (rpcError) {
        console.error('Failed to fetch migration routes:', rpcError);
        return;
      }
      const routes = (data ?? []) as unknown as MigrationRouteWithGeoJSON[];
      setMigrationRoutes(routes);
      migrationRoutesRef.current = routes;

      // Set all species as active by default
      const speciesList = [...new Set(routes.map((r) => r.species))];
      setActiveSpecies(speciesList);

      return routes;
    } catch (err) {
      console.error('Failed to fetch migration routes:', err);
      return [];
    }
  }, []);

  /**
   * Add migration route sources and layers to the map.
   */
  const addRouteLayers = useCallback(
    (map: maplibregl.Map, routes: MigrationRouteWithGeoJSON[], month: number) => {
      // Collect all dot-pulse layer IDs for animation
      const pulseLayerIds: string[] = [];

      for (const route of routes) {
        if (!route.route_geojson?.coordinates?.length) continue;

        const { completedSource, upcomingSource, dotSource } = buildRouteSources(route, month);

        // Add sources
        map.addSource(`route-${route.id}-completed`, {
          type: 'geojson',
          data: completedSource,
        });
        map.addSource(`route-${route.id}-upcoming`, {
          type: 'geojson',
          data: upcomingSource,
        });
        map.addSource(`route-${route.id}-dot`, {
          type: 'geojson',
          data: dotSource,
        });

        // Add layers (insert below 'clusters' to maintain z-order: heatmap -> routes -> dots -> events)
        const { completedLayer, upcomingLayer } = createRouteLayerPair(route.id, route.species);
        map.addLayer(completedLayer, 'clusters');
        map.addLayer(upcomingLayer, 'clusters');

        const dotLayer = createDotLayer(route.id, route.species);
        map.addLayer(dotLayer, 'clusters');

        const dotPulse = createDotPulseLayer(route.id, route.species);
        map.addLayer(dotPulse, 'clusters');
        pulseLayerIds.push(dotPulse.id);
      }

      // Start pulse animation for all route dots
      if (pulseLayerIds.length > 0) {
        let animationId: number;

        function animate(timestamp: number) {
          const sinVal = Math.sin(timestamp / 750);
          const opacity = 0.2 + 0.15 * sinVal;
          const radius = 10 + 4 * sinVal;

          for (const layerId of pulseLayerIds) {
            if (map.getLayer(layerId)) {
              map.setPaintProperty(layerId, 'circle-opacity', opacity);
              map.setPaintProperty(layerId, 'circle-radius', radius);
            }
          }

          animationId = requestAnimationFrame(animate);
        }

        animationId = requestAnimationFrame(animate);
        routePulseCleanupRef.current = () => cancelAnimationFrame(animationId);
      }
    },
    [],
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

    // Ensure canvas picks up container dimensions after dynamic import
    map.once('style.load', () => map.resize());

    map.on('load', () => {
      // Add empty source initially; data will be set when bbox fetch completes
      map.addSource('events', createEventSource(EMPTY_GEOJSON));

      // Add crowd heatmap source and layer BEFORE event layers (z-order: heatmap below events)
      map.addSource('crowd-heatmap', {
        type: 'geojson',
        data: EMPTY_GEOJSON,
      });
      map.addLayer(crowdHeatmapLayer);
      // Set initial visibility to none (heatmap off by default)
      map.setLayoutProperty('crowd-heatmap', 'visibility', 'none');

      // Add event layers on top of heatmap
      map.addLayer(clusterLayer);
      map.addLayer(clusterCountLayer);
      map.addLayer(eventCircleLayer);
      map.addLayer(pulseLayer);

      // Start pulse animation
      cleanupRef.current = startPulseAnimation(map);

      // Fetch destinations for heatmap
      fetchDestinations();

      // Migration routes disabled — raw GPS tracks create visual clutter.
      // TODO: Re-enable after aggregating tracks into clean corridors.
      // See .planning/todos/pending/2026-03-07-make-migration-route-data-useful-with-aggregated-corridors.md

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

      // Event marker click handler -- show preview popup
      map.on('click', 'event-circles', (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ['event-circles'],
        });
        if (!features.length) return;

        const props = features[0].properties as GeoJSONEventProperties;
        const geometry = features[0].geometry;
        if (geometry.type !== 'Point') return;

        // Close any existing popup
        popupRef.current?.remove();

        // Create DOM container for React
        const container = document.createElement('div');

        const popup = new maplibregl.Popup({
          closeButton: true,
          maxWidth: '280px',
          className: 'marker-preview-popup',
          offset: 12,
        })
          .setLngLat(geometry.coordinates as [number, number])
          .setDOMContent(container)
          .addTo(map);

        popupRef.current = popup;

        // Render React component into popup
        const root = createRoot(container);
        root.render(
          <MarkerPopup
            event={props}
            onViewDetails={() => {
              popup.remove();
              setSelectedEvent(props);
              setSelectedRoute(null);
              setIsBottomSheetOpen(true);
            }}
          />
        );

        // Cleanup React root when popup closes
        popup.on('close', () => {
          root.unmount();
        });
      });

      // Heatmap click handler -- show crowd popup
      map.on('click', 'crowd-heatmap', (e) => {
        // Don't show popup if event markers were also clicked
        const eventFeatures = map.queryRenderedFeatures(e.point, {
          layers: ['event-circles', 'clusters'],
        });
        if (eventFeatures.length > 0) return;

        // Find the nearest destination to click point
        const dests = destinationsRef.current;
        if (dests.length === 0) return;

        let nearest: DestinationWithCoords | null = null;
        let minDist = Infinity;

        for (const d of dests) {
          const dx = d.lng - e.lngLat.lng;
          const dy = d.lat - e.lngLat.lat;
          const dist = dx * dx + dy * dy;
          if (dist < minDist) {
            minDist = dist;
            nearest = d;
          }
        }

        if (!nearest) return;

        const score = nearest.crowd_data?.[String(selectedMonth)] ?? 5;
        const label = crowdScoreToLabel(score);

        // Remove existing popup
        popupRef.current?.remove();

        const popup = new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: system-ui, sans-serif; padding: 4px 0;">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px;">${nearest.name}</div>
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="font-size: 13px; color: #6b7280;">Crowd level:</span>
                <span style="font-weight: 600; font-size: 13px;">${score}/10</span>
                <span style="font-size: 12px; color: #9ca3af;">${label}</span>
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                ${getVolumeDescription(score)}
              </div>
              <button
                onclick="window.__findQuieterAlternative && window.__findQuieterAlternative('${nearest.slug}')"
                style="
                  background: #3b82f6; color: white; border: none; border-radius: 6px;
                  padding: 6px 12px; font-size: 12px; font-weight: 500; cursor: pointer;
                  width: 100%;
                "
              >
                Find quieter alternatives
              </button>
              <a href="/destination/${nearest.slug}" style="display:block; text-align:center; margin-top:6px; font-size:12px; color:#3b82f6; text-decoration:underline;">
                View ${nearest.name} details
              </a>
            </div>
          `)
          .addTo(map);

        popupRef.current = popup;
      });

      // Wire up the "find quieter" global handler
      (window as unknown as Record<string, unknown>).__findQuieterAlternative = (currentSlug: string) => {
        const dests = destinationsRef.current;
        const current = dests.find((d) => d.slug === currentSlug);
        if (!current) return;

        const currentScore = current.crowd_data?.[String(selectedMonth)] ?? 5;

        // Find destinations with lower crowd scores
        const quieter = dests
          .filter((d) => d.slug !== currentSlug)
          .map((d) => ({
            ...d,
            score: d.crowd_data?.[String(selectedMonth)] ?? 5,
          }))
          .filter((d) => d.score < currentScore)
          .sort((a, b) => a.score - b.score);

        if (quieter.length === 0) {
          popupRef.current?.remove();
          return;
        }

        // Pan to the quietest destination
        const target = quieter[0];
        popupRef.current?.remove();
        map.flyTo({
          center: [target.lng, target.lat],
          zoom: Math.max(map.getZoom(), 4),
          duration: 1500,
        });
      };

      // Cursor changes on hover for heatmap
      map.on('mouseenter', 'crowd-heatmap', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'crowd-heatmap', () => {
        map.getCanvas().style.cursor = '';
      });

      // Click on map background (not on a marker or route) -- close bottom sheet
      map.on('click', (e) => {
        // Build dynamic list of all interactive layers
        const interactiveLayers = ['event-circles', 'clusters'];
        const routes = migrationRoutesRef.current;
        for (const r of routes) {
          interactiveLayers.push(
            `route-${r.id}-completed`,
            `route-${r.id}-upcoming`,
            `route-${r.id}-dot`,
            `route-${r.id}-dot-pulse`,
          );
        }
        // Filter to only layers that exist
        const existingLayers = interactiveLayers.filter((l) => map.getLayer(l));
        const features = map.queryRenderedFeatures(e.point, {
          layers: existingLayers,
        });
        if (features.length === 0) {
          popupRef.current?.remove();
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

      // Fly to target coordinates if provided via URL search params
      if (flyToTarget) {
        map.flyTo({
          center: [flyToTarget.lng, flyToTarget.lat],
          zoom: flyToTarget.zoom,
          duration: 2000,
        });
      }
    });

    return () => {
      popupRef.current?.remove();
      cleanupRef.current?.();
      routePulseCleanupRef.current?.();
      delete (window as unknown as Record<string, unknown>).__findQuieterAlternative;
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

  // Show loading spinner only after 3s delay
  useEffect(() => {
    if (!loading) {
      setShowLoadingSpinner(false);
      return;
    }
    const timer = setTimeout(() => setShowLoadingSpinner(true), 3000);
    return () => clearTimeout(timer);
  }, [loading]);

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

  // Update heatmap source data when month changes or destinations are loaded
  useEffect(() => {
    const map = mapRef.current;
    if (!map || destinations.length === 0) return;

    if (!map.isStyleLoaded()) return;

    const source = map.getSource('crowd-heatmap') as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(buildCrowdHeatmapSource(destinations, selectedMonth));
    }
  }, [destinations, selectedMonth]);

  // Toggle heatmap visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Check if layer exists before toggling
    if (map.getLayer('crowd-heatmap')) {
      toggleHeatmapVisibility(map, heatmapEnabled);
    }
  }, [heatmapEnabled]);

  // Update migration route sources when selectedMonth changes (dot position + trail split)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || migrationRoutes.length === 0) return;

    for (const route of migrationRoutes) {
      if (!route.route_geojson?.coordinates?.length) continue;

      const { completedSource, upcomingSource, dotSource } = buildRouteSources(route, selectedMonth);

      const completedSrc = map.getSource(`route-${route.id}-completed`) as maplibregl.GeoJSONSource | undefined;
      const upcomingSrc = map.getSource(`route-${route.id}-upcoming`) as maplibregl.GeoJSONSource | undefined;
      const dotSrc = map.getSource(`route-${route.id}-dot`) as maplibregl.GeoJSONSource | undefined;

      if (completedSrc) completedSrc.setData(completedSource);
      if (upcomingSrc) upcomingSrc.setData(upcomingSource);
      if (dotSrc) dotSrc.setData(dotSource);
    }
  }, [selectedMonth, migrationRoutes]);

  // Toggle species visibility when activeSpecies changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || migrationRoutes.length === 0) return;

    for (const route of migrationRoutes) {
      const visibility = activeSpecies.includes(route.species) ? 'visible' : 'none';
      const layerIds = [
        `route-${route.id}-completed`,
        `route-${route.id}-upcoming`,
        `route-${route.id}-dot`,
        `route-${route.id}-dot-pulse`,
      ];
      for (const layerId of layerIds) {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visibility);
        }
      }
    }
  }, [activeSpecies, migrationRoutes]);

  // Add click handlers for route layers once routes are loaded
  useEffect(() => {
    const map = mapRef.current;
    if (!map || migrationRoutes.length === 0) return;

    const handlers: Array<{ layer: string; handler: (e: maplibregl.MapMouseEvent) => void }> = [];

    for (const route of migrationRoutes) {
      if (!route.route_geojson?.coordinates?.length) continue;

      const clickableLayerIds = [
        `route-${route.id}-completed`,
        `route-${route.id}-upcoming`,
        `route-${route.id}-dot`,
      ];

      for (const layerId of clickableLayerIds) {
        const handler = () => {
          setSelectedRoute(route);
          setSelectedEvent(null);
          setIsBottomSheetOpen(true);
        };

        // Only attach if layer exists
        if (map.getLayer(layerId)) {
          map.on('click', layerId, handler);
          handlers.push({ layer: layerId, handler });

          // Cursor changes
          map.on('mouseenter', layerId, () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', layerId, () => {
            map.getCanvas().style.cursor = '';
          });
        }
      }
    }

    return () => {
      for (const { layer, handler } of handlers) {
        try {
          if (map.getLayer(layer)) {
            map.off('click', layer, handler);
          }
        } catch {
          // map already removed
        }
      }
    };
  }, [migrationRoutes]);

  // Derive unique species list from migration routes
  const allSpecies = [...new Set(migrationRoutes.map((r) => r.species))];
  // Visible species for the legend
  const visibleSpecies = allSpecies.filter((s) => activeSpecies.includes(s));

  return (
    <div className="relative h-screen w-full">
      {/* Map container */}
      <div ref={containerRef} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />

      {/* Filter bar — consolidated controls */}
      <MapFilterBar
        activeCategories={activeCategories}
        onCategoryChange={setActiveCategories}
        heatmapEnabled={heatmapEnabled}
        onHeatmapToggle={setHeatmapEnabled}
        activeSpecies={activeSpecies}
        allSpecies={allSpecies}
        onSpeciesChange={setActiveSpecies}
      />

      {/* Loading spinner — only shows after 3s delay */}
      {showLoadingSpinner && (
        <div className="glass-panel absolute bottom-20 left-4 z-10 flex items-center gap-2 px-3.5 py-2.5" style={{ borderRadius: 'var(--radius-full)' }}>
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-text-tertiary/30 border-t-text-secondary" />
          <span className="text-xs font-medium text-text-secondary">Loading</span>
        </div>
      )}

      {/* Error overlay with retry */}
      {error && (
        <div className="absolute inset-x-0 top-16 z-10 flex justify-center">
          <div
            className="mx-4 px-4 py-3"
            style={{
              background: '#fef2f2',
              border: '1px solid #e7c8c0',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button
              onClick={() => {
                const map = mapRef.current;
                if (map) {
                  setLoading(true);
                  const ctrl = new AbortController();
                  triggerBboxFetch(map, ctrl.signal).finally(() => setLoading(false));
                }
              }}
              className="mt-2 rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-colors"
              style={{ background: 'var(--festival)' }}
            >
              Retry
            </button>
          </div>
        </div>
      )}


      {/* Species legend - bottom right, hidden on mobile */}
      {visibleSpecies.length > 0 && (
        <div className="absolute bottom-24 right-3 z-10 hidden sm:block">
          <SpeciesLegend species={visibleSpecies} />
        </div>
      )}


      {/* Timeline scrubber - bottom, raised above attribution */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pb-7 pt-10 sm:pb-4"
        style={{ background: 'linear-gradient(to top, rgba(28,25,23,0.5) 0%, rgba(28,25,23,0.25) 50%, transparent 100%)' }}
      >
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
        {selectedRoute && (
          <MigrationRoutePanel route={selectedRoute} onClose={() => setIsBottomSheetOpen(false)} />
        )}
      </BottomSheet>
    </div>
  );
}

/** Helper for popup volume description */
function getVolumeDescription(score: number): string {
  if (score <= 2) return 'Very few tourists expected';
  if (score <= 4) return 'Light tourist flow';
  if (score <= 6) return 'Moderate tourist activity';
  if (score <= 8) return 'Heavy tourist crowds';
  return 'Extremely busy period';
}

// ---------------------------------------------------------------------------
// Migration Route detail panel for bottom sheet
// ---------------------------------------------------------------------------

interface MigrationRoutePanelProps {
  route: MigrationRouteWithGeoJSON;
  onClose: () => void;
}

function MigrationRoutePanel({ route, onClose }: MigrationRoutePanelProps) {
  const peakText =
    route.peak_months?.length === 1
      ? formatMonthRange(route.peak_months[0], route.peak_months[0])
      : route.peak_months?.length
        ? formatMonthRange(route.peak_months[0], route.peak_months[route.peak_months.length - 1])
        : '';

  const speciesLabel = route.species.charAt(0).toUpperCase() + route.species.slice(1);

  const gygUrl = buildGetYourGuideLink({
    query: `${route.name} wildlife tour`,
  });

  return (
    <div className="pb-6">
      {/* Hero image / placeholder */}
      <div className="grain-overlay relative h-48 w-full overflow-hidden">
        {route.image_url ? (
          <img
            src={route.image_url}
            alt={route.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--wildlife) 0%, #065f46 100%)' }}
          >
            <svg className="h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="space-y-4 px-5 pt-5">
        {/* Route name */}
        <h2 className="text-xl text-text-primary" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>{route.name}</h2>

        {/* Species and peak dates */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: 'var(--wildlife)' }} />
            {speciesLabel}
          </span>
          {peakText && (
            <span className="inline-flex items-center gap-1.5 text-text-tertiary">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Peak: {peakText}
            </span>
          )}
        </div>

        {/* Description */}
        {route.description && (
          <p className="text-sm leading-relaxed text-text-secondary">
            {route.description}
          </p>
        )}

        {/* View details button */}
        <Link
          href={`/wildlife/${route.slug}`}
          className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-text-primary transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface)',
          }}
        >
          View details
        </Link>

        {/* GYG affiliate CTA */}
        <div className="space-y-2">
          <a
            href={gygUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'var(--cta-tours)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Find wildlife tours
          </a>
          <p className="text-center text-[11px] text-text-tertiary">
            We may earn a commission from these links
          </p>
        </div>
      </div>
    </div>
  );
}
