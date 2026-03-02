# Phase 4: Programmatic SEO - Research

**Researched:** 2026-03-02
**Domain:** Programmatic SEO with Next.js App Router (ISR, sitemaps, structured data, AI discoverability)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- What-to-do destination/month pages show events + weather data + crowd levels (practical travel planning focus)
- Distinct templates per page type: festival pages emphasize calendar/dates/tickets, wildlife pages emphasize seasons/locations/tour operators, what-to-do pages emphasize combined planning data
- 20+ template variations for intro text to avoid repetitive patterns that Google could flag as thin/duplicate content
- Template intros are data-driven and clean — factual, no forced personality (e.g., "12 festivals happening in Thailand this March, from water festivals to temple celebrations")
- Match existing HappeningNow site style — same card components, map style, visual language. Consistent brand experience
- Email capture form placed inline after the intro text, before main content (early visibility)
- Affiliate links are prominent with pricing displayed — bold CTA buttons on event cards, show price range
- Interactive embedded Mapbox map on each page with markers for that page's events (full pan/zoom/click)
- AI intros SKIPPED — No AI-generated intros for launch. Use well-crafted template sentences with dynamic data slots instead
- llms.txt: detailed data catalog — list regions, countries, species covered with URL structures so AI assistants can make specific page recommendations
- llms-full.txt: full event data including event names, dates, locations, descriptions — enough for AI assistants to answer specific travel questions directly
- Include affiliate/booking links in llms-full.txt so AI assistants can pass them through when recommending events
- Static files regenerated on a schedule (daily or on deploy), not dynamic. Zero runtime cost

### Claude's Discretion
- Thin page handling strategy (noindex thresholds, enrichment with related content, or both)
- Internal linking strategy across programmatic pages
- Template intro specificity level (how much local detail to include)
- Exact template sentence structures and variation patterns
- Map loading/performance optimization approach

### Deferred Ideas (OUT OF SCOPE)
- AI-generated intros — revisit after launch if SEO performance data suggests differentiation is needed
- Research into AI content detection avoidance for search engines — relevant if AI intros are added later
</user_constraints>

## Summary

Phase 4 generates 3,500+ search-indexable pages across four route families (festival SEO pages, wildlife SEO pages, what-to-do destination/month pages, and event/wildlife detail pages) using Next.js App Router with ISR. The project already has the data model (Supabase PostGIS), existing components (event cards, maps, affiliate links, email capture, breadcrumbs), and structured data patterns (JSON-LD Event, BreadcrumbList) from Phases 1-3. The primary technical challenge is scaling from ~650 detail pages to 3,500+ programmatic pages without hitting Vercel build timeouts, avoiding thin/duplicate content penalties, and generating correct sitemaps.

**Critical finding:** The current seed data supports only ~2,624 total pages (1,541 festival + 90 wildlife + 372 what-to-do + 621 detail). The 3,500+ target requires either more destination data (~167 destinations vs current 31) or accepting a lower initial page count with ISR generating new pages as data grows. The requirement says "3,500+ pages indexed within 30 days of launch" which may need a data expansion step or adjusted expectations.

