import { describe, it, expect } from 'vitest';
import { worthTheTripScore, estimateTravelTime, getIndicatorTags } from '@/lib/scoring';

describe('worthTheTripScore', () => {
  it('ranks unique distant event above generic nearby one', () => {
    const uniqueFar = worthTheTripScore({ scale: 9, crowd_level: 'moderate', distance_meters: 500_000 });
    const genericNear = worthTheTripScore({ scale: 3, crowd_level: 'moderate', distance_meters: 50_000 });
    expect(uniqueFar).toBeGreaterThan(genericNear);
  });

  it('gives higher score for quiet crowd than busy crowd at same distance/scale', () => {
    const quiet = worthTheTripScore({ scale: 7, crowd_level: 'quiet', distance_meters: 100_000 });
    const busy = worthTheTripScore({ scale: 7, crowd_level: 'busy', distance_meters: 100_000 });
    expect(quiet).toBeGreaterThan(busy);
  });

  it('defaults null crowd_level to moderate', () => {
    const nullCrowd = worthTheTripScore({ scale: 5, crowd_level: null, distance_meters: 50_000 });
    const moderate = worthTheTripScore({ scale: 5, crowd_level: 'moderate', distance_meters: 50_000 });
    expect(nullCrowd).toBe(moderate);
  });

  it('returns a positive number', () => {
    const score = worthTheTripScore({ scale: 5, crowd_level: 'moderate', distance_meters: 10_000 });
    expect(score).toBeGreaterThan(0);
  });
});

describe('estimateTravelTime', () => {
  it('returns minutes for short distances', () => {
    // 30km at 60km/h = 30 minutes
    expect(estimateTravelTime(30_000)).toBe('30min drive');
  });

  it('returns hours for longer distances', () => {
    // 120km at 60km/h = 2.0 hours
    expect(estimateTravelTime(120_000)).toBe('2.0h drive');
  });

  it('returns fractional hours correctly', () => {
    // 90km at 60km/h = 1.5 hours
    expect(estimateTravelTime(90_000)).toBe('1.5h drive');
  });
});

describe('getIndicatorTags', () => {
  it('includes "Highly Unique" for scale >= 8', () => {
    const tags = getIndicatorTags({ scale: 9, crowd_level: 'moderate', distance_meters: 100_000 });
    expect(tags).toContain('Highly Unique');
    expect(tags).not.toContain('Unique');
  });

  it('includes "Unique" for scale >= 6 but < 8', () => {
    const tags = getIndicatorTags({ scale: 7, crowd_level: 'moderate', distance_meters: 100_000 });
    expect(tags).toContain('Unique');
    expect(tags).not.toContain('Highly Unique');
  });

  it('has no uniqueness tag for scale < 6', () => {
    const tags = getIndicatorTags({ scale: 4, crowd_level: 'moderate', distance_meters: 100_000 });
    expect(tags).not.toContain('Unique');
    expect(tags).not.toContain('Highly Unique');
  });

  it('includes "Low Crowds" for quiet events', () => {
    const tags = getIndicatorTags({ scale: 5, crowd_level: 'quiet', distance_meters: 50_000 });
    expect(tags).toContain('Low Crowds');
  });

  it('does not include "Low Crowds" for non-quiet events', () => {
    const tags = getIndicatorTags({ scale: 5, crowd_level: 'busy', distance_meters: 50_000 });
    expect(tags).not.toContain('Low Crowds');
  });

  it('always includes travel time estimate', () => {
    const tags = getIndicatorTags({ scale: 5, crowd_level: 'moderate', distance_meters: 60_000 });
    expect(tags).toContain('1.0h drive');
  });
});
