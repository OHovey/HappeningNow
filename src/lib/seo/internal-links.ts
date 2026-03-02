/**
 * Internal linking helpers for cross-page SEO links.
 *
 * Each function generates related page links for the current page type.
 * Returns max 8 links per function call.
 */

export interface InternalLink {
  href: string;
  label: string;
}

const MAX_LINKS = 8;

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function adjacentMonths(month: number): number[] {
  const prev = month === 1 ? 12 : month - 1;
  const next = month === 12 ? 1 : month + 1;
  return [prev, next];
}

/**
 * Generate related festival page links for cross-linking.
 *
 * Strategy:
 * - Same country, adjacent months
 * - Same region, different months (spread)
 * - Same month, region-level overview
 */
export function getRelatedFestivalLinks(
  currentCountry: string | null,
  currentRegion: string | null,
  currentMonth: number | null,
): InternalLink[] {
  const links: InternalLink[] = [];

  // Country page link
  if (currentCountry) {
    links.push({
      href: `/festivals/${slugify(currentCountry)}`,
      label: `All festivals in ${currentCountry}`,
    });
  }

  // Same country, adjacent months
  if (currentCountry && currentMonth) {
    for (const m of adjacentMonths(currentMonth)) {
      links.push({
        href: `/festivals/${slugify(currentCountry)}/${slugify(MONTH_NAMES[m])}`,
        label: `${currentCountry} festivals in ${MONTH_NAMES[m]}`,
      });
    }
  }

  // Region overview for current month
  if (currentRegion && currentMonth) {
    links.push({
      href: `/festivals/${slugify(currentRegion)}/${slugify(MONTH_NAMES[currentMonth])}`,
      label: `${currentRegion} festivals in ${MONTH_NAMES[currentMonth]}`,
    });

    // Region, adjacent months
    for (const m of adjacentMonths(currentMonth)) {
      links.push({
        href: `/festivals/${slugify(currentRegion)}/${slugify(MONTH_NAMES[m])}`,
        label: `${currentRegion} festivals in ${MONTH_NAMES[m]}`,
      });
    }
  }

  return links.slice(0, MAX_LINKS);
}

/**
 * Generate related wildlife page links for cross-linking.
 *
 * Strategy:
 * - Same region, other species
 * - Same species, different regions
 * - Same region, adjacent months
 */
export function getRelatedWildlifeLinks(
  currentRegion: string | null,
  currentSpecies: string | null,
  currentMonth: number | null,
): InternalLink[] {
  const links: InternalLink[] = [];

  // Region overview
  if (currentRegion) {
    links.push({
      href: `/wildlife/region/${slugify(currentRegion)}`,
      label: `All wildlife in ${currentRegion}`,
    });
  }

  // Species overview
  if (currentSpecies) {
    links.push({
      href: `/wildlife/species/${slugify(currentSpecies)}`,
      label: `All ${currentSpecies} migrations`,
    });
  }

  // Region + adjacent months
  if (currentRegion && currentMonth) {
    for (const m of adjacentMonths(currentMonth)) {
      links.push({
        href: `/wildlife/region/${slugify(currentRegion)}/${slugify(MONTH_NAMES[m])}`,
        label: `${currentRegion} wildlife in ${MONTH_NAMES[m]}`,
      });
    }
  }

  // Same region with current month
  if (currentRegion && currentMonth) {
    links.push({
      href: `/wildlife/region/${slugify(currentRegion)}/${slugify(MONTH_NAMES[currentMonth])}`,
      label: `${currentRegion} wildlife in ${MONTH_NAMES[currentMonth]}`,
    });
  }

  return links.slice(0, MAX_LINKS);
}

/**
 * Generate related what-to-do page links for cross-linking.
 *
 * Strategy:
 * - Same destination, adjacent months
 * - Nearby destinations (from provided list), same month
 */
export function getRelatedWhatToDoLinks(
  currentDestination: string,
  currentMonth: number,
  allDestinations: string[],
): InternalLink[] {
  const links: InternalLink[] = [];

  // Same destination, adjacent months
  for (const m of adjacentMonths(currentMonth)) {
    links.push({
      href: `/what-to-do/${slugify(currentDestination)}/${slugify(MONTH_NAMES[m])}`,
      label: `${currentDestination} in ${MONTH_NAMES[m]}`,
    });
  }

  // Other destinations for same month
  const otherDestinations = allDestinations
    .filter((d) => d.toLowerCase() !== currentDestination.toLowerCase())
    .slice(0, 6);

  for (const dest of otherDestinations) {
    links.push({
      href: `/what-to-do/${slugify(dest)}/${slugify(MONTH_NAMES[currentMonth])}`,
      label: `${dest} in ${MONTH_NAMES[currentMonth]}`,
    });
  }

  return links.slice(0, MAX_LINKS);
}
