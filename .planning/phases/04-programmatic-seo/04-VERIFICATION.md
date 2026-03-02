---
phase: 04-programmatic-seo
verified: 2026-03-02T04:30:00Z
status: gaps_found
score: 16/17 must-haves verified
gaps:
  - truth: "Internal links from festival pages navigate to valid numeric-month URLs"
    status: failed
    reason: "getRelatedFestivalLinks generates slugified month names (e.g. /festivals/thailand/january) but the [month] route parses with parseInt and expects numeric months (e.g. /festivals/thailand/3). All 3 lines in internal-links.ts use slugify(MONTH_NAMES[m]) instead of m."
    artifacts:
      - path: "src/lib/seo/internal-links.ts"
        issue: "Lines 60, 69, 76 use slugify(MONTH_NAMES[m]) for festival month URLs. Wildlife (line 120, 129) and what-to-do (lines 154, 172) were fixed but festival was not."
    missing:
      - "Change line 60: href: `/festivals/${slugify(currentCountry)}/${m}` (numeric month)"
      - "Change line 69: href: `/festivals/${slugify(currentRegion)}/${currentMonth}` (numeric month)"
      - "Change line 76: href: `/festivals/${slugify(currentRegion)}/${m}` (numeric month)"
human_verification:
  - test: "Visit a festival programmatic page in a browser"
    expected: "Page renders with intro text, interactive map, event cards with Booking.com and GetYourGuide CTAs, and related-page links"
    why_human: "ISR pages require real Supabase data — cannot verify rendered output programmatically"
  - test: "Visit /sitemap.xml and /festivals/sitemap.xml"
    expected: "Sitemap index loads without error; section sitemap lists festival URLs in correct /festivals/{slug}/{month} format"
    why_human: "Sitemap generation requires live Supabase data for real URL counts"
  - test: "Visit /llms.txt and /llms-full.txt"
    expected: "llms.txt returns markdown with regions/countries/species sections; llms-full.txt includes event entries with Booking.com and GetYourGuide links"
    why_human: "Route handlers require real Supabase data to populate content"
  - test: "Check robots.txt at /robots.txt"
    expected: "Contains 'Disallow: /api/' and 'Sitemap: https://happeningnow.travel/sitemap.xml'"
    why_human: "robots.ts is a pure function but served via Next.js server — confirm it renders correctly in production format"
---

# Phase 4: Programmatic SEO Verification Report

