import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/dynamic to render children directly
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    // Return a placeholder component for the dynamically loaded module
    const Component = (props: Record<string, unknown>) => (
      <div data-testid="search-map" {...props} />
    );
    Component.displayName = 'DynamicComponent';
    return Component;
  },
}));

// Mock maplibre-gl
vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn(),
    Marker: vi.fn(),
    NavigationControl: vi.fn(),
    LngLatBounds: vi.fn(),
  },
}));

import SearchPage from '@/components/search/SearchPage';

describe('SearchPage', () => {
  it('renders search form with location input', () => {
    render(<SearchPage />);
    const locationInput = screen.getByPlaceholderText('Where are you going?');
    expect(locationInput).toBeDefined();
  });

  it('renders date selects (from and to)', () => {
    render(<SearchPage />);
    const fromSelect = screen.getByLabelText('From');
    const toSelect = screen.getByLabelText('To');
    expect(fromSelect).toBeDefined();
    expect(toSelect).toBeDefined();
  });

  it('renders category select', () => {
    render(<SearchPage />);
    const categorySelect = screen.getByLabelText('Category');
    expect(categorySelect).toBeDefined();
  });

  it('renders distance select', () => {
    render(<SearchPage />);
    const distanceSelect = screen.getByLabelText('Distance');
    expect(distanceSelect).toBeDefined();
  });

  it('does not render a search button (auto-search)', () => {
    render(<SearchPage />);
    const buttons = screen.queryAllByRole('button');
    const searchButton = buttons.find(
      (b) => b.textContent?.toLowerCase().includes('search'),
    );
    expect(searchButton).toBeUndefined();
  });

  it('shows empty state message when no location selected', () => {
    render(<SearchPage />);
    expect(
      screen.getByText('Search for events by entering a location above'),
    ).toBeDefined();
  });
});
