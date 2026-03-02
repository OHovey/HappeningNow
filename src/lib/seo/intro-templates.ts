/**
 * Intro template system for programmatic SEO pages.
 *
 * Each page type has 20+ template variations. Selection is deterministic
 * via content hash so the same inputs always produce the same output.
 * Tone: factual, data-driven, no forced personality.
 */

// ---------------------------------------------------------------------------
// Hash utility
// ---------------------------------------------------------------------------

/**
 * Simple deterministic hash for template selection.
 * Produces a non-negative integer from any string.
 */
export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

function pick<T>(templates: T[], key: string): T {
  return templates[simpleHash(key) % templates.length];
}

// ---------------------------------------------------------------------------
// Festival Region Month templates
// ---------------------------------------------------------------------------

type FestivalRegionMonthFn = (count: number, region: string, monthName: string) => string;

export const FESTIVAL_REGION_MONTH_TEMPLATES: FestivalRegionMonthFn[] = [
  (c, r, m) => `${c} festivals happening in ${r} this ${m}. From cultural celebrations to music gatherings, here is what to experience.`,
  (c, r, m) => `${r} hosts ${c} festivals in ${m}. Browse the full list with dates, locations, and booking options.`,
  (c, r, m) => `Planning a trip to ${r} in ${m}? There are ${c} festivals taking place across the region.`,
  (c, r, m) => `Discover ${c} festivals across ${r} during ${m}. Each listing includes dates and travel links.`,
  (c, r, m) => `${m} brings ${c} festivals to ${r}. Explore dates, venues, and crowd levels for each event.`,
  (c, r, m) => `There are ${c} festivals scheduled in ${r} for ${m}. Find the right one for your trip.`,
  (c, r, m) => `${r} in ${m}: ${c} festivals to choose from. See crowd levels and book accommodation nearby.`,
  (c, r, m) => `Looking for festivals in ${r}? ${m} has ${c} events ranging from traditional to contemporary.`,
  (c, r, m) => `${c} festivals are taking place across ${r} in ${m}. Compare dates and plan your visit.`,
  (c, r, m) => `Festival season in ${r} during ${m} features ${c} events. Browse them all below.`,
  (c, r, m) => `${m} is a busy time for festivals in ${r}, with ${c} events on the calendar.`,
  (c, r, m) => `Explore ${c} ${m} festivals in ${r}. Filter by crowd level and find hotels near each venue.`,
  (c, r, m) => `From street parades to sacred rituals, ${r} has ${c} festivals in ${m}. See the complete list.`,
  (c, r, m) => `${c} festivals dot the ${r} calendar in ${m}. Each entry includes travel tips and booking links.`,
  (c, r, m) => `${r} comes alive with ${c} festivals during ${m}. Check dates and plan your itinerary.`,
  (c, r, m) => `Heading to ${r} in ${m}? These ${c} festivals offer a range of cultural experiences.`,
  (c, r, m) => `The ${m} festival calendar for ${r} includes ${c} events. Find dates, crowds, and accommodation.`,
  (c, r, m) => `${c} festivals await in ${r} this ${m}. Get details on each event and book nearby stays.`,
  (c, r, m) => `${r} festival guide for ${m}: ${c} events with dates, locations, and crowd information.`,
  (c, r, m) => `In ${m}, ${r} offers ${c} festivals worth attending. Browse the full lineup below.`,
  (c, r, m) => `Your guide to ${c} festivals in ${r} during ${m}. Includes dates, maps, and booking links.`,
];

export function getFestivalRegionMonthIntro(count: number, region: string, monthName: string): string {
  const fn = pick(FESTIVAL_REGION_MONTH_TEMPLATES, `${region}-${monthName}`);
  return fn(count, region, monthName);
}

// ---------------------------------------------------------------------------
// Festival Country templates
// ---------------------------------------------------------------------------

type FestivalCountryFn = (count: number, country: string, topCategories: string[]) => string;

