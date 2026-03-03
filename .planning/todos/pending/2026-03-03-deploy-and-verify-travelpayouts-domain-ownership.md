---
created: 2026-03-03T22:37:50.413Z
title: Deploy and verify Travelpayouts domain ownership
area: general
files:
  - src/app/layout.tsx
  - vercel.json
  - .env.local
---

## Problem

Travelpayouts requires domain ownership verification (via Google Analytics snippet) before granting access to partner programs. The site happeningnow.travel is not yet deployed/live, so verification cannot be completed. This blocks affiliate revenue from Booking.com, GetYourGuide, Viator, Tiqets, Trip.com, and Expedia.

## Solution

1. Deploy the Next.js app to Vercel
2. Configure `happeningnow.travel` custom domain in Vercel dashboard
3. Add Google Analytics snippet to `src/app/layout.tsx` `<head>` for Travelpayouts verification
4. Complete Travelpayouts domain verification at travelpayouts.com
5. Join partner programs: Booking.com, GetYourGuide, Viator, Tiqets, Trip.com, Expedia
6. Grab Travelpayouts API token from Profile → API token
7. Set `TRAVELPAYOUTS_API_TOKEN` env var in Vercel project settings
