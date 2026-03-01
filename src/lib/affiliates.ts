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

/** Maximum days in the future Booking.com accepts for checkin */
const BOOKING_MAX_FUTURE_DAYS = 500;

/** Default stay duration in days */
const BOOKING_DEFAULT_STAY_DAYS = 7;

/** Maximum stay duration Booking.com allows */
const BOOKING_MAX_STAY_DAYS = 90;

export interface BookingLinkParams {
  destinationId?: string | null;
  city?: string | null;
  checkin?: string;
  checkout?: string;
  startMonth?: number;
  awinAffiliateId?: string;
  awinMerchantId?: string;
}

interface GYGLinkParams {
  locationId?: string | null;
  query?: string;
}

/**
 * Formats a Date as yyyy-mm-dd.
 */
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Computes a safe checkin date from a start month.
 * - Uses the 1st of that month in the current year.
 * - If the date is in the past, uses next year.
 * - Clamps to max 500 days from today (Booking.com constraint).
 */
function computeCheckinFromMonth(startMonth: number, today: Date = new Date()): Date {
  const year = today.getFullYear();
  const target = new Date(year, startMonth - 1, 1);

  // If the month has already passed this year, use next year
  if (target < today) {
    target.setFullYear(year + 1);
  }

  // Clamp to max 500 days from today
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + BOOKING_MAX_FUTURE_DAYS);
  if (target > maxDate) {
    return maxDate;
  }

  return target;
}

/**
 * Computes checkout date from checkin.
 * - Default: checkin + 7 days
 * - Capped at checkin + 90 days (Booking.com max)
 */
function computeCheckout(checkin: Date): Date {
  const checkout = new Date(checkin);
  const stayDays = Math.min(BOOKING_DEFAULT_STAY_DAYS, BOOKING_MAX_STAY_DAYS);
  checkout.setDate(checkout.getDate() + stayDays);
  return checkout;
}

/**
 * Builds a Booking.com search results deep link.
 *
 * Uses destinationId when available, otherwise falls back to city name
 * as a free-text search. If no dates are provided, derives them from
 * the event's start month with safety clamping.
 *
 * Optionally wraps through Awin click tracking when awinAffiliateId
 * and awinMerchantId are provided.
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

  // Destination: prefer dest_id, fall back to free-text search (ss)
  if (params.destinationId) {
    searchParams.set('dest_id', params.destinationId);
    searchParams.set('dest_type', 'city');
  } else if (params.city) {
    searchParams.set('ss', params.city);
  }

  // Date computation with safety
  if (params.checkin) {
    searchParams.set('checkin', params.checkin);
  } else if (params.startMonth) {
    const checkinDate = computeCheckinFromMonth(params.startMonth);
    searchParams.set('checkin', formatDate(checkinDate));
  }

  if (params.checkout) {
    searchParams.set('checkout', params.checkout);
  } else if (searchParams.has('checkin')) {
    const checkinStr = searchParams.get('checkin')!;
    const checkinDate = new Date(checkinStr + 'T00:00:00');
    const checkoutDate = computeCheckout(checkinDate);
    searchParams.set('checkout', formatDate(checkoutDate));
  }

  searchParams.set('no_rooms', '1');
  searchParams.set('group_adults', '2');

  const bookingUrl = `${base}?${searchParams}`;

  // Awin click tracking wrapper
  if (params.awinAffiliateId && params.awinMerchantId) {
    const awinParams = new URLSearchParams({
      awinmid: params.awinMerchantId,
      awinaffid: params.awinAffiliateId,
      ued: bookingUrl,
    });
    return `https://www.awin1.com/cread.php?${awinParams}`;
  }

  return bookingUrl;
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