**Phase Goal:** Search engines can discover and index 3,500+ unique, content-rich pages covering festivals by region and month, wildlife by region and species, and destination month guides — all with structured data, canonical URLs, and a submitted sitemap
**Verified:** 2026-03-02T04:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                               | Status      | Evidence                                                                                     |
|----|------------------------------------------------------------------------------------|-------------|----------------------------------------------------------------------------------------------|
| 1  | Festival pages (region/month, country, country/month) exist and use ISR            | VERIFIED    | `src/app/festivals/[slug]/page.tsx` and `[slug]/[month]/page.tsx` — revalidate=86400, dynamicParams=true, generateStaticParams returns [] |
| 2  | Wildlife pages (region, region/month, species) exist under sub-paths               | VERIFIED    | `/wildlife/region/[region]/`, `/wildlife/region/[region]/[month]/`, `/wildlife/species/[species]/` — all present, ISR config confirmed |
| 3  | What-to-do pages combine events, weather, and crowd data                            | VERIFIED    | `src/app/what-to-do/[destination]/[month]/page.tsx` imports and calls `crowdScoreToColor`, `crowdScoreToLabel`, `estimateTouristVolume`, `formatWeatherSummary` — data-section="weather" section renders crowd+weather alongside events |
| 4  | Thin pages (< 3 events, no supplementary data) receive noindex                     | VERIFIED    | `shouldNoindex()` called in generateMetadata for all page families; what-to-do pages pass hasWeatherData/hasCrowdData to remain indexed |
| 5  | All programmatic pages use unique intro text (20+ template variations)             | VERIFIED    | 7 template arrays × 21 entries each = 147 templates total; deterministic hash via simpleHash(key) % length |
| 6  | All programmatic pages export canonical URLs                                        | VERIFIED    | Festival, wildlife, what-to-do pages each set `alternates.canonical`; event/[slug] and wildlife/[slug] detail pages also set canonical (PAGE-01, PAGE-02) |
| 7  | Event cards display affiliate CTAs (Booking.com + GetYourGuide)                    | VERIFIED    | `EventCardGrid.tsx` calls buildBookingLink/buildGetYourGuideLink; hides Booking.com for wildlife events; confirmed by semantic-html tests |
| 8  | Shared SeoPageLayout uses semantic HTML (main, h1, section, data-section)          | VERIFIED    | `SeoPageLayout.tsx` uses `<main>`, `<h1>`, `<section data-section="email-capture">`, `<section data-section="related">`; BreadcrumbList JSON-LD emitted via Breadcrumbs component |
| 9  | FilteredMap includes noscript/SSR fallback for Googlebot                           | VERIFIED    | `FilteredMap.tsx` lines 123-131 render `<noscript>` with event location names; next/dynamic with ssr:false |
| 10 | XML sitemaps cover all programmatic page families                                   | VERIFIED    | `festivals/sitemap.ts` generates /festivals/{country}, /festivals/{country}/{month}, /festivals/{region}/{month}; `wildlife/sitemap.ts` generates /wildlife/region/, /wildlife/species/; `what-to-do/sitemap.ts` generates /what-to-do/{destination}/{month} |
| 11 | Root sitemap covers detail pages and homepage                                       | VERIFIED    | `src/app/sitemap.ts` queries getAllEventSlugs, getAllWildlifeSlugs, getAllDestinationSlugs — generates event/wildlife/destination URLs with revalidate=3600 |
| 12 | robots.txt disallows /api/ and references sitemap                                   | VERIFIED    | `src/app/robots.ts` returns disallow:['/api/'], sitemap:'https://happeningnow.travel/sitemap.xml' |
| 13 | llms.txt serves site catalog with URL patterns                                      | VERIFIED    | `src/app/llms.txt/route.ts` queries getDistinctRegions/Countries/Species; outputs sections per llmstxt.org spec; Content-Type: text/markdown; revalidate=86400 |
| 14 | llms-full.txt serves complete event database with affiliate links                   | VERIFIED    | `src/app/llms-full.txt/route.ts` queries all events/routes/destinations; calls buildBookingLink + buildGetYourGuideLink; revalidate=86400 |
| 15 | Internal links for wildlife and what-to-do use numeric month URL format            | VERIFIED    | `getRelatedWildlifeLinks` uses numeric months (line 120: `/${m}`); `getRelatedWhatToDoLinks` uses numeric months (line 154: `/${m}`) |
| 16 | Internal links for festival pages use correct URL format                           | FAILED      | `getRelatedFestivalLinks` still uses `slugify(MONTH_NAMES[m])` — generates `/festivals/thailand/january` not `/festivals/thailand/1`; route expects parseInt and will call notFound() |
| 17 | All 184 SEO tests pass                                                              | VERIFIED    | `npx vitest run tests/seo/` — 9 test files, 184 tests, all passed in 1.12s |

**Score:** 16/17 truths verified

---

### Required Artifacts