export const FESTIVAL_COUNTRY_TEMPLATES: FestivalCountryFn[] = [
  (c, co, cats) => `${c} festivals in ${co}${cats.length ? `, from ${cats.slice(0, 2).join(' to ')} celebrations` : ''}. Browse by month, region, or crowd level.`,
  (c, co, cats) => `${co} hosts ${c} festivals throughout the year${cats.length ? `, including ${cats.slice(0, 3).join(', ')}` : ''}. Find dates and plan your trip.`,
  (c, co, cats) => `Discover ${c} festivals across ${co}. ${cats.length ? `Popular categories include ${cats.slice(0, 3).join(', ')}.` : 'Each includes dates and travel links.'}`,
  (c, co, cats) => `Planning a trip to ${co}? There are ${c} festivals to explore${cats.length ? `, spanning ${cats.slice(0, 2).join(' and ')}` : ''}.`,
  (c, co, cats) => `${co} is home to ${c} festivals. ${cats.length ? `Top themes: ${cats.slice(0, 3).join(', ')}.` : 'Browse by date or region.'}`,
  (c, co, cats) => `From coast to countryside, ${co} has ${c} festivals. ${cats.length ? `Highlights include ${cats.slice(0, 2).join(' and ')}.` : 'See the full list below.'}`,
  (c, co, cats) => `Explore ${c} festivals in ${co}${cats.length ? ` across categories like ${cats.slice(0, 3).join(', ')}` : ''}. Filter by month to match your travel dates.`,
  (c, co, cats) => `${c} festivals make ${co} a destination for cultural travel. ${cats.length ? `Expect ${cats.slice(0, 2).join(', ')}, and more.` : 'Browse the complete guide.'}`,
  (c, co, cats) => `The complete guide to ${c} festivals in ${co}. ${cats.length ? `Categories span ${cats.slice(0, 3).join(', ')}.` : 'Filter by date and crowd level.'}`,
  (c, co, cats) => `${co} festival guide: ${c} events to experience. ${cats.length ? `Popular types include ${cats.slice(0, 3).join(', ')}.` : 'Find dates and book nearby accommodation.'}`,
  (c, co, cats) => `There are ${c} festivals to attend in ${co}${cats.length ? `, ranging from ${cats[0]} to ${cats[cats.length - 1]}` : ''}. See crowd levels and dates.`,
  (c, co, cats) => `${co} offers ${c} festivals for travelers. ${cats.length ? `From ${cats.slice(0, 2).join(' to ')}, there is something for everyone.` : 'Compare dates and plan your visit.'}`,
  (c, co) => `Discover all ${c} festivals happening in ${co}. Each listing includes dates, crowd levels, and booking links.`,
  (c, co) => `${c} festivals await you in ${co}. Browse the full calendar with dates, locations, and travel tips.`,
  (c, co) => `Your guide to ${c} festivals in ${co}. Compare events, check crowd levels, and book accommodation.`,
  (c, co) => `${co} has ${c} festivals on our radar. See dates, locations, and find tours nearby.`,
  (c, co) => `From north to south, ${co} celebrates with ${c} festivals. Explore them all below.`,
  (c, co) => `${c} festivals across ${co}, sorted by date. Find the perfect event for your next trip.`,
  (c, co) => `Everything you need to know about ${c} festivals in ${co}. Dates, crowd data, and hotel links included.`,
  (c, co) => `${co} festival calendar: ${c} events throughout the year. Click any event for details and booking options.`,
  (c, co) => `A curated list of ${c} festivals in ${co}. Filter by date, region, or crowd level to find your match.`,
];

export function getFestivalCountryIntro(count: number, country: string, topCategories: string[]): string {
  const fn = pick(FESTIVAL_COUNTRY_TEMPLATES, country);
  return fn(count, country, topCategories);
}

// ---------------------------------------------------------------------------
// Festival Country Month templates
// ---------------------------------------------------------------------------

type FestivalCountryMonthFn = (count: number, country: string, monthName: string, topCategories: string[]) => string;