**Primary recommendation:** Use Next.js built-in `sitemap.ts` with `generateSitemaps()` (no external sitemap package needed), ISR with `revalidate = 86400` and `dynamicParams = true`, return an empty array from `generateStaticParams()` to skip build-time generation entirely, and lean on template-based content differentiation with 20+ intro variations per page type.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEO-01 | `/festivals/[region]/[month]` pages (~120 pages but data yields ~72) | ISR + generateStaticParams pattern, festival template with region/month filtering |
| SEO-02 | `/festivals/[country]` pages (~80 pages but data yields ~113) | Same pattern, country-level aggregation query |
| SEO-03 | `/festivals/[country]/[month]` pages (~960 pages but data yields ~1356) | Same pattern, country+month filtering |
| SEO-04 | `/wildlife/[region]` pages (~15 pages but data yields ~6) | Wildlife template, region filtering |
| SEO-05 | `/wildlife/[species]` pages (~50 pages but data yields ~12) | Species-level aggregation query |
| SEO-06 | `/wildlife/[region]/[month]` pages (~180 pages but data yields ~72) | Region+month filtering |
| SEO-07 | `/what-to-do/[destination]/[month]` pages (~2000+ but data yields ~372) | Destination template with crowd+weather+events; needs data expansion |
| SEO-08 | Unique intro text per page (2-3 sentences) | Template variation system with 20+ patterns per page type |
| SEO-09 | Pre-filtered embedded map, event cards, affiliate links, internal links, email capture | Reuse existing MiniMap, event card, AffiliateLinks, EmailCapture components |
| SEO-10 | XML sitemap from seo_pages table | Built-in Next.js sitemap.ts with generateSitemaps() and Supabase queries |
| SEO-11 | robots.txt and sitemap submission config | Built-in Next.js robots.ts file convention |
| SEO-12 | ISR (revalidate = 86400) for programmatic pages | App Router ISR with revalidate export, dynamicParams = true |
| PAGE-01 | `/event/[slug]` SSG detail pages | Already exists from Phase 2; may need canonical URL and SEO enhancements |
| PAGE-02 | `/wildlife/[slug]` SSG detail pages | Already exists from Phase 2; may need canonical URL and SEO enhancements |
| AIDX-01 | llms.txt at site root | Static markdown file served from public/ or app route, regenerated on deploy |
| AIDX-02 | llms-full.txt with comprehensive event data | Script-generated static file with all events, destinations, routes, and affiliate links |
| AIDX-03 | Semantic HTML optimised for AI extraction | Clear heading hierarchy, data attributes, structured tables on programmatic pages |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router, ISR, generateStaticParams, sitemap.ts, robots.ts | Already installed; built-in sitemap/robots support eliminates need for next-sitemap |
| @supabase/supabase-js | ^2.98.0 | Database queries for page data | Already installed; server client pattern established |
| schema-dts | ^1.1.5 | TypeScript types for JSON-LD structured data | Already installed; used in existing buildEventJsonLd |
| MapLibre GL JS | ^5.19.0 | Embedded maps on programmatic pages | Already installed; MiniMap component exists |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | ^4.3.6 | Route parameter validation | Already installed; use for slug/month validation in page params |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Built-in sitemap.ts | next-sitemap npm package | next-sitemap adds build-step complexity and another dependency; Next.js 16 built-in sitemap.ts with generateSitemaps() handles sitemap indexes natively |
| Template intros | AI-generated intros | User explicitly deferred AI intros; templates are simpler, zero API cost, no detection risk |

**Installation:**
No new packages needed. All dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── festivals/
│   │   ├── [region]/
│   │   │   └── [month]/
│   │   │       └── page.tsx          # SEO-01
│   │   ├── [country]/
│   │   │   ├── page.tsx              # SEO-02
│   │   │   └── [month]/
│   │   │       └── page.tsx          # SEO-03
│   ├── wildlife/
│   │   ├── [region]/
│   │   │   ├── page.tsx              # SEO-04
│   │   │   └── [month]/
│   │   │       └── page.tsx          # SEO-06
│   │   ├── [species]/
│   │   │   └── page.tsx              # SEO-05
│   │   └── [slug]/
│   │       └── page.tsx              # PAGE-02 (existing)
│   ├── what-to-do/
│   │   └── [destination]/
│   │       └── [month]/
│   │           └── page.tsx          # SEO-07
│   ├── event/
│   │   └── [slug]/
│   │       └── page.tsx              # PAGE-01 (existing)
│   ├── sitemap.ts                    # Root sitemap index
│   ├── festivals/sitemap.ts          # Festival URLs sitemap
│   ├── wildlife/sitemap.ts           # Wildlife URLs sitemap
│   ├── what-to-do/sitemap.ts         # What-to-do URLs sitemap
│   ├── robots.ts                     # robots.txt
│   ├── llms.txt/
│   │   └── route.ts                  # llms.txt served as text/markdown
│   └── llms-full.txt/
│       └── route.ts                  # llms-full.txt served as text/markdown
├── lib/
│   ├── seo/
│   │   ├── intro-templates.ts        # 20+ template variations per page type
│   │   ├── thin-page-check.ts        # noindex threshold logic
│   │   └── internal-links.ts         # Cross-page internal linking helpers
│   └── supabase/
│       └── seo-queries.ts            # New queries for programmatic pages
├── components/
│   └── seo/
│       ├── SeoPageLayout.tsx          # Shared layout for all SEO pages
│       ├── EventCardGrid.tsx          # Event cards with affiliate CTAs
│       ├── FilteredMiniMap.tsx         # Interactive map filtered to page context
│       └── InternalLinks.tsx          # Related page links component
└── scripts/
    └── generate-llms-txt.ts           # Build-time script for llms.txt/llms-full.txt
