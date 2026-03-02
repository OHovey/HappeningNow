import { NextResponse } from 'next/server';
import { createSubscriber, tagSubscriber, setSubscriberCustomField, TAG_IDS } from '@/lib/convertkit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  // Check Kit API key is configured
  if (!process.env.KIT_API_KEY) {
    return NextResponse.json(
      { error: 'Email service not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { email, interests, eventCategory, alert, region, categories } = body as {
      email?: string;
      interests?: string[];
      eventCategory?: string;
      alert?: boolean;
      region?: string;
      categories?: string[];
    };

    // Validate alert-specific fields
    if (alert && (!region || typeof region !== 'string' || region.trim() === '')) {
      return NextResponse.json(
        { error: 'Region is required for alert subscriptions' },
        { status: 400 }
      );
    }

    if (categories && !Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'Categories must be an array' },
        { status: 400 }
      );
    }

    // Validate email
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    // Normalize interests
    const interestList = Array.isArray(interests) ? interests : [];

    // Create subscriber first (must exist before tagging)
    const subscriber = await createSubscriber(email);

    // Collect all tags to apply: interests + event category
    const tagsToApply = new Set<string>(interestList);
    if (eventCategory) {
      tagsToApply.add(eventCategory);
    }

    // Apply tags
    for (const tag of tagsToApply) {
      const normalizedTag = tag.toLowerCase();
      const tagId = TAG_IDS[normalizedTag];
      if (tagId !== undefined) {
        await tagSubscriber(subscriber.id, tagId);
      }
    }

    // Set alert region custom field if alert subscription
    if (alert && region) {
      await setSubscriberCustomField(subscriber.id, 'alert_region', region);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Subscription failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
