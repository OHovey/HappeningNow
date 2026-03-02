import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ResultCard from '@/components/search/ResultCard';
import type { SearchEventResult } from '@/lib/supabase/types';

afterEach(() => cleanup());

const baseEvent: SearchEventResult & { _score: number } = {
  id: 'evt-1',
  name: 'Northern Lights Festival',
  slug: 'northern-lights-festival',
  category: 'festival',
  description: 'An amazing festival under the northern lights.',
  image_url: null,
  start_month: 1,
  end_month: 3,
  lng: 18.95,
  lat: 69.65,
  country: 'Norway',
  region: 'Troms',
  scale: 9,
  crowd_level: 'quiet',
  booking_destination_id: 'dest-123',
  getyourguide_location_id: 'gyg-456',
  distance_meters: 150_000,
  _score: 42,
};

describe('ResultCard', () => {
  it('renders event name and country', () => {
    render(<ResultCard event={baseEvent} isSelected={false} onClick={vi.fn()} />);
    expect(screen.getByText('Northern Lights Festival')).toBeDefined();
    expect(screen.getByText('Norway')).toBeDefined();
  });

  it('renders indicator tags', () => {
    render(<ResultCard event={baseEvent} isSelected={false} onClick={vi.fn()} />);
    // scale=9 => Highly Unique, crowd_level=quiet => Low Crowds
    expect(screen.getByText('Highly Unique')).toBeDefined();
    expect(screen.getByText('Low Crowds')).toBeDefined();
  });

  it('shows affiliate links for events with booking_destination_id', () => {
    render(<ResultCard event={baseEvent} isSelected={false} onClick={vi.fn()} />);
    const bookingLink = screen.getByText('Booking.com');
    expect(bookingLink).toBeDefined();
    expect(bookingLink.tagName).toBe('A');
    expect(bookingLink.getAttribute('href')).toContain('booking.com');
  });

  it('shows GetYourGuide link', () => {
    render(<ResultCard event={baseEvent} isSelected={false} onClick={vi.fn()} />);
    const gygLink = screen.getByText('GetYourGuide');
    expect(gygLink).toBeDefined();
    expect(gygLink.getAttribute('href')).toContain('getyourguide.com');
  });

  it('hides Booking.com link when no booking_destination_id', () => {
    const event = { ...baseEvent, booking_destination_id: null };
    render(<ResultCard event={event} isSelected={false} onClick={vi.fn()} />);
    expect(screen.queryByText('Booking.com')).toBeNull();
  });

  it('selected card has highlight ring class', () => {
    const { container } = render(
      <ResultCard event={baseEvent} isSelected={true} onClick={vi.fn()} />,
    );
    const card = container.firstElementChild;
    expect(card?.className).toContain('ring-2');
    expect(card?.className).toContain('ring-blue-500');
  });

  it('unselected card does not have ring class', () => {
    const { container } = render(
      <ResultCard event={baseEvent} isSelected={false} onClick={vi.fn()} />,
    );
    const card = container.firstElementChild;
    expect(card?.className).not.toContain('ring-2');
  });
});