| Artifact                                                      | Expected                                         | Status      | Details                                                                                   |
|---------------------------------------------------------------|--------------------------------------------------|-------------|-------------------------------------------------------------------------------------------|
| `src/lib/seo/intro-templates.ts`                             | 20+ templates per page type, deterministic hash  | VERIFIED    | 7 arrays × 21+ entries; simpleHash() + pick() for determinism                            |
| `src/lib/seo/thin-page-check.ts`                             | shouldNoindex() with THIN_PAGE_THRESHOLD=3       | VERIFIED    | Exports shouldNoindex(eventCount, hasWeatherData, hasCrowdData) and THIN_PAGE_THRESHOLD=3 |
| `src/lib/seo/internal-links.ts`                              | Cross-page linking helpers (3 functions)         | PARTIAL     | All 3 functions exist; wildlife/what-to-do use correct numeric months; festival uses slugified month names (bug) |
| `src/lib/supabase/seo-queries.ts`                            | Full SEO query layer + slugify/deslugify         | VERIFIED    | All required exports present: getFestivalsByRegionMonth, getFestivalsByCountry, getFestivalsByCountryMonth, getWildlifeByRegion, getWildlifeBySpecies, getWildlifeByRegionMonth, getWhatToDoData, getDistinct*, slugify, deslugify |
| `src/components/seo/SeoPageLayout.tsx`                       | Semantic layout with email capture               | VERIFIED    | main/h1/section structure; EmailCapture after intro; breadcrumbs; relatedLinks; BackToMap |
| `src/components/seo/EventCardGrid.tsx`                       | Event cards with affiliate CTAs                  | VERIFIED    | article elements; Booking.com + GetYourGuide CTAs; hides Booking.com for wildlife        |
| `src/components/seo/FilteredMap.tsx`                         | Interactive map with SSR fallback                | VERIFIED    | MapLibre markers; next/dynamic ssr:false; noscript fallback with location names           |
| `src/components/seo/InternalLinks.tsx`                       | Related pages nav (max 8 links)                  | VERIFIED    | nav/ul/li structure; MAX_DISPLAYED_LINKS=8; Next.js Link                                 |
| `src/app/festivals/[slug]/page.tsx`                          | Festival country pages (SEO-02)                  | VERIFIED    | ISR config; month grouping; getFestivalsByCountry; getFestivalCountryIntro; SeoPageLayout |
| `src/app/festivals/[slug]/[month]/page.tsx`                  | Festival region+month and country+month (SEO-01/03) | VERIFIED | KNOWN_REGIONS disambiguation; ISR; shouldNoindex; getFestivalsByRegionMonth/CountryMonth  |
| `src/app/wildlife/region/[region]/page.tsx`                  | Wildlife region pages (SEO-04)                   | VERIFIED    | ISR config; getWildlifeByRegion; getWildlifeRegionIntro; SeoPageLayout; canonical         |
| `src/app/wildlife/region/[region]/[month]/page.tsx`          | Wildlife region+month pages (SEO-06)             | VERIFIED    | ISR config; getWildlifeByRegionMonth; month 1-12 validation                               |
| `src/app/wildlife/species/[species]/page.tsx`                | Wildlife species pages (SEO-05)                  | VERIFIED    | ISR config; getWildlifeBySpecies; getWildlifeSpeciesIntro; geographic grouping by region  |
| `src/app/what-to-do/[destination]/[month]/page.tsx`          | What-to-do pages (SEO-07)                        | VERIFIED    | ISR config; weather+crowd+events; buildBookingLink pre-filled; data-section attributes    |
| `src/app/event/[slug]/page.tsx`                              | Canonical URL added (PAGE-01)                    | VERIFIED    | alternates.canonical set to https://happeningnow.travel/event/${slug}                    |
| `src/app/wildlife/[slug]/page.tsx`                           | Canonical URL added (PAGE-02)                    | VERIFIED    | alternates.canonical set to https://happeningnow.travel/wildlife/${slug}                 |
| `src/app/sitemap.ts`                                         | Root sitemap index                               | VERIFIED    | Queries event/wildlife/destination slugs; revalidate=3600                                 |
| `src/app/festivals/sitemap.ts`                               | Festival section sitemap                         | VERIFIED    | generateSitemaps; getDistinctCountries/Regions; country, country/month, region/month URLs |
| `src/app/wildlife/sitemap.ts`                                | Wildlife section sitemap                         | VERIFIED    | generateSitemaps; getDistinctRegions/Species; region, region/month, species URLs          |
| `src/app/what-to-do/sitemap.ts`                              | What-to-do section sitemap                       | VERIFIED    | generateSitemaps; getAllDestinationSlugs; destination/month URLs                          |
| `src/app/robots.ts`                                          | robots.txt with sitemap + /api/ disallow         | VERIFIED    | userAgent:*, allow:/, disallow:['/api/'], sitemap reference correct                       |
| `src/app/llms.txt/route.ts`                                  | AI discoverability catalog (AIDX-01)             | VERIFIED    | GET + revalidate=86400; queries getDistinctRegions/Countries/Species; llmstxt.org spec    |
| `src/app/llms-full.txt/route.ts`                             | Full event database with affiliate links (AIDX-02) | VERIFIED  | GET + revalidate=86400; buildBookingLink + buildGetYourGuideLink per event                |
| `tests/seo/intro-templates.test.ts`                          | Template count and determinism tests             | VERIFIED    | Tests pass (part of 184 total)                                                            |
| `tests/seo/thin-page-check.test.ts`                          | Noindex threshold tests                          | VERIFIED    | Tests pass                                                                                |
| `tests/seo/semantic-html.test.tsx`                           | AIDX-03 semantic HTML structure tests            | VERIFIED    | 17 tests pass: main, h1, h2, h3, article, data-section, FTC disclosure                   |
| `tests/seo/festival-pages.test.ts`                           | Festival ISR and disambiguation tests            | VERIFIED    | 33 tests pass                                                                             |
| `tests/seo/wildlife-pages.test.ts`                           | Wildlife ISR and route structure tests           | VERIFIED    | 19 tests pass                                                                             |
| `tests/seo/whatodo-pages.test.ts`                            | What-to-do ISR and utility import tests          | VERIFIED    | 23 tests pass                                                                             |
| `tests/seo/sitemap.test.ts`                                  | Sitemap URL generation tests                     | VERIFIED    | 21 tests pass                                                                             |
| `tests/seo/robots.test.ts`                                   | robots.txt output tests                          | VERIFIED    | 4 tests pass                                                                              |
| `tests/seo/llms-txt.test.ts`                                 | llms.txt content structure tests                 | VERIFIED    | 29 tests pass                                                                             |