export const FESTIVAL_COUNTRY_MONTH_TEMPLATES: FestivalCountryMonthFn[] = [
  (c, co, m, cats) => `${c} festivals in ${co} during ${m}${cats.length ? `, including ${cats.slice(0, 2).join(' and ')} events` : ''}. See dates and book nearby.`,
  (c, co, m, cats) => `${co} hosts ${c} festivals in ${m}. ${cats.length ? `Expect ${cats.slice(0, 3).join(', ')}.` : 'Browse the full lineup.'}`,
  (c, co, m) => `Planning ${m} in ${co}? There are ${c} festivals happening. See dates and crowd levels.`,
  (c, co, m) => `${m} in ${co} brings ${c} festivals. Find dates, venues, and accommodation for each.`,
  (c, co, m, cats) => `Discover ${c} festivals across ${co} in ${m}. ${cats.length ? `Top categories: ${cats.slice(0, 3).join(', ')}.` : 'Each includes booking links.'}`,
  (c, co, m) => `${c} festivals to experience in ${co} this ${m}. Compare crowd levels and book your trip.`,
  (c, co, m) => `${co} in ${m}: ${c} festivals on the calendar. Browse dates, locations, and travel links.`,
  (c, co, m) => `There are ${c} festivals in ${co} during ${m}. Find the right event for your travel plans.`,
  (c, co, m, cats) => `${m} festival guide for ${co}: ${c} events${cats.length ? ` spanning ${cats.slice(0, 2).join(' and ')}` : ''}. See the full list.`,
  (c, co, m) => `Heading to ${co} in ${m}? These ${c} festivals are worth checking out.`,
  (c, co, m) => `Your complete guide to ${c} festivals in ${co} during ${m}. Includes dates and booking options.`,
  (c, co, m) => `${c} festivals fill the ${co} calendar in ${m}. Click any event for details.`,
  (c, co, m) => `${co} festival season in ${m} features ${c} events. Browse them all with crowd data.`,
  (c, co, m) => `Explore ${c} festivals happening across ${co} in ${m}. Filter by crowd level and location.`,
  (c, co, m, cats) => `${m} is festival time in ${co}, with ${c} events${cats.length ? ` including ${cats[0]}` : ''} on the schedule.`,
  (c, co, m) => `From local traditions to major celebrations, ${co} has ${c} festivals in ${m}.`,
  (c, co, m) => `${c} festivals await in ${co} this ${m}. Get details, dates, and booking links for each.`,
  (c, co, m) => `The ${m} festival lineup for ${co} includes ${c} events. Plan your visit with our guide.`,
  (c, co, m) => `Find ${c} festivals in ${co} for ${m}. Each listing has crowd info and nearby accommodation.`,
  (c, co, m) => `${co} comes alive with ${c} festivals during ${m}. See the complete schedule below.`,
  (c, co, m) => `All ${c} festivals in ${co} for ${m}, with dates, maps, and booking links.`,
];

export function getFestivalCountryMonthIntro(count: number, country: string, monthName: string, topCategories: string[]): string {
  const fn = pick(FESTIVAL_COUNTRY_MONTH_TEMPLATES, `${country}-${monthName}`);
  return fn(count, country, monthName, topCategories);
}

// ---------------------------------------------------------------------------
// Wildlife Region templates
// ---------------------------------------------------------------------------

type WildlifeRegionFn = (count: number, region: string, topSpecies: string[]) => string;

