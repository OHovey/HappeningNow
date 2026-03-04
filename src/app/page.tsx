import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import MapShell from '@/components/map/MapShell';

export default function Home() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton variant="map" />}>
        <MapShell />
      </Suspense>
    </ErrorBoundary>
  );
}
