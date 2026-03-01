# Stack Research

**Domain:** Interactive travel events map platform with programmatic SEO and affiliate monetisation
**Researched:** 2026-03-01
**Confidence:** HIGH (core stack verified via official docs and Context7-tier sources)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 15.5 | React framework, App Router, SSG/ISR, API routes | Industry standard for SEO-heavy React apps. App Router + `generateStaticParams` is the only viable path for 3,500+ statically generated pages at zero server cost. 15.5 adds stable Turbopack builds and Node.js middleware. |
| React | 19.x | UI component model | Required by Next.js 15. Server Components reduce client JS payload — critical for map pages where MapLibre already ships ~500KB. |
| TypeScript | 5.9 | Type safety across full stack | Not optional for a project with complex spatial data types, API shapes, and affiliate link generation. Caught-at-compile bugs are cheaper than runtime bugs. |
| MapLibre GL JS | 5.x (5.19.0 latest) | WebGL map rendering | Zero cost at any scale (vs Mapbox billing after 50k loads/month). Same WebGL pipeline as Mapbox. Active release cadence — v5.10+ adds line-gradient and dasharray. Required for animated marker layers and crowd heatmap overlays. |
| Tailwind CSS | v4.x (4.x stable Jan 2025) | Utility-first CSS | 3.5x faster full rebuilds, 8x faster incremental builds vs v3. CSS-first config removes `tailwind.config.js` boilerplate. Required for rapid UI iteration across 3,500+ page variants. |
| Supabase | supabase-js 2.98.0 | PostgreSQL + PostGIS + REST API + auth | Free 500MB database with PostGIS pre-installed. Instant REST API (`/rest/v1/`) means zero custom API route boilerplate for event queries. Critical: enables `ST_DWithin`, `ST_Distance`, `<->` nearest-neighbour for location-aware queries. |

### Database & Spatial Stack

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| PostgreSQL (via Supabase) | 15.x | Primary database | PostGIS is a first-class Supabase extension. No separate spatial DB needed. |
| PostGIS | 3.x | Spatial geometry types and functions | Enables `geography(Point, 4326)` columns, GiST spatial indexes, bounding-box queries (`&&`), distance sorts (`<->`). Essential for "events near me" and map-viewport filtering. |
| @supabase/ssr | latest | Cookie-based Supabase client for Next.js App Router | Replaces deprecated `@supabase/auth-helpers`. Required for `createServerClient` in Server Components and Route Handlers. Do NOT use the old auth-helpers packages. |

### Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vercel | Pro tier (required) | Hosting, CDN, ISR, serverless functions | **CRITICAL: Hobby tier is non-commercial only.** This project earns affiliate revenue — commercial use requires Vercel Pro (~$20/month). Pro tier gives 1TB bandwidth, unlimited ISR, and removes the commercial restriction. All static pages are CDN-served; serverless functions handle dynamic API routes only. |
| OpenFreeMap | — (tile service, no version) | Map tile hosting | Completely free, no API key, no usage limits, no registration. Uses OpenStreetMap data. MapLibre attributions auto-applied. Style URL: `https://tiles.openfreemap.org/styles/liberty`. Chosen over MapTiler (paid above free tier) and Mapbox (per-load billing). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-map-gl | 8.1.0 | React wrapper for MapLibre GL JS | Use `react-map-gl/maplibre` (NOT `react-map-gl/mapbox`). Provides React-idiomatic Marker, Layer, Source, Popup components. Import with `next/dynamic` + `ssr: false` — MapLibre requires browser APIs unavailable during SSR. |
| Zod | 4.3.6 | Schema validation and TypeScript inference | Validate all Supabase query responses, API route inputs, and affiliate link generation inputs. v4 is 14x faster parsing than v3 and adds `@zod/mini` for client-side use. |
| @supabase/supabase-js | 2.98.0 | Supabase JS client | Core client for database queries. Use with `@supabase/ssr` for server-side queries in App Router. |
| next-sitemap | latest (^4.x) | Sitemap generation for programmatic SEO pages | Handles sitemap index files automatically when > 50,000 URLs. Supports dynamic routes. Configure for the 3,500+ programmatic pages at post-build step. |
| ConvertKit (Kit) API | REST API v3 | Email capture and interest-based segmentation | No SDK needed — simple `fetch` to `/v3/forms/{id}/subscribe`. Tag-based segmentation for festival vs wildlife vs destination interests. Free up to 10,000 subscribers. |
| sharp | 0.33.x | Image optimisation | Next.js 15 uses sharp automatically for `next/image` — no manual install needed in Next.js 15+. Required if self-hosting; Vercel handles it natively. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint 9 | Linting | Next.js 15 supports ESLint 9 with flat config. Use `eslint-config-next` which includes React and accessibility rules. |
| Prettier | Code formatting | Configure with `tailwindcss` plugin for class sorting. Essential with Tailwind v4 class explosion. |
| TypeScript strict mode | Type checking | Enable `"strict": true` in tsconfig. The spatial data models (GeoJSON types, coordinate arrays) will catch shape mismatches at compile time. |
| Supabase CLI | Local dev, migrations | `npx supabase db diff` for migration generation. Run local PostGIS instance via `supabase start`. Critical for testing spatial queries before deploying. |