---

### Key Link Verification

| From                                              | To                                   | Via                                        | Status      | Details                                                                        |
|---------------------------------------------------|--------------------------------------|--------------------------------------------|-------------|--------------------------------------------------------------------------------|
| `festivals/[slug]/[month]/page.tsx`               | `seo-queries.ts`                     | getFestivalsByRegionMonth/CountryMonth     | WIRED       | Both functions imported and called in generateMetadata + page component        |
| `festivals/[slug]/page.tsx`                       | `intro-templates.ts`                 | getFestivalCountryIntro                    | WIRED       | Imported and called with events.length, deslugify(slug), topCategories         |
| `festivals/[slug]/page.tsx`                       | `SeoPageLayout.tsx`                  | SeoPageLayout import                       | WIRED       | Imported and used as wrapper component                                         |
| `wildlife/region/[region]/page.tsx`               | `seo-queries.ts`                     | getWildlifeByRegion                        | WIRED       | Imported and called in generateMetadata + page component                       |
| `wildlife/species/[species]/page.tsx`             | `seo-queries.ts`                     | getWildlifeBySpecies                       | WIRED       | Imported and called in generateMetadata + page component                       |
| `event/[slug]/page.tsx`                           | `generateMetadata`                   | canonical URL in alternates                | WIRED       | alternates.canonical set to https://happeningnow.travel/event/${slug}          |
| `what-to-do/[destination]/[month]/page.tsx`       | `seo-queries.ts`                     | getWhatToDoData                            | WIRED       | Imported and called with destinationSlug, month                                |
| `what-to-do/[destination]/[month]/page.tsx`       | `destination-utils.ts`               | formatWeatherSummary, crowdScoreToColor, crowdScoreToLabel, estimateTouristVolume | WIRED | All 4 functions imported and used in page component |
| `festivals/sitemap.ts`                            | `seo-queries.ts`                     | getDistinctCountries, getDistinctRegions   | WIRED       | Both queries imported and called in sitemap default export                     |
| `robots.ts`                                       | /sitemap.xml                         | sitemap URL reference                      | WIRED       | sitemap: 'https://happeningnow.travel/sitemap.xml'                             |
| `llms.txt/route.ts`                               | `seo-queries.ts`                     | getDistinctRegions, getDistinctCountries, getDistinctSpecies | WIRED | All 3 imported and called in GET handler                           |
| `llms-full.txt/route.ts`                          | `affiliates.ts`                      | buildBookingLink, buildGetYourGuideLink    | WIRED       | Both imported and called per festival (Booking.com + GYG) and wildlife (GYG only) |
| `internal-links.ts` → `festivals/[slug]/[month]` | numeric month route param            | slugified month names in festival URLs     | NOT_WIRED   | Lines 60, 69, 76 generate /festivals/thailand/january; route uses parseInt and expects /festivals/thailand/1 |