export const WILDLIFE_REGION_TEMPLATES: WildlifeRegionFn[] = [
  (c, r, sp) => `${c} wildlife migration events in ${r}${sp.length ? `, including ${sp.slice(0, 2).join(' and ')}` : ''}. Track routes and find tours.`,
  (c, r, sp) => `${r} is home to ${c} tracked wildlife migrations. ${sp.length ? `Species include ${sp.slice(0, 3).join(', ')}.` : 'See routes and peak months.'}`,
  (c, r, sp) => `Discover ${c} wildlife spectacles across ${r}. ${sp.length ? `Watch for ${sp.slice(0, 2).join(' and ')}.` : 'Find tours and viewing guides.'}`,
  (c, r, sp) => `${c} migration routes cross through ${r}. ${sp.length ? `Top species: ${sp.slice(0, 3).join(', ')}.` : 'See peak viewing months.'}`,
  (c, r) => `Track ${c} wildlife migrations in ${r}. Each listing includes routes, peak months, and tour links.`,
  (c, r) => `${r} wildlife guide: ${c} migrations to witness. Find the best viewing months and book tours.`,
  (c, r, sp) => `From ${sp.length >= 2 ? `${sp[0]} to ${sp[1]}` : 'birds to mammals'}, ${r} has ${c} wildlife migrations. See routes and dates.`,
  (c, r) => `${c} wildlife migration events are tracked in ${r}. Browse routes and plan your viewing trip.`,
  (c, r) => `Planning a wildlife trip to ${r}? There are ${c} migration events to consider. See peak months and tours.`,
  (c, r, sp) => `${r} hosts ${c} remarkable wildlife migrations${sp.length ? `, featuring ${sp.slice(0, 2).join(' and ')}` : ''}. Find routes and dates.`,
  (c, r) => `Explore ${c} wildlife migrations across ${r}. Each includes route maps and recommended tour operators.`,
  (c, r) => `The ${r} wildlife calendar includes ${c} migration events. Check peak months and book tours.`,
  (c, r) => `${c} species migrate through ${r}. Browse their routes, timing, and find guided viewing tours.`,
  (c, r) => `Your guide to ${c} wildlife migrations in ${r}. See routes, peak viewing months, and tour options.`,
  (c, r) => `${r} attracts wildlife watchers with ${c} tracked migrations. Find dates and viewing guides.`,
  (c, r, sp) => `${c} migrations pass through ${r}${sp.length ? `, including ${sp[0]}` : ''}. See route maps and peak timing.`,
  (c, r) => `Witness ${c} wildlife migrations in ${r}. Compare peak months and find guided tours.`,
  (c, r) => `${r} migration guide: ${c} events with routes, timing, and tour recommendations.`,
  (c, r) => `There are ${c} wildlife migrations tracked in ${r}. Browse them all with peak month data.`,
  (c, r) => `${c} spectacular wildlife migrations in ${r}. See the best viewing months and book your trip.`,
  (c, r) => `All ${c} wildlife migrations in ${r}, with route maps, peak months, and nearby tours.`,
];

export function getWildlifeRegionIntro(count: number, region: string, topSpecies: string[]): string {
  const fn = pick(WILDLIFE_REGION_TEMPLATES, region);
  return fn(count, region, topSpecies);
}

// ---------------------------------------------------------------------------
// Wildlife Species templates
// ---------------------------------------------------------------------------

type WildlifeSpeciesFn = (count: number, species: string, topRegions: string[]) => string;

export const WILDLIFE_SPECIES_TEMPLATES: WildlifeSpeciesFn[] = [
  (c, sp, rg) => `${c} ${sp} migration routes tracked worldwide${rg.length ? `, including routes through ${rg.slice(0, 2).join(' and ')}` : ''}. See peak timing and tours.`,
  (c, sp, rg) => `Track ${c} ${sp} migrations${rg.length ? ` across ${rg.slice(0, 3).join(', ')}` : ''}. Find peak viewing months and guided tours.`,
  (c, sp) => `${c} ${sp} migration routes with timing, maps, and tour links. Plan your wildlife viewing trip.`,
  (c, sp, rg) => `Discover ${c} ${sp} migrations${rg.length ? ` spanning ${rg.slice(0, 2).join(' to ')}` : ''}. Each includes route maps and peak months.`,
  (c, sp) => `${sp} migrations: ${c} routes tracked with peak months, maps, and recommended tours.`,
  (c, sp, rg) => `Follow ${c} ${sp} migration routes${rg.length ? ` through ${rg.slice(0, 3).join(', ')}` : ''}. See timing and book wildlife tours.`,
  (c, sp) => `${c} tracked ${sp} migration routes. Compare peak months and find viewing guides.`,
  (c, sp) => `Your guide to ${c} ${sp} migrations. Routes, peak viewing months, and tour options included.`,
  (c, sp, rg) => `${c} ${sp} migrations pass through${rg.length ? ` regions including ${rg.slice(0, 2).join(' and ')}` : ' multiple regions'}. See the complete list.`,
  (c, sp) => `Witness ${c} ${sp} migrations worldwide. Find the best months and book guided tours.`,
  (c, sp) => `${sp} migration guide: ${c} routes with timing, maps, and tour recommendations.`,
  (c, sp) => `There are ${c} ${sp} migration events to explore. Browse routes and peak viewing months.`,
  (c, sp, rg) => `${c} ${sp} migrations are tracked${rg.length ? ` across ${rg.slice(0, 2).join(' and ')}` : ''} with route maps and timing data.`,
  (c, sp) => `Explore ${c} ${sp} migration routes. Each listing includes peak months and nearby tours.`,
  (c, sp) => `${c} ${sp} migrations with route maps, timing, and guided tour links.`,
  (c, sp) => `Follow the ${sp}: ${c} migration routes tracked with peak months and tour options.`,
  (c, sp, rg) => `From ${rg.length >= 2 ? rg[0] : 'breeding grounds'} to ${rg.length >= 2 ? rg[1] : 'wintering sites'}, ${c} ${sp} migration routes are mapped.`,
  (c, sp) => `The complete ${sp} migration guide: ${c} routes with dates and viewing tips.`,
  (c, sp) => `${c} ${sp} migration routes worldwide. Compare timing and find the best viewing locations.`,
  (c, sp) => `All ${c} ${sp} migrations tracked, with route maps, peak months, and tour links.`,
  (c, sp) => `Plan your ${sp} watching trip: ${c} migration routes with dates, maps, and guided tours.`,
];

