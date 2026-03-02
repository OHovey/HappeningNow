import type { MetadataRoute } from 'next';
import { getAllEventSlugs, getAllWildlifeSlugs, getAllDestinationSlugs } from '@/lib/supabase/seo-queries';

export const revalidate = 3600;

const BASE_URL = 'https://happeningnow.travel';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [eventSlugs, wildlifeSlugs, destinationSlugs] = await Promise.all([
    getAllEventSlugs(),
    getAllWildlifeSlugs(),
    getAllDestinationSlugs(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  const eventPages: MetadataRoute.Sitemap = eventSlugs.map((slug) => ({
    url: `${BASE_URL}/event/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const wildlifePages: MetadataRoute.Sitemap = wildlifeSlugs.map((slug) => ({
    url: `${BASE_URL}/wildlife/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const destinationPages: MetadataRoute.Sitemap = destinationSlugs.map((slug) => ({
    url: `${BASE_URL}/destination/${slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...eventPages, ...wildlifePages, ...destinationPages];
}
