import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import MapShell from '@/components/map/MapShell';

export default function Home() {
  return (
    <ErrorBoundary>
      <MapShell />
    </ErrorBoundary>
  );
}
