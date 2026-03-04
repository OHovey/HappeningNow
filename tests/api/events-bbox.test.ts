import { describe, it, expect } from 'vitest';
import { bboxQuerySchema } from '@/app/api/events/route';

describe('bboxQuerySchema', () => {
  describe('bbox parameter', () => {
    it('parses valid bbox with 4 numbers', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '-180,-90,180,90' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bbox).toEqual({
          min_lng: -180,
          min_lat: -90,
          max_lng: 180,
          max_lat: 90,
        });
      }
    });

    it('parses bbox with decimal coordinates', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '100.5,10.2,110.7,20.8' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bbox.min_lng).toBeCloseTo(100.5);
        expect(result.data.bbox.min_lat).toBeCloseTo(10.2);
      }
    });

    it('rejects missing bbox', () => {
      const result = bboxQuerySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects non-numeric bbox values', () => {
      const result = bboxQuerySchema.safeParse({ bbox: 'a,b,c,d' });
      expect(result.success).toBe(false);
    });

    it('rejects bbox with fewer than 4 numbers', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '1,2,3' });
      expect(result.success).toBe(false);
    });

    it('rejects bbox with more than 4 numbers', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '1,2,3,4,5' });
      expect(result.success).toBe(false);
    });

    it('rejects empty string bbox', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('month parameter', () => {
    it('accepts valid month 1-12', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '0,0,1,1', month: '6' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.month).toBe(6);
      }
    });

    it('accepts month as number', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '0,0,1,1', month: 12 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.month).toBe(12);
      }
    });

    it('rejects month 0', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '0,0,1,1', month: '0' });
      expect(result.success).toBe(false);
    });

    it('rejects month 13', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '0,0,1,1', month: '13' });
      expect(result.success).toBe(false);
    });

    it('is optional', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '0,0,1,1' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.month).toBeUndefined();
      }
    });
  });

  describe('category parameter', () => {
    it('accepts "festival"', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '0,0,1,1', category: 'festival' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('festival');
      }
    });

    it('accepts "wildlife"', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '0,0,1,1', category: 'wildlife' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('wildlife');
      }
    });

    it('accepts "concert"', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '0,0,1,1', category: 'concert' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('concert');
      }
    });

    it('accepts "sport"', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '0,0,1,1', category: 'sport' });
      expect(result.success).toBe(true);
    });

    it('accepts "arts"', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '0,0,1,1', category: 'arts' });
      expect(result.success).toBe(true);
    });

    it('accepts "event"', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '0,0,1,1', category: 'event' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid category', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '0,0,1,1', category: 'music' });
      expect(result.success).toBe(false);
    });

    it('is optional', () => {
      const result = bboxQuerySchema.safeParse({ bbox: '0,0,1,1' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBeUndefined();
      }
    });
  });

  describe('combined parameters', () => {
    it('parses all parameters together', () => {
      const result = bboxQuerySchema.safeParse({
        bbox: '-10.5,40.2,5.8,50.1',
        month: '3',
        category: 'festival',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bbox.min_lng).toBeCloseTo(-10.5);
        expect(result.data.month).toBe(3);
        expect(result.data.category).toBe('festival');
      }
    });
  });
});
