'use client';

import { useRef, useEffect } from 'react';
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
import { SAMPLE_EVENTS } from '@/lib/map/sample-data';

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

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
      // Add GeoJSON source with clustering
      map.addSource('events', createEventSource(SAMPLE_EVENTS));

      // Add layers in order: clusters first, then individual markers
      map.addLayer(clusterLayer);
      map.addLayer(clusterCountLayer);
      map.addLayer(eventCircleLayer);
      map.addLayer(pulseLayer);

      // Start pulse animation
      cleanupRef.current = startPulseAnimation(map);

      // Cluster click handler: zoom into cluster
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

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}
