/**
 * Compute the month-aware active position along a migration route.
 *
 * Maps the current month to a proportional index along the route coordinates.
 * If the current month falls outside the migration window, highlights
 * the nearest endpoint.
 */
export function computeActivePosition(
  routeCoordinates: number[][],
  peakMonths: number[],
  selectedMonth?: number,
): [number, number] | undefined {
  if (!routeCoordinates || routeCoordinates.length === 0 || !peakMonths || peakMonths.length === 0) {
    return undefined;
  }

  const month = selectedMonth ?? (new Date().getMonth() + 1); // 1-12
  const firstPeak = peakMonths[0];
  const lastPeak = peakMonths[peakMonths.length - 1];

  // Check if selected month falls within migration window
  let monthIndex: number;
  if (firstPeak <= lastPeak) {
    // Normal range (e.g., March to August)
    if (month < firstPeak) {
      monthIndex = 0;
    } else if (month > lastPeak) {
      monthIndex = peakMonths.length - 1;
    } else {
      monthIndex = month - firstPeak;
    }
  } else {
    // Wrapping range (e.g., November to February)
    const expandedMonths: number[] = [];
    for (let m = firstPeak; m <= 12; m++) expandedMonths.push(m);
    for (let m = 1; m <= lastPeak; m++) expandedMonths.push(m);

    const idx = expandedMonths.indexOf(month);
    if (idx === -1) {
      monthIndex = 0;
    } else {
      monthIndex = idx;
    }
  }

  // Map month index to route coordinate index
  const totalMonths = peakMonths.length > 1 ? peakMonths.length - 1 : 1;
  const fraction = Math.min(monthIndex / totalMonths, 1);
  const coordIndex = Math.round(fraction * (routeCoordinates.length - 1));
  const coord = routeCoordinates[coordIndex];

  return coord ? [coord[0], coord[1]] : undefined;
}

/**
 * Compute the coordinate index for the active position along a migration route.
 * Used by migration-layers to split the route at the dot position.
 */
export function computeActivePositionIndex(
  routeCoordinates: number[][],
  peakMonths: number[],
  selectedMonth?: number,
): number {
  if (!routeCoordinates || routeCoordinates.length === 0 || !peakMonths || peakMonths.length === 0) {
    return 0;
  }

  const month = selectedMonth ?? (new Date().getMonth() + 1);
  const firstPeak = peakMonths[0];
  const lastPeak = peakMonths[peakMonths.length - 1];

  let monthIndex: number;
  if (firstPeak <= lastPeak) {
    if (month < firstPeak) {
      monthIndex = 0;
    } else if (month > lastPeak) {
      monthIndex = peakMonths.length - 1;
    } else {
      monthIndex = month - firstPeak;
    }
  } else {
    const expandedMonths: number[] = [];
    for (let m = firstPeak; m <= 12; m++) expandedMonths.push(m);
    for (let m = 1; m <= lastPeak; m++) expandedMonths.push(m);
    const idx = expandedMonths.indexOf(month);
    monthIndex = idx === -1 ? 0 : idx;
  }

  const totalMonths = peakMonths.length > 1 ? peakMonths.length - 1 : 1;
  const fraction = Math.min(monthIndex / totalMonths, 1);
  return Math.round(fraction * (routeCoordinates.length - 1));
}
