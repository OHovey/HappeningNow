/**
 * Affiliate URL builders for Booking.com and GetYourGuide deep links.
 *
 * Both functions handle missing environment variables gracefully,
 * returning fallback URLs that still reach the affiliate site
 * (just without tracking parameters).
 */

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface BookingLinkParams {
  destinationId?: string | null;
  city?: string | null;
  checkin?: string;
  checkout?: string;
  startMonth?: number;
}

interface GYGLinkParams {
  locationId?: string | null;
  query?: string;
}

/**
 * Builds a Booking.com search results deep link.
 *
 * Uses destinationId when available, otherwise falls back to city name
 * as a free-text search. If no dates are provided, derives them from
 * the event's start month.
 */
export function buildBookingLink(params: BookingLinkParams): string {
  const aid = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID
    : process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID;

  const base = 'https://www.booking.com/searchresults.html';
  const searchParams = new URLSearchParams();

  if (aid) {
    searchParams.set('aid', aid);
  }

  if (params.destinationId) {
    searchParams.set('dest_id', params.destinationId);
    searchParams.set('dest_type', 'city');
  } else if (params.city) {
    searchParams.set('ss', params.city);
  }

  // Derive check-in/check-out from start month if not provided
  if (params.checkin) {
    searchParams.set('checkin', params.checkin);
  } else if (params.startMonth) {
    const year = new Date().getFullYear();
    const month = String(params.startMonth).padStart(2, '0');
    searchParams.set('checkin', `${year}-${month}-01`);
  }

  if (params.checkout) {
    searchParams.set('checkout', params.checkout);
  } else if (params.startMonth) {
    const year = new Date().getFullYear();
    const month = params.startMonth;
    // End of the start month
    const lastDay = new Date(year, month, 0).getDate();
    const monthStr = String(month).padStart(2, '0');
    searchParams.set('checkout', `${year}-${monthStr}-${lastDay}`);
  }

  searchParams.set('no_rooms', '1');
  searchParams.set('group_adults', '2');

  const qs = searchParams.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Builds a GetYourGuide deep link.
 *
 * Uses locationId for direct location pages, otherwise falls back
 * to search with a query string.
 */
export function buildGetYourGuideLink(params: GYGLinkParams): string {
  const partnerId = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_GYG_PARTNER_ID
    : process.env.NEXT_PUBLIC_GYG_PARTNER_ID;

  let base: string;
  if (params.locationId) {
    base = `https://www.getyourguide.com/l${params.locationId}`;
  } else {
    base = 'https://www.getyourguide.com/s/';
  }

  const searchParams = new URLSearchParams();

  if (partnerId) {
    searchParams.set('partner_id', partnerId);
  }

  if (params.query) {
    searchParams.set('q', params.query);
  }

  const qs = searchParams.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Formats a month range for display.
 * Single month: "March"
 * Multi-month: "June - August"
 */
export function formatMonthRange(startMonth: number, endMonth: number): string {
  if (startMonth === endMonth) {
    return MONTH_NAMES[startMonth] || '';
  }
  const start = MONTH_NAMES[startMonth] || '';
  const end = MONTH_NAMES[endMonth] || '';
  return `${start} - ${end}`;
}