```

### Pattern 1: ISR with Empty generateStaticParams
**What:** Return empty array from generateStaticParams to skip build-time generation entirely; all pages generated on-demand via ISR
**When to use:** When total page count exceeds ~500 and would cause Vercel build timeout
**Why:** With 3,500+ pages, even at 1 second per page, build-time generation would take nearly an hour. Vercel Pro has a 45-minute build timeout.
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/guides/incremental-static-regeneration
// app/festivals/[region]/[month]/page.tsx

export const revalidate = 86400; // 24 hours (per SEO-12)
export const dynamicParams = true; // generate on-demand for unknown params

export async function generateStaticParams() {
  // Return empty array — all pages generated via ISR on first request
  // This avoids Vercel build timeout with 3,500+ pages
  return [];
}

export default async function FestivalRegionMonthPage({
  params,
}: {
  params: Promise<{ region: string; month: string }>;
}) {
  const { region, month } = await params;
  // ... fetch and render
}
```

### Pattern 2: Route Disambiguation for Wildlife Routes
**What:** The `/wildlife/[slug]` route (existing detail pages) conflicts with `/wildlife/[region]` and `/wildlife/[species]` routes
**When to use:** When multiple dynamic segments share a route prefix
**How to resolve:** Use route groups or a catch-all with internal routing logic, OR use distinct path prefixes like `/wildlife/region/[region]` and `/wildlife/species/[species]`
**Recommendation:** Since `/wildlife/[slug]` already exists for migration route detail pages, the SEO pages should use sub-paths to avoid ambiguity:
```
/wildlife/region/[region]           instead of /wildlife/[region]
/wildlife/species/[species]         instead of /wildlife/[species]
/wildlife/region/[region]/[month]   instead of /wildlife/[region]/[month]
```
**Alternative:** Use a single `[...slug]` catch-all that disambiguates based on whether the slug matches a known region, species, or migration route slug. This is more fragile but matches the original URL spec.

### Pattern 3: Built-in Sitemap with generateSitemaps
**What:** Next.js App Router's `sitemap.ts` file convention with `generateSitemaps()` for multi-sitemap index
**When to use:** For sites with 1,000+ URLs that need multiple sitemaps
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps
// app/festivals/sitemap.ts

