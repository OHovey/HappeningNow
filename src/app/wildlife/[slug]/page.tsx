import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import BackToMap from '@/components/ui/BackToMap';
import WildlifeHero from '@/components/detail/WildlifeHero';
import WildlifeContent from '@/components/detail/WildlifeContent';
import {
  buildWildlifeJsonLd,
  buildWildlifeMetadata,
} from '@/lib/structured-data';
import {
  getWildlifeBySlug,
  getAllWildlifeSlugs,
  getEventBySlug,
} from '@/lib/supabase/queries';

interface WildlifePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate static paths for all wildlife migration routes.
 */
export async function generateStaticParams() {
  const slugs = await getAllWildlifeSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * Generate metadata (title, description, OG tags) for each wildlife page.
 * OG image uses the wildlife photo directly per user decision.
 */
export async function generateMetadata({
  params,
}: WildlifePageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = await getWildlifeBySlug(slug);

  if (!route) {
    const event = await getEventBySlug(slug);
    if (event?.category === 'wildlife') {
      redirect(`/event/${slug}`);
    }
    return { title: 'Wildlife Not Found' };
  }

  return buildWildlifeMetadata(route);
}

/**
 * Wildlife detail page (async Server Component).
 *
 * Renders: breadcrumbs, hero image, content (description, peak months,
 * migration route map, affiliate CTAs), JSON-LD Event structured data,
 * and a floating Back to Map button.
 */
export default async function WildlifePage({ params }: WildlifePageProps) {
  const { slug } = await params;
  const route = await getWildlifeBySlug(slug);

  if (!route) {
    const event = await getEventBySlug(slug);
    if (event?.category === 'wildlife') {
      redirect(`/event/${slug}`);
    }
    notFound();
  }

  const jsonLd = buildWildlifeJsonLd(route);

  // Breadcrumbs: Home > Species > Route Name
  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: route.species },
    { name: route.name },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <WildlifeHero route={route} />
      <WildlifeContent route={route} />

      {/* JSON-LD Event structured data for wildlife spectacle */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <BackToMap />
    </>
  );
}