---

## Installation

```bash
# Create Next.js 15 project with TypeScript and Tailwind
npx create-next-app@latest happeningnow --typescript --tailwind --app --turbopack

# Core map stack
npm install maplibre-gl react-map-gl

# Supabase stack
npm install @supabase/supabase-js @supabase/ssr

# Validation and forms
npm install zod

# SEO tooling
npm install next-sitemap

# Dev dependencies
npm install -D @types/node @types/react @types/react-dom eslint eslint-config-next prettier
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| MapLibre GL JS | Mapbox GL JS | If you need Mapbox-specific features (traffic layers, Isochrone API). Not here — billing above 50k loads/month is prohibitive for a free-tier project. |
| MapLibre GL JS | Leaflet.js | Only if you need IE11 support or dead-simple marker rendering. Leaflet lacks WebGL — no custom animated shaders, no smooth cluster transitions, no heatmap overlays. Do not use Leaflet for this project. |
| react-map-gl | Direct maplibre-gl DOM ref | react-map-gl provides React lifecycle management (cleanup on unmount, ref forwarding). Direct DOM refs in React lead to memory leaks when navigating between SSG pages. |
| OpenFreeMap tiles | MapTiler | Use MapTiler if you need custom cartography or satellite imagery. Free tier is 100k tiles/month — likely to hit limits with an animated scrubber that re-requests tiles on each month change. |
| Supabase | PlanetScale / Neon | Use Neon if you need serverless-native branching. Supabase wins here because PostGIS is pre-enabled, REST API is instant, and the ecosystem has excellent Next.js documentation. |
| Vercel (Pro) | Netlify / Cloudflare Pages | Use Cloudflare Pages if you want cheaper edge workers. Vercel is recommended because ISR is native, Next.js is developed by Vercel, and the deployment DX is industry-leading. Accept the $20/month cost. |
| @supabase/ssr | @supabase/auth-helpers-nextjs | auth-helpers is DEPRECATED. Do not use it in new projects. All bug fixes are in @supabase/ssr only. |
| Tailwind CSS v4 | Tailwind CSS v3 | Use v3 only if you need a UI library (Shadcn, DaisyUI) that hasn't upgraded to v4 yet. Check compatibility before starting. Many component libraries were mid-migration as of early 2026. |
| next-sitemap | Native `sitemap.ts` convention | Use native `sitemap.ts` for < 500 URLs. For 3,500+ pages across multiple route types, next-sitemap's automatic sitemap index splitting is simpler to maintain. |
| Zod v4 | Zod v3 | Use Zod v3 only if an existing library peer-depends on it. For new code, v4 has no reason to avoid. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Mapbox GL JS | Usage-based billing. Free tier is 50,000 map loads/month. A viral programmatic SEO page with 10k visitors easily exceeds this. Risk of unexpected bills at scale. | MapLibre GL JS |
| Google Maps JavaScript API | Per-load billing ($7 per 1,000 loads beyond $200 credit). Incompatible with zero-cost-at-launch constraint. | MapLibre GL JS + OpenFreeMap |
| Vercel Hobby tier for this project | Explicitly non-commercial. This project earns affiliate revenue. Using Hobby tier for a monetised product violates Vercel's ToS. | Vercel Pro ($20/month) |
| @supabase/auth-helpers-nextjs | Deprecated. Bug fixes and new features will NOT be backported. Installs conflicting React Context patterns with App Router. | @supabase/ssr |
| react-leaflet | No WebGL. Cannot render animated pulsing dots, heatmap overlays, or smooth cluster explosions that are core to the Timeline Map "wow" experience. | react-map-gl + MapLibre GL JS |
| Prisma ORM | Prisma doesn't understand PostGIS geometry columns — it'll treat them as `Unsupported`. You'd need raw queries for all spatial operations, which defeats the purpose. | Supabase JS client with typed RPC for spatial queries |
| SWR / React Query for map data | Map data should be fetched server-side in Server Components or loaded as static JSON at build time. Client-side data fetching for event pins adds waterfall loading and increases time-to-interactive. | Server Components + `generateStaticParams` + ISR |
| Next.js Pages Router | Pages Router cannot use Server Components. You'd lose zero-JS server-side rendering for SEO pages, increasing client bundle size on every programmatic page. | Next.js App Router exclusively |

---

## Stack Patterns by Variant

**For the Interactive Timeline Map (client component):**
- Load as `next/dynamic` with `ssr: false` — MapLibre requires `window`
- Fetch initial pin data from Supabase at the Server Component level, pass as props
- Client component updates visible pins based on month scrubber state (no refetch)
- Use GeoJSON `FeatureCollection` format for MapLibre `Source` data

**For Programmatic SEO pages (3,500+ pages):**
- Use `generateStaticParams` to enumerate all `[festival-slug]`, `[region]`, `[month]` combinations at build time
- Set `export const revalidate = 86400` (24 hours ISR) so new events appear without full rebuild
- Include `generateMetadata` on every page — title, description, OG image, canonical URL
- Schema.org `Event` structured data as JSON-LD in `<script type="application/ld+json">`

**For PostGIS spatial queries (events near map viewport):**
- Use bounding-box filter first: `&& ST_MakeBox2D(...)` — uses spatial index
- Then distance sort: `ORDER BY location <-> ST_Point(lng, lat)` — uses spatial index
- NEVER use `ST_Distance()` in WHERE clause without a bounding-box pre-filter — full table scan

**For affiliate deep links:**
- Generate at static build time where possible (destination + event combos are predictable)
- Booking.com affiliate URL format: `https://www.booking.com/searchresults.html?aid={AID}&ss={city_name}`
- GetYourGuide format: `https://www.getyourguide.com/s/?q={destination}&partner_id={ID}`
- Store affiliate templates in `lib/affiliates.ts`, not scattered in components

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| next@15.5.x | react@19.x, react-dom@19.x | React 19 required for App Router Server Components. Pages Router supports React 18 if needed for legacy component libs. |
| react-map-gl@8.1.0 | maplibre-gl@>=4.x | v8 drops support for maplibre-gl v3. Import from `react-map-gl/maplibre`, not `react-map-gl`. |
| maplibre-gl@5.x | react-map-gl@8.x | MapLibre 5.x requires react-map-gl 8.x for proper type support. |
| tailwindcss@4.x | postcss@8.x | Tailwind v4 changes config format (CSS-first, no `tailwind.config.js`). Check any UI library compatibility before adopting. |
| @supabase/ssr@latest | @supabase/supabase-js@2.x | Must install both. `@supabase/ssr` provides the cookie adapters; `@supabase/supabase-js` provides the client. |
| next-sitemap@4.x | next@15.x | Confirmed compatible. Runs as a post-build script, not a Next.js plugin. |
| zod@4.x | TypeScript@5.x | Zod v4 requires TypeScript 5.0+. Current TS 5.9 is fully compatible. |