import type { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/supabase/server';

const BASE_URL = 'https://happeningnow.travel';

export async function generateSitemaps() {
  // Single sitemap is sufficient for ~1500 festival URLs
  return [{ id: 0 }];
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerClient();

  // Fetch distinct countries and regions
  const { data: events } = await supabase
    .from('events')
    .select('country, region')
    .eq('category', 'festival');

  const urls: MetadataRoute.Sitemap = [];

  // Generate URLs for all festival page combinations
  const countries = [...new Set(events?.map(e => e.country).filter(Boolean))];
  const regions = [...new Set(events?.map(e => e.region).filter(Boolean))];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  for (const country of countries) {
    const slug = slugify(country);
    urls.push({ url: `${BASE_URL}/festivals/${slug}`, changeFrequency: 'weekly', priority: 0.7 });
    for (const month of months) {
      urls.push({ url: `${BASE_URL}/festivals/${slug}/${month}`, changeFrequency: 'weekly', priority: 0.6 });
    }
  }

  for (const region of regions) {
    for (const month of months) {
      urls.push({ url: `${BASE_URL}/festivals/${slugify(region)}/${month}`, changeFrequency: 'weekly', priority: 0.7 });
    }
  }

  return urls;
}
```

### Pattern 4: Template-Based Intro Variations
**What:** Data-driven template system with 20+ sentence patterns per page type, selected deterministically (not randomly) to ensure consistent rendering across ISR revalidations
**When to use:** Every programmatic page intro
**Example:**
```typescript
// src/lib/seo/intro-templates.ts

const FESTIVAL_REGION_MONTH_TEMPLATES = [
  (count: number, region: string, month: string) =>
    `${count} festivals happening across ${region} in ${month}, from cultural celebrations to music events.`,
  (count: number, region: string, month: string) =>
    `Discover ${count} festivals in ${region} this ${month} — plan your trip around the best events.`,
  (count: number, region: string, month: string) =>
    `${region} hosts ${count} festivals during ${month}. Browse events, check crowd levels, and book tours.`,
  // ... 17+ more variations
];

export function getFestivalRegionMonthIntro(
  count: number,
  region: string,
  month: string,
): string {
  // Deterministic selection based on content hash — stable across ISR revalidations
  const hash = simpleHash(`${region}-${month}`);
  const index = hash % FESTIVAL_REGION_MONTH_TEMPLATES.length;
  return FESTIVAL_REGION_MONTH_TEMPLATES[index](count, region, month);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
```

### Pattern 5: robots.ts File Convention
**What:** Next.js built-in robots.ts for generating robots.txt
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
// app/robots.ts

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: 'https://happeningnow.travel/sitemap.xml',
  };
}
```

### Pattern 6: Thin Page Noindex Strategy
**What:** Conditionally apply `noindex` meta tag when a page has insufficient content
**When to use:** Pages with fewer than 3 events and no supplementary data
**Example:**
```typescript
// In page component's generateMetadata
export async function generateMetadata({ params }) {
  const events = await getFilteredEvents(region, month);

  if (events.length < 3) {
    return {
      title: `...`,
      robots: { index: false, follow: true }, // noindex but still follow internal links
    };
  }

  return { title: `...`, description: `...` };
}
```

### Anti-Patterns to Avoid
- **Building all 3,500+ pages at build time:** Vercel Pro has a 45-minute build timeout. Use ISR with empty generateStaticParams instead.
- **Random template selection for intros:** Random selection means ISR revalidation produces different content each time, confusing Google. Use deterministic hash-based selection.
- **Separate seo_pages database table:** The requirements mention "XML sitemap from seo_pages table" but creating a separate table duplicates data. Generate sitemap URLs directly from events, destinations, and migration_routes tables instead.
- **Using next-sitemap npm package:** Next.js 16 has built-in sitemap.ts and robots.ts file conventions. Adding next-sitemap introduces an unnecessary dependency and build-step complexity.
- **Single flat sitemap for 3,500+ URLs:** Google limits sitemaps to 50,000 URLs and 50MB. While current page count fits a single file, using per-section sitemaps (festivals, wildlife, what-to-do) improves crawl diagnostics in Google Search Console.
- **Lazy-loading the MapLibre map without a placeholder:** An empty div until MapLibre loads counts as content-less by Googlebot. Use a static image placeholder or server-rendered bounding box.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| XML sitemap generation | Custom XML builder | Next.js built-in `sitemap.ts` with `generateSitemaps()` | Handles XML formatting, sitemap index, cache headers automatically |
| robots.txt | Static file management | Next.js built-in `robots.ts` | Dynamic generation, TypeScript types, proper cache headers |
| JSON-LD structured data | Manual JSON construction | Existing `buildEventJsonLd()` + `schema-dts` types | Type safety, existing patterns from Phase 2 |
| Breadcrumb navigation | New breadcrumb component | Existing `Breadcrumbs` component with BreadcrumbList JSON-LD | Already handles structured data, styling, and linking |
| Email capture | New form component | Existing `EmailCapture` component | Already integrated with ConvertKit API |
| Affiliate link generation | New URL builders | Existing `buildBookingLink()` and `buildGetYourGuideLink()` | Already handles date computation, tracking params, fallbacks |
| Slug generation | Custom slugify | Existing `slugify()` function in event page | Already handles special characters, case normalization |

**Key insight:** Most of the component work for Phase 4 is already done in Phases 1-3. The SEO pages are primarily composition — assembling existing components (maps, event cards, affiliate CTAs, email capture, breadcrumbs) into new page templates with proper metadata and ISR configuration.

## Common Pitfalls

### Pitfall 1: Wildlife Route Conflict
**What goes wrong:** `/wildlife/[slug]` (existing migration route detail pages) conflicts with `/wildlife/[region]` and `/wildlife/[species]` (new SEO listing pages). Next.js cannot have two dynamic segments at the same level.
**Why it happens:** Next.js App Router resolves routes by file system hierarchy. Two `[param]` segments at the same level are ambiguous.
**How to avoid:** Either (a) use sub-paths like `/wildlife/region/[region]` and `/wildlife/species/[species]`, or (b) use a catch-all `[...slug]` with internal disambiguation logic, or (c) restructure existing wildlife detail pages. Option (a) is cleanest.
**Warning signs:** 404 errors on wildlife SEO pages, wrong component rendering for wildlife detail pages.

### Pitfall 2: Thin Content Penalty at Scale
**What goes wrong:** Google deindexes programmatic pages that lack unique, valuable content. A travel site creating 50,000 "hotels in [city]" pages with only city names changing was deindexed 98% within 3 months.
**Why it happens:** Many region/month combinations will have 0-2 events. A page with a template intro and 1 event card is thin content.
**How to avoid:** (1) noindex pages with fewer than 3 events, (2) enrich thin pages with nearby region events as "also nearby" content, (3) add weather data and crowd context even when event count is low, (4) minimum 20 unique template variations per page type.
**Warning signs:** Google Search Console "Discovered - not indexed" growing, mass deindexation warnings.

### Pitfall 3: ISR dynamicParams Bug in Next.js 15
**What goes wrong:** There are reported issues where `dynamicParams = true` does not generate new pages on demand in Next.js 15.x. Build-time pages work but on-demand generation fails.
**Why it happens:** Known bug reported in Next.js GitHub discussions (#81155). Affects Next.js 15.1-15.3 but may persist.
**How to avoid:** Test ISR behavior thoroughly with `next build && next start` locally before deploying. The project uses Next.js 16.1.6 which may have fixed this. If the bug persists, use a catch-all route with explicit data lookup instead.
**Warning signs:** 404 for valid URLs not in generateStaticParams, pages never caching at CDN edge.

### Pitfall 4: Map Rendering for SEO
**What goes wrong:** MapLibre GL JS requires a browser — it cannot render on the server. Googlebot renders JavaScript but may time out on heavy WebGL. An empty map container with no fallback is thin content.
**Why it happens:** MapLibre is client-only (WebGL). The project already uses `next/dynamic` with `ssr: false` for maps.
**How to avoid:** Use a static map image placeholder or descriptive text that renders server-side. The interactive map loads on top via `next/dynamic`. This ensures Googlebot sees content even if WebGL fails.
**Warning signs:** Lighthouse SEO score drops, "Content wider than screen" warnings.

### Pitfall 5: Sitemap Serving Stale Data
**What goes wrong:** sitemap.ts is cached by default in Next.js. If new events are added to the database, the sitemap may not reflect new URLs for hours.
**Why it happens:** Next.js caches Route Handlers by default unless they use dynamic APIs.
**How to avoid:** Add `export const revalidate = 3600` (1 hour) to sitemap.ts files, or use `export const dynamic = 'force-dynamic'` for always-fresh sitemaps. For a site with 3,500 relatively stable pages, hourly revalidation is sufficient.
**Warning signs:** Google Search Console shows sitemap has fewer URLs than expected.

### Pitfall 6: Page Count Gap (Current Data)
**What goes wrong:** The success criteria states "3,500+ pages indexed within 30 days of launch" but current seed data only generates ~2,624 pages.
**Why it happens:** Only 31 destinations exist (yielding 372 what-to-do pages vs the expected 2,000+). Some wildlife/festival category combinations yield fewer pages than the requirements estimate.
**How to avoid:** Either (1) add ~140 more destinations to the seed data before launch, (2) adjust the success criteria to match actual data, or (3) count the pages that are generated and accept the gap. This is a data problem, not a technical one.
**Warning signs:** Google Search Console shows fewer indexed pages than target.

## Code Examples

### Programmatic Festival Page with ISR
```typescript
// app/festivals/[country]/[month]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getFestivalCountryMonthIntro } from '@/lib/seo/intro-templates';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import EmailCapture from '@/components/panel/EmailCapture';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  return []; // All pages via ISR
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; month: string }>;
}): Promise<Metadata> {
  const { country, month } = await params;
  const monthNum = parseInt(month, 10);
  const countryName = deslugify(country);
  const monthName = MONTH_NAMES[monthNum] || '';

  const supabase = createServerClient();
  const { count } = await supabase
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('category', 'festival')
    .ilike('country', countryName)
    .lte('start_month', monthNum)
    .gte('end_month', monthNum);

  const eventCount = count ?? 0;

  if (eventCount < 3) {
    return {
      title: `Festivals in ${countryName} in ${monthName}`,
      robots: { index: false, follow: true },
    };
  }

  return {
    title: `${eventCount} Festivals in ${countryName} in ${monthName} | HappeningNow`,
    description: getFestivalCountryMonthIntro(eventCount, countryName, monthName),
    alternates: {
      canonical: `https://happeningnow.travel/festivals/${country}/${month}`,
    },
  };
}
```

### llms.txt Route Handler
```typescript
// app/llms.txt/route.ts
import { createServerClient } from '@/lib/supabase/server';

