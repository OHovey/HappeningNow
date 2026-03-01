import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

describe('Breadcrumbs', () => {
  const threeItems = [
    { name: 'Home', href: '/' },
    { name: 'Southeast Asia', href: '/festivals/southeast-asia' },
    { name: 'Songkran Water Festival' },
  ];

  it('renders correct number of breadcrumb items', () => {
    const { container } = render(<Breadcrumbs items={threeItems} />);
    const listItems = container.querySelectorAll('ol > li');
    expect(listItems).toHaveLength(3);
  });

  it('last item is a span with aria-current, not a link', () => {
    const { container } = render(<Breadcrumbs items={threeItems} />);
    const listItems = container.querySelectorAll('ol > li');
    const lastItem = listItems[listItems.length - 1];

    const span = lastItem.querySelector('span[aria-current="page"]');
    expect(span).toBeTruthy();
    expect(span!.textContent).toBe('Songkran Water Festival');

    const link = lastItem.querySelector('a');
    expect(link).toBeNull();
  });

  it('JSON-LD script tag contains BreadcrumbList type', () => {
    const { container } = render(<Breadcrumbs items={threeItems} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();

    const json = JSON.parse(script!.textContent!);
    expect(json['@type']).toBe('BreadcrumbList');
    expect(json['@context']).toBe('https://schema.org');
  });

  it('JSON-LD contains correct number of ListItem entries', () => {
    const { container } = render(<Breadcrumbs items={threeItems} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const json = JSON.parse(script!.textContent!);

    expect(json.itemListElement).toHaveLength(3);
    expect(json.itemListElement[0].position).toBe(1);
    expect(json.itemListElement[0].name).toBe('Home');
    expect(json.itemListElement[0].item).toBe('https://happeningnow.travel/');
    expect(json.itemListElement[2].position).toBe(3);
    expect(json.itemListElement[2].name).toBe('Songkran Water Festival');
    // Last item (current page) should not have an item URL
    expect(json.itemListElement[2].item).toBeUndefined();
  });

  it('handles single-item breadcrumb (just Home)', () => {
    const singleItem = [{ name: 'Home' }];
    const { container } = render(<Breadcrumbs items={singleItem} />);

    const listItems = container.querySelectorAll('ol > li');
    expect(listItems).toHaveLength(1);

    // Single item should be current page
    const span = listItems[0].querySelector('span[aria-current="page"]');
    expect(span).toBeTruthy();
    expect(span!.textContent).toBe('Home');

    // No separators
    const separators = container.querySelectorAll('[aria-hidden="true"]');
    expect(separators).toHaveLength(0);
  });
});
