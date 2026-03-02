'use client';

import { useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <LoadingSkeleton variant="map" />,
});

export default function MapShell() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read flyTo params once and store in a ref so router.replace doesn't
  // trigger a re-render that clears the value before the map loads.
  const flyToRef = useRef<{ lat: number; lng: number; zoom: number } | undefined>(undefined);
  const paramsReadRef = useRef(false);

  if (!paramsReadRef.current) {
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const zoomStr = searchParams.get('zoom');

    if (latStr && lngStr && zoomStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const zoom = parseFloat(zoomStr);

      if (!isNaN(lat) && !isNaN(lng) && !isNaN(zoom)) {
        flyToRef.current = { lat, lng, zoom };
      }
    }
    paramsReadRef.current = true;

    // Clear URL params after a delay so the map has time to read the flyTo target
    if (flyToRef.current) {
      setTimeout(() => {
        router.replace(pathname, { scroll: false });
      }, 100);
    }
  }

  return <MapView flyToTarget={flyToRef.current} />;
}