export const revalidate = 86400; // regenerate daily

export async function GET() {
  const supabase = createServerClient();

  const { data: regions } = await supabase
    .from('events')
    .select('region')
    .not('region', 'is', null);
  const uniqueRegions = [...new Set(regions?.map(r => r.region))].sort();

  const { data: countries } = await supabase
    .from('events')
    .select('country')
    .not('country', 'is', null);
  const uniqueCountries = [...new Set(countries?.map(c => c.country))].sort();

  const { data: routes } = await supabase
    .from('migration_routes')
    .select('species');
  const uniqueSpecies = [...new Set(routes?.map(r => r.species))].sort();

  const content = `# HappeningNow.travel

> A travel discovery platform showing festivals, wildlife spectacles, and crowd levels worldwide. Browse events by region, country, month, or species.

## Regions Covered
${uniqueRegions.map(r => `- [${r} Festivals](/festivals/${slugify(r)})`).join('\n')}

## Countries Covered
${uniqueCountries.map(c => `- [${c} Festivals](/festivals/${slugify(c)})`).join('\n')}

## Wildlife Species
${uniqueSpecies.map(s => `- [${s}](/wildlife/species/${slugify(s)})`).join('\n')}

## Page Types
- [Festival by Region + Month](/festivals/{region}/{month}): Browse festivals by world region and month
- [Festival by Country](/festivals/{country}): All festivals in a specific country
- [Festival by Country + Month](/festivals/{country}/{month}): Country festivals filtered by month
- [Wildlife by Region](/wildlife/region/{region}): Wildlife viewing by world region
- [Wildlife by Species](/wildlife/species/{species}): All viewing locations for a species
- [What to Do](/what-to-do/{destination}/{month}): Combined events, weather, and crowd data for a destination in a specific month
- [Event Details](/event/{slug}): Full details for individual events
- [Wildlife Details](/wildlife/{slug}): Migration route and viewing information

## Optional
- [Full Event Data](/llms-full.txt): Complete event database with dates, locations, descriptions, and booking links
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
```

### Canonical URL Pattern
```typescript
// In any programmatic page's generateMetadata
export async function generateMetadata({ params }) {
  const { country, month } = await params;
  return {
    alternates: {
      canonical: `https://happeningnow.travel/festivals/${country}/${month}`,
    },
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-sitemap npm package | Built-in sitemap.ts/robots.ts | Next.js 13.3+ (stable by 15+) | No external dependency needed; native sitemap index via generateSitemaps |
| getStaticPaths (Pages Router) | generateStaticParams (App Router) | Next.js 13.0 | Async by default, co-located with page files |
| Full SSG at build time | ISR with empty generateStaticParams | Always available but best practice refined | Avoids build timeout for large sites |
| Manual robots.txt in public/ | robots.ts file convention | Next.js 13.3+ | Dynamic generation, TypeScript types |
| sitemap.xml in public/ | Dynamic sitemap.ts with database queries | Next.js 13.3+ | Always up-to-date, no build step needed |