---

### Requirements Coverage

| Requirement | Source Plan | Description                                                                     | Status      | Evidence                                                                   |
|-------------|-------------|---------------------------------------------------------------------------------|-------------|----------------------------------------------------------------------------|
| SEO-01      | 04-02       | /festivals/[region]/[month] pages                                               | SATISFIED   | festivals/[slug]/[month]/page.tsx handles region+month via KNOWN_REGIONS   |
| SEO-02      | 04-02       | /festivals/[country] pages                                                      | SATISFIED   | festivals/[slug]/page.tsx (country page with month-grouped calendar)       |
| SEO-03      | 04-02       | /festivals/[country]/[month] pages                                              | SATISFIED   | festivals/[slug]/[month]/page.tsx handles country+month when not KNOWN_REGIONS |
| SEO-04      | 04-03       | /wildlife/[region] pages                                                        | SATISFIED   | wildlife/region/[region]/page.tsx exists with ISR                          |
| SEO-05      | 04-03       | /wildlife/[species] pages                                                       | SATISFIED   | wildlife/species/[species]/page.tsx exists with ISR                        |
| SEO-06      | 04-03       | /wildlife/[region]/[month] pages                                                | SATISFIED   | wildlife/region/[region]/[month]/page.tsx exists with ISR                  |
| SEO-07      | 04-04       | /what-to-do/[destination]/[month] pages with events + crowd + weather           | SATISFIED   | Combined data in what-to-do page; weather/crowd/events sections present    |
| SEO-08      | 04-01       | Unique AI-generated intro (2-3 sentences) per page                             | SATISFIED   | 7 template arrays × 21+ entries; deterministic hash; all tested            |
| SEO-09      | 04-01       | Each page: map + event cards + affiliate links + internal links + email capture | SATISFIED   | SeoPageLayout: EmailCapture; FilteredMap + EventCardGrid + InternalLinks per page |
| SEO-10      | 04-05       | XML sitemap generated                                                           | SATISFIED*  | Sitemaps present and generate valid URLs; NOTE: REQUIREMENTS.md says "from seo_pages table" but implementation queries events/destinations/migration_routes — no seo_pages table exists; functionally equivalent |
| SEO-11      | 04-05       | robots.txt and sitemap submission config                                        | SATISFIED   | robots.ts present; sitemap URL referenced; submission is a manual/runtime task |
| SEO-12      | 04-02       | ISR (revalidate=86400) for all programmatic pages                               | SATISFIED   | All page families export revalidate=86400, dynamicParams=true, generateStaticParams returns [] |
| PAGE-01     | 04-03       | /event/[slug] detail pages with canonical URLs                                  | SATISFIED   | alternates.canonical added to generateMetadata in event/[slug]/page.tsx    |
| PAGE-02     | 04-03       | /wildlife/[slug] detail pages with canonical URLs                               | SATISFIED   | alternates.canonical added to generateMetadata in wildlife/[slug]/page.tsx |
| AIDX-01     | 04-06       | llms.txt site catalog for LLM crawlers                                          | SATISFIED   | route.ts serves llmstxt.org-spec markdown; includes URL patterns section   |
| AIDX-02     | 04-06       | llms-full.txt with comprehensive event data including affiliate links           | SATISFIED   | route.ts includes festival Booking.com + GYG links; wildlife GYG-only      |
| AIDX-03     | 04-01       | Semantic HTML for AI content extraction                                         | SATISFIED   | main, h1, h2/h3 hierarchy, article per event card, data-section attributes; 17 passing tests |