---

## Infrastructure Costs at Launch

| Service | Free Tier | Limit / Risk |
|---------|-----------|--------------|
| OpenFreeMap | Free, unlimited | No limit. No API key. Only risk: service availability (self-host fallback possible). |
| Supabase | 500MB storage, 2 project limit | Seed data (~500 festivals, ~100 wildlife events) with full text + geometry ≈ 50-100MB. Safe on free tier. Pause-after-inactivity is NOT a risk in production (Vercel cron or external ping keeps it awake). |
| Vercel | **Pro required** ($20/month) | Non-commercial Hobby plan violates ToS for affiliate monetised sites. Budget $20/month from day one. |
| Nominatim (geocoding) | Free, rate-limited | Max 1 req/sec. Use only for data pipeline (seeding coordinates), never in user-facing hot path. Cache results in Supabase. |
| ConvertKit (Kit) | Free to 10,000 subscribers | Sufficient for launch. |

**Total at launch: ~$20/month** (Vercel Pro only). Everything else on free tiers.

---

## Sources

- [Next.js 15 official blog post](https://nextjs.org/blog/next-15) — Next.js 15 feature set verified (HIGH confidence)
- [Next.js 15.5 release notes on InfoQ](https://www.infoq.com/news/2025/09/nextjs-15-5-ships/) — 15.5 Turbopack builds beta, Node.js middleware stable (MEDIUM confidence)
- [MapLibre GL JS on npm](https://www.npmjs.com/package/maplibre-gl) — v5.19.0 current version (HIGH confidence)
- [MapLibre newsletter Nov 2025](https://maplibre.org/news/2025-12-02-maplibre-newsletter-november-2025/) — Active development cadence confirmed (HIGH confidence)
- [react-map-gl docs](https://visgl.github.io/react-map-gl/docs/whats-new) — v8.1.0 MapLibre v5 support, `react-map-gl/maplibre` import path (HIGH confidence)
- [Tailwind CSS v4 release](https://tailwindcss.com/blog/tailwindcss-v4) — Stable January 2025 (HIGH confidence)
- [Supabase PostGIS docs](https://supabase.com/docs/guides/database/extensions/postgis) — PostGIS spatial functions, GiST indexes, `<->` operator (HIGH confidence)
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) — v2.98.0 current (HIGH confidence)
- [Supabase SSR package docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — `@supabase/ssr` replaces deprecated auth-helpers (HIGH confidence)
- [Vercel pricing page](https://vercel.com/pricing) — Hobby is non-commercial only, verified (HIGH confidence)
- [Zod v4 on npm](https://www.npmjs.com/package/zod) — v4.3.6 current (HIGH confidence)
- [OpenFreeMap quick start](https://openfreemap.org/quick_start/) — Free unlimited, no API key, MapLibre auto-attribution (HIGH confidence)
- [Supabase free tier limits](https://supabase.com/pricing) — 500MB database, auto-pause after inactivity (MEDIUM confidence — specific egress numbers vary across sources)
- [TypeScript releases](https://github.com/microsoft/typescript/releases) — TypeScript 5.9 current (HIGH confidence)
- [Next.js generateStaticParams docs](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) — ISR hybrid rendering pattern for programmatic SEO (HIGH confidence)

---

*Stack research for: HappeningNow.travel — interactive travel events map platform*
*Researched: 2026-03-01*