**Deprecated/outdated:**
- `next-sitemap` npm package: Still works but unnecessary — Next.js 16 built-in sitemap.ts handles the same use cases
- `getStaticPaths` / `getStaticProps`: Pages Router only, not relevant for App Router projects

## Open Questions

1. **Page count gap (CRITICAL)**
   - What we know: Current seed data yields ~2,624 pages, target is 3,500+
   - What's unclear: Whether user plans to add more destination data before launch
   - Recommendation: Flag during planning; either add ~140 more destinations to seed data OR adjust success criteria. The technical implementation works regardless of page count.

2. **Wildlife route URL structure**
   - What we know: `/wildlife/[slug]` exists for migration route detail pages. New SEO pages need `/wildlife/[region]` and `/wildlife/[species]` routes.
   - What's unclear: Whether user prefers clean URLs (`/wildlife/europe`) or explicit sub-paths (`/wildlife/region/europe`)
   - Recommendation: Use sub-paths (`/wildlife/region/`, `/wildlife/species/`) to avoid route conflicts. This is the safest approach and can be made cleaner with Next.js rewrites if desired later.

3. **Map component on programmatic pages**
   - What we know: User wants "Interactive embedded Mapbox map" (CONTEXT.md says Mapbox but project uses MapLibre). MiniMap exists but is non-interactive (`interactive: false`).
   - What's unclear: Whether 3,500+ pages each loading MapLibre GL JS is a performance concern, and whether Googlebot can render WebGL maps
   - Recommendation: Use a simplified interactive map (pan/zoom but no clustering) that lazy-loads via `next/dynamic`. Include a server-rendered fallback with event location text for SEO.