export function getWildlifeSpeciesIntro(count: number, species: string, topRegions: string[]): string {
  const fn = pick(WILDLIFE_SPECIES_TEMPLATES, species);
  return fn(count, species, topRegions);
}

// ---------------------------------------------------------------------------
// Wildlife Region Month templates
// ---------------------------------------------------------------------------

type WildlifeRegionMonthFn = (count: number, region: string, monthName: string, topSpecies: string[]) => string;

export const WILDLIFE_REGION_MONTH_TEMPLATES: WildlifeRegionMonthFn[] = [
  (c, r, m, sp) => `${c} wildlife migrations active in ${r} during ${m}${sp.length ? `, including ${sp.slice(0, 2).join(' and ')}` : ''}. See routes and tours.`,
  (c, r, m, sp) => `${r} hosts ${c} active migrations in ${m}. ${sp.length ? `Watch for ${sp.slice(0, 3).join(', ')}.` : 'See peak timing and tours.'}`,
  (c, r, m) => `${m} brings ${c} wildlife migrations to ${r}. Find routes, peak timing, and guided tours.`,
  (c, r, m) => `${c} migration events are underway in ${r} during ${m}. Browse routes and book tours.`,
  (c, r, m, sp) => `Discover ${c} wildlife migrations in ${r} this ${m}. ${sp.length ? `Species include ${sp.slice(0, 2).join(' and ')}.` : 'See the full list.'}`,
  (c, r, m) => `Planning a ${m} wildlife trip to ${r}? There are ${c} active migrations to observe.`,
  (c, r, m) => `${r} in ${m}: ${c} wildlife migrations with routes, timing, and tour recommendations.`,
  (c, r, m) => `${c} wildlife spectacles in ${r} during ${m}. Find viewing guides and book tours.`,
  (c, r, m, sp) => `${m} wildlife guide for ${r}: ${c} migrations${sp.length ? ` featuring ${sp[0]}` : ''} with routes and timing.`,
  (c, r, m) => `There are ${c} wildlife migrations active in ${r} this ${m}. See routes and peak dates.`,
  (c, r, m) => `Explore ${c} migrations across ${r} in ${m}. Each includes route maps and tour links.`,
  (c, r, m) => `${r} wildlife calendar for ${m}: ${c} active migration events with viewing details.`,
  (c, r, m) => `${c} species are on the move in ${r} during ${m}. Track routes and find tours.`,
  (c, r, m) => `Your ${m} guide to ${c} wildlife migrations in ${r}. Routes, timing, and tour options.`,
  (c, r, m) => `${m} is prime time for ${c} wildlife migrations in ${r}. See the complete guide.`,
  (c, r, m) => `${c} migrations pass through ${r} in ${m}. Compare routes and book guided viewing.`,
  (c, r, m) => `Witness ${c} wildlife migrations in ${r} this ${m}. Find the best viewing spots and tours.`,
  (c, r, m) => `The ${m} migration calendar for ${r} includes ${c} events. See routes and peak timing.`,
  (c, r, m) => `${c} tracked migrations in ${r} during ${m}. Browse routes and plan your wildlife trip.`,
  (c, r, m) => `All ${c} wildlife migrations in ${r} for ${m}, with route maps and tour recommendations.`,
  (c, r, m) => `${r} migration guide for ${m}: ${c} events with routes, species info, and tours.`,
];

