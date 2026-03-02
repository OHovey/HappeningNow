import type { MetadataRoute } from 'next';
import {
  getDistinctRegions,
  getDistinctSpecies,
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
  const [regions, species] = await Promise.all([
    getDistinctRegions(),
    getDistinctSpecies(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  // /wildlife/region/{region} pages
  for (const region of regions) {
    entries.push({
      url: `${BASE_URL}/wildlife/region/${slugify(region)}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  // /wildlife/region/{region}/{month} pages
  for (const region of regions) {
    for (const month of MONTHS) {
      entries.push({
        url: `${BASE_URL}/wildlife/region/${slugify(region)}/${month}`,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  // /wildlife/species/{species} pages
  for (const species_name of species) {
    entries.push({
      url: `${BASE_URL}/wildlife/species/${slugify(species_name)}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  return entries;
}