4. **llms-full.txt file size**
   - What we know: 608+ events with full descriptions, dates, locations, and affiliate links could produce a very large file
   - What's unclear: Whether LLM crawlers have practical size limits for ingestion
   - Recommendation: Generate the file but monitor size. The llms.txt spec recommends under 10KB for llms.txt (the summary file), but llms-full.txt is explicitly meant to be comprehensive.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 + happy-dom |
| Config file | vitest.config.mts |
| Quick run command | `npm test` |
| Full suite command | `npm test` |
| Estimated runtime | ~5 seconds |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEO-01 | Festival region/month pages render with correct data | unit | `npx vitest run tests/seo/festival-pages.test.ts -t "region month"` | No - Wave 0 gap |
| SEO-02 | Festival country pages render with correct data | unit | `npx vitest run tests/seo/festival-pages.test.ts -t "country"` | No - Wave 0 gap |
| SEO-03 | Festival country/month pages render | unit | `npx vitest run tests/seo/festival-pages.test.ts -t "country month"` | No - Wave 0 gap |
| SEO-04 | Wildlife region pages render | unit | `npx vitest run tests/seo/wildlife-pages.test.ts -t "region"` | No - Wave 0 gap |
| SEO-05 | Wildlife species pages render | unit | `npx vitest run tests/seo/wildlife-pages.test.ts -t "species"` | No - Wave 0 gap |
| SEO-06 | Wildlife region/month pages render | unit | `npx vitest run tests/seo/wildlife-pages.test.ts -t "region month"` | No - Wave 0 gap |
| SEO-07 | What-to-do pages include events + weather + crowd | unit | `npx vitest run tests/seo/whatodo-pages.test.ts` | No - Wave 0 gap |
| SEO-08 | 20+ unique intro templates per page type | unit | `npx vitest run tests/seo/intro-templates.test.ts` | No - Wave 0 gap |
| SEO-09 | Pages include map, cards, affiliate, links, email | integration | Manual verification | N/A |
| SEO-10 | Sitemap returns valid XML with correct URLs | unit | `npx vitest run tests/seo/sitemap.test.ts` | No - Wave 0 gap |
| SEO-11 | robots.txt includes sitemap URL | unit | `npx vitest run tests/seo/robots.test.ts` | No - Wave 0 gap |
| SEO-12 | Pages export revalidate = 86400 | unit | `npx vitest run tests/seo/isr-config.test.ts` | No - Wave 0 gap |
| PAGE-01 | Event detail pages have canonical URLs | unit | `npx vitest run tests/structured-data.test.ts` | Partial - exists but needs canonical test |
| PAGE-02 | Wildlife detail pages have canonical URLs | unit | `npx vitest run tests/structured-data.test.ts` | Partial - exists but needs canonical test |
| AIDX-01 | llms.txt returns valid markdown with site structure | unit | `npx vitest run tests/seo/llms-txt.test.ts` | No - Wave 0 gap |
| AIDX-02 | llms-full.txt contains event data with affiliate links | unit | `npx vitest run tests/seo/llms-txt.test.ts` | No - Wave 0 gap |
| AIDX-03 | Semantic HTML: correct heading hierarchy, data attributes | unit | `npx vitest run tests/seo/semantic-html.test.ts` | No - Wave 0 gap |

