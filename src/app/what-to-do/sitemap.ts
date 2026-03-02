import type { MetadataRoute } from 'next';
import { getAllDestinationSlugs } from '@/lib/supabase/seo-queries';

export const revalidate = 3600;

const BASE_URL = 'https://happeningnow.travel';
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export async function generateSitemaps() {
  return [{ id: 0 }];
}

export default async function sitemap({
  id: _id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const destinations = await getAllDestinationSlugs();

  const entries: MetadataRoute.Sitemap = [];

  // /what-to-do/{destination}/{month} pages
  for (const destination of destinations) {
    for (const month of MONTHS) {
      entries.push({
        url: `${BASE_URL}/what-to-do/${destination}/${month}`,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  return entries;
}