export function getWildlifeRegionMonthIntro(count: number, region: string, monthName: string, topSpecies: string[]): string {
  const fn = pick(WILDLIFE_REGION_MONTH_TEMPLATES, `${region}-${monthName}`);
  return fn(count, region, monthName, topSpecies);
}

// ---------------------------------------------------------------------------
// What-to-do templates
// ---------------------------------------------------------------------------

type WhatToDoFn = (eventCount: number, destination: string, monthName: string, crowdLevel: string, weatherSummary: string) => string;

export const WHATODO_TEMPLATES: WhatToDoFn[] = [
  (c, d, m, cl, w) => `${c} events in ${d} during ${m}. ${w ? `Weather: ${w}.` : ''} ${cl ? `Crowd level: ${cl}.` : ''} Plan your visit with dates and booking links.`,
  (c, d, m, cl, w) => `Visiting ${d} in ${m}? There are ${c} events to experience. ${cl ? `Expect ${cl} crowds.` : ''} ${w ? `${w}.` : ''}`,
  (c, d, m, _cl, w) => `${d} in ${m}: ${c} things to do. ${w ? `${w}.` : ''} Browse events with dates and booking options.`,
  (c, d, m, cl) => `${c} things happening in ${d} this ${m}. ${cl ? `Crowds are ${cl}.` : ''} See the full list with dates and tours.`,
  (c, d, m, cl, w) => `Your ${m} guide to ${d}: ${c} events to attend. ${w ? `${w}.` : ''} ${cl ? `${cl} crowd conditions.` : ''}`,
  (c, d, m) => `What to do in ${d} in ${m}: ${c} events with dates, crowd levels, and booking links.`,
  (c, d, m, cl) => `${d} offers ${c} events in ${m}. ${cl ? `Crowd level: ${cl}.` : ''} Find dates and book accommodation.`,
  (c, d, m, _cl, w) => `Planning a ${m} trip to ${d}? We found ${c} events happening. ${w ? `${w}.` : ''} See dates and tours.`,
  (c, d, m, cl, w) => `${c} events fill the ${d} calendar in ${m}. ${cl ? `${cl} crowds expected.` : ''} ${w ? `${w}.` : ''}`,
  (c, d, m) => `Explore ${c} events in ${d} during ${m}. Each listing has dates, crowd data, and travel links.`,
  (c, d, m, cl) => `${d} in ${m} features ${c} events. ${cl ? `Crowds are ${cl}.` : ''} Browse the complete guide below.`,
  (c, d, m, _cl, w) => `There are ${c} things to do in ${d} this ${m}. ${w ? `${w}.` : ''} Find events, tours, and hotels.`,
  (c, d, m, cl) => `${m} in ${d}: ${c} events, ${cl ? `${cl} crowds` : 'varied crowd levels'}, and plenty to see. Browse the full list.`,
  (c, d, m) => `${c} reasons to visit ${d} in ${m}. See events, dates, crowd levels, and booking options.`,
  (c, d, m, cl, w) => `Discover what to do in ${d} during ${m}. ${c} events listed. ${w ? `${w}.` : ''} ${cl ? `Crowds: ${cl}.` : ''}`,
  (c, d, m) => `The complete ${m} guide to ${d}: ${c} events with dates and travel tips.`,
  (c, d, m, cl) => `${d} travel guide for ${m}: ${c} events happening. ${cl ? `Expect ${cl} crowds.` : ''} See dates and book tours.`,
  (c, d, m) => `Find ${c} events in ${d} for ${m}. Includes crowd levels, weather info, and hotel links.`,
  (c, d, m, cl, w) => `${d} has ${c} events in ${m}. ${cl ? `${cl} crowd conditions.` : ''} ${w ? `${w}.` : ''} Plan your trip below.`,
  (c, d, m) => `All ${c} events in ${d} for ${m}, with dates, crowd levels, and booking links.`,
  (c, d, m) => `${m} in ${d}: your guide to ${c} events. Compare dates, check crowds, and book your trip.`,
];

export function getWhatToDoIntro(
  eventCount: number,
  destination: string,
  monthName: string,
  crowdLevel: string,
  weatherSummary: string,
): string {
  const fn = pick(WHATODO_TEMPLATES, `${destination}-${monthName}`);
  return fn(eventCount, destination, monthName, crowdLevel, weatherSummary);
}