### Nyquist Sampling Rate
- **Minimum sample interval:** After every committed task -> run: `npm test`
- **Full suite trigger:** Before merging final task of any plan wave
- **Phase-complete gate:** Full suite green before `/gsd:verify-work` runs
- **Estimated feedback latency per task:** ~5 seconds

### Wave 0 Gaps (must be created before implementation)
- [ ] `tests/seo/intro-templates.test.ts` -- covers SEO-08 (template variation count, determinism, uniqueness)
- [ ] `tests/seo/sitemap.test.ts` -- covers SEO-10 (URL generation, XML validity)
- [ ] `tests/seo/robots.test.ts` -- covers SEO-11 (robots.txt content)
- [ ] `tests/seo/llms-txt.test.ts` -- covers AIDX-01, AIDX-02 (markdown structure, data completeness)
- [ ] `tests/seo/thin-page-check.test.ts` -- covers noindex threshold logic

## Sources

### Primary (HIGH confidence)
- [Next.js ISR Guide](https://nextjs.org/docs/app/guides/incremental-static-regeneration) - revalidate, dynamicParams, generateStaticParams patterns (v16.1.6 docs)
- [Next.js sitemap.xml docs](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap) - sitemap.ts file convention, generateSitemaps, MetadataRoute.Sitemap type
- [Next.js generateSitemaps docs](https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps) - multi-sitemap pattern with id-based splitting
- [Next.js robots.txt docs](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots) - robots.ts file convention
- [llmstxt.org](https://llmstxt.org/) - Official llms.txt specification
- Codebase analysis: existing event/destination/wildlife pages, components, queries, structured data patterns

### Secondary (MEDIUM confidence)
- [Vercel build timeout KB](https://vercel.com/kb/guide/troubleshooting-build-error-build-step-did-not-complete-within-45-minutes) - 45-minute build limit, ISR as mitigation
- [Programmatic SEO best practices (guptadeepak.com)](https://guptadeepak.com/the-programmatic-seo-paradox-why-your-fear-of-creating-thousands-of-pages-is-both-valid-and-obsolete/) - tiered indexing, thin content thresholds
- [Programmatic SEO duplicate content (seomatic.ai)](https://seomatic.ai/blog/programmatic-seo-duplicate-content) - canonical URLs, noindex strategy
- [Google Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event) - JSON-LD Event requirements

### Tertiary (LOW confidence)
- [llms.txt adoption status](https://www.bluehost.com/blog/what-is-llms-txt/) - 844K sites adopted but no major AI platform confirmed reading them; implement anyway as low-cost hedge
- [Next.js 15 dynamicParams bug](https://github.com/vercel/next.js/discussions/81155) - reported issues with on-demand page generation; may be fixed in v16.1.6 but needs testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed, patterns established in prior phases
- Architecture: HIGH - Next.js ISR, sitemap.ts, robots.ts are well-documented built-in features
- Pitfalls: HIGH - thin content and route conflicts are well-understood problems with clear solutions
- Page count gap: MEDIUM - data quantity is a content problem, not a technical one; needs user decision

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable domain, 30-day validity)
