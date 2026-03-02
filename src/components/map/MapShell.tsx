'use client';

import { useMemo } from 'react';
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

  const flyToTarget = useMemo(() => {
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const zoomStr = searchParams.get('zoom');

    if (!latStr || !lngStr || !zoomStr) return undefined;

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const zoom = parseFloat(zoomStr);

    if (isNaN(lat) || isNaN(lng) || isNaN(zoom)) return undefined;

    // Clear URL params so flyTo only triggers once
    // Use setTimeout to avoid updating state during render
    setTimeout(() => {
      router.replace(pathname, { scroll: false });
    }, 0);

    return { lat, lng, zoom };
  }, [searchParams, router, pathname]);

  return <MapView flyToTarget={flyToTarget} />;
}
