import type { MetadataRoute } from 'next';
import {
  getDistinctCountries,
  getDistinctRegions,
  slugify,
} from '@/lib/supabase/seo-queries';

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
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  const [countries, regions] = await Promise.all([
    getDistinctCountries(),
    getDistinctRegions(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  // /festivals/{country} pages
  for (const country of countries) {
    entries.push({
      url: `${BASE_URL}/festivals/${slugify(country)}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  // /festivals/{country}/{month} pages
  for (const country of countries) {
    for (const month of MONTHS) {
      entries.push({
        url: `${BASE_URL}/festivals/${slugify(country)}/${month}`,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  // /festivals/{region}/{month} pages
  for (const region of regions) {
    for (const month of MONTHS) {
      entries.push({
        url: `${BASE_URL}/festivals/${slugify(region)}/${month}`,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  }

  return entries;
}
