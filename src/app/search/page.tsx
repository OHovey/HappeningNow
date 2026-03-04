import { Suspense } from 'react';
import type { Metadata } from 'next';
import SearchPage from '@/components/search/SearchPage';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export const metadata: Metadata = {
  title: 'Search Events Near You | HappeningNow.travel',
  description:
    'Find festivals, wildlife spectacles, and events by location and dates. Discover what is worth the trip with ranked results and travel time estimates.',
};

export default function SearchRoute() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="card" />}>
      <SearchPage />
    </Suspense>
  );
}
