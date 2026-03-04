import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import SeoPageLayout from '@/components/seo/SeoPageLayout';
import EventCardGrid from '@/components/seo/EventCardGrid';
import InternalLinks from '@/components/seo/InternalLinks';
import type { Event } from '@/lib/supabase/types';

// Mock EmailCapture (client component with hooks)
vi.mock('@/components/panel/EmailCapture', () => ({
  default: ({ eventCategory }: { eventCategory: string }) => (
    <div data-testid="email-capture">Email capture: {eventCategory}</div>
  ),
}));

// Mock CrowdBadge (client component)
vi.mock('@/components/ui/CrowdBadge', () => ({
  default: ({ level }: { level: string }) => (
    <span data-testid="crowd-badge">{level}</span>
  ),
}));

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockBreadcrumbs = [
  { name: 'Home', href: '/' },
  { name: 'Festivals', href: '/festivals' },
  { name: 'Thailand' },
];

const mockRelatedLinks = [
  { href: '/festivals/thailand/april', label: 'Thailand in April' },
  { href: '/festivals/japan', label: 'Festivals in Japan' },
];

const mockEvent: Event = {
  id: '1',
  name: 'Songkran',
  slug: 'songkran',
  category: 'festival',
  description: 'Water festival',
  image_url: null,
  start_month: 4,
  end_month: 4,
  location: null,
  country: 'Thailand',
  region: 'Southeast Asia',
  scale: 5,
  crowd_level: 'busy',
  booking_destination_id: null,
  getyourguide_location_id: null,
  migration_route_id: null,
  start_date: null,
  end_date: null,
  status: 'active',
  last_confirmed_at: null,
  confidence: 1.0,
  source: 'manual',
  source_id: null,
  created_at: '2024-01-01',
};

describe('semantic HTML structure (AIDX-03)', () => {
  describe('SeoPageLayout', () => {
    it('renders a main element', () => {
      const html = renderToString(
        <SeoPageLayout
          title="Festivals in Thailand"
          intro="Discover festivals in Thailand."
          breadcrumbs={mockBreadcrumbs}
          relatedLinks={mockRelatedLinks}
        >
          <div>Content</div>
        </SeoPageLayout>
      );
      expect(html).toContain('<main');
    });

    it('renders an h1 element for the page title', () => {
      const html = renderToString(
        <SeoPageLayout
          title="Festivals in Thailand"
          intro="Discover festivals."
          breadcrumbs={mockBreadcrumbs}
          relatedLinks={mockRelatedLinks}
        >
          <div>Content</div>
        </SeoPageLayout>
      );
      expect(html).toMatch(/<h1[^>]*>Festivals in Thailand<\/h1>/);
    });

    it('renders section elements with data-section attributes', () => {
      const html = renderToString(
        <SeoPageLayout
          title="Test"
          intro="Test intro."
          breadcrumbs={mockBreadcrumbs}
          relatedLinks={mockRelatedLinks}
        >
          <div>Content</div>
        </SeoPageLayout>
      );
      expect(html).toContain('data-section="email-capture"');
      expect(html).toContain('data-section="related"');
    });

    it('renders email capture after intro', () => {
      const html = renderToString(
        <SeoPageLayout
          title="Test"
          intro="Test intro."
          breadcrumbs={mockBreadcrumbs}
          relatedLinks={mockRelatedLinks}
        >
          <div>Content</div>
        </SeoPageLayout>
      );
      const introIdx = html.indexOf('Test intro.');
      const emailIdx = html.indexOf('data-section="email-capture"');
      const contentIdx = html.indexOf('Content');
      expect(introIdx).toBeLessThan(emailIdx);
      expect(emailIdx).toBeLessThan(contentIdx);
    });
  });

  describe('EventCardGrid', () => {
    it('renders article elements for event cards', () => {
      const html = renderToString(<EventCardGrid events={[mockEvent]} />);
      expect(html).toContain('<article');
    });

    it('renders h3 for event names', () => {
      const html = renderToString(<EventCardGrid events={[mockEvent]} />);
      expect(html).toMatch(/<h3[^>]*>Songkran<\/h3>/);
    });

    it('renders h2 for section heading', () => {
      const html = renderToString(<EventCardGrid events={[mockEvent]} />);
      expect(html).toMatch(/<h2[^>]*>Events<\/h2>/);
    });

    it('renders data-section="events" attribute', () => {
      const html = renderToString(<EventCardGrid events={[mockEvent]} />);
      expect(html).toContain('data-section="events"');
    });

    it('renders Booking.com CTA for festival events', () => {
      const html = renderToString(<EventCardGrid events={[mockEvent]} />);
      expect(html).toContain('Book a stay');
      expect(html).toContain('booking.com');
    });

    it('renders GetYourGuide CTA', () => {
      const html = renderToString(<EventCardGrid events={[mockEvent]} />);
      expect(html).toContain('Find tours');
      expect(html).toContain('getyourguide.com');
    });

    it('hides Booking.com CTA for wildlife events', () => {
      const wildlifeEvent: Event = { ...mockEvent, category: 'wildlife' };
      const html = renderToString(<EventCardGrid events={[wildlifeEvent]} />);
      expect(html).not.toContain('Book a stay');
      expect(html).toContain('Find tours');
    });

    it('renders FTC disclosure', () => {
      const html = renderToString(<EventCardGrid events={[mockEvent]} />);
      expect(html).toContain('commission');
    });
  });

  describe('InternalLinks', () => {
    it('renders h2 heading', () => {
      const html = renderToString(<InternalLinks links={mockRelatedLinks} />);
      expect(html).toMatch(/<h2[^>]*>Explore More<\/h2>/);
    });

    it('renders nav element', () => {
      const html = renderToString(<InternalLinks links={mockRelatedLinks} />);
      expect(html).toContain('<nav');
      expect(html).toContain('aria-label="Related pages"');
    });

    it('renders links as list items', () => {
      const html = renderToString(<InternalLinks links={mockRelatedLinks} />);
      expect(html).toContain('<ul');
      expect(html).toContain('<li');
      expect(html).toContain('Thailand in April');
      expect(html).toContain('Festivals in Japan');
    });

    it('limits to 8 links', () => {
      const manyLinks = Array.from({ length: 12 }, (_, i) => ({
        href: `/link-${i}`,
        label: `Link ${i}`,
      }));
      const html = renderToString(<InternalLinks links={manyLinks} />);
      // Should contain links 0-7 but not 8-11
      expect(html).toContain('Link 7');
      expect(html).not.toContain('Link 8');
    });

    it('returns null when no links provided', () => {
      const html = renderToString(<InternalLinks links={[]} />);
      expect(html).toBe('');
    });
  });
});
