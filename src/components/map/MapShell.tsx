'use client';

import dynamic from 'next/dynamic';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <LoadingSkeleton variant="map" />,
});

export default function MapShell() {
  return <MapView />;
}