*SEO-10 uses different data source than specification but achieves equivalent outcome.

---

### Anti-Patterns Found

| File                               | Line(s) | Pattern                              | Severity  | Impact                                                                                         |
|------------------------------------|---------|--------------------------------------|-----------|------------------------------------------------------------------------------------------------|
| `src/lib/seo/internal-links.ts`   | 60, 69, 76 | Festival month URLs use slugified names | Blocker | getRelatedFestivalLinks generates /festivals/{country}/january, /festivals/{region}/march, etc. — festival [month] route uses parseInt and calls notFound() for non-numeric params — all festival internal links are broken |

---

### Human Verification Required

#### 1. Festival Programmatic Pages

**Test:** Visit `/festivals/southeast-asia/3` (or any valid region/month combo) and `/festivals/thailand` in a browser with real Supabase data connected.
**Expected:** Page renders with intro text paragraph, interactive MapLibre map with event markers, EventCardGrid with Booking.com and GetYourGuide CTA buttons, and related festival page links.
**Why human:** ISR pages require real Supabase database connection to populate events; cannot verify rendered output from static analysis.

#### 2. Sitemap Content

**Test:** Visit `/sitemap.xml`, `/festivals/sitemap.xml`, `/wildlife/sitemap.xml`, and `/what-to-do/sitemap.xml`.
**Expected:** Root sitemap index loads; section sitemaps contain URL entries in the correct formats (`/festivals/{slug}/{month}` with numeric months, `/wildlife/region/{region}`, `/what-to-do/{dest}/{month}`).
**Why human:** Sitemap generation queries Supabase at runtime — content depends on live data.

#### 3. robots.txt Serving

**Test:** Visit `/robots.txt`.
**Expected:** Contains `Disallow: /api/` and `Sitemap: https://happeningnow.travel/sitemap.xml`.
**Why human:** Next.js robots.ts is a server-side handler — verify it serves correct Content-Type and format in the runtime environment.

#### 4. llms.txt Content Verification

**Test:** Visit `/llms.txt` and `/llms-full.txt`.
**Expected:** llms.txt opens with `# HappeningNow.travel`, has sections for Regions, Countries, Wildlife Species; llms-full.txt contains event entries with Booking.com and GetYourGuide affiliate URLs.
**Why human:** Route handlers query live Supabase to build the markdown content.

---

### Gaps Summary

**One blocker gap** preventing full goal achievement:

`getRelatedFestivalLinks` in `src/lib/seo/internal-links.ts` was not updated to use numeric month URL params when the festival page routes switched to numeric months (the same fix was applied to wildlife and what-to-do pages, but not to the festival function). Lines 60, 69, and 76 all call `slugify(MONTH_NAMES[m])` instead of using the numeric month value `m` directly.

**Impact:** Every festival programmatic page renders internal links that resolve to 404 pages. Crawlers following these links will hit `notFound()` in the [month]/page.tsx route since `parseInt('january', 10)` returns NaN.

**Fix is trivial** — 3 one-line changes to replace `/${slugify(MONTH_NAMES[m])}` with `/${m}` and `/${slugify(MONTH_NAMES[currentMonth])}` with `/${currentMonth}`.

---

_Verified: 2026-03-02T04:30:00Z_
_Verifier: Claude (gsd-verifier)_
