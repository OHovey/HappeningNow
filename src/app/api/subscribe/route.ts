import { NextResponse } from 'next/server';
import { createSubscriber, tagSubscriber, TAG_IDS } from '@/lib/convertkit';

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
    const { email, interests, eventCategory } = body as {
      email?: string;
      interests?: string[];
      eventCategory?: string;
    };

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

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Subscription failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
