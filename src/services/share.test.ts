import { describe, it, expect } from 'vitest';
import { generateShareText, getStarRating } from './share';

describe('Share Service', () => {
  describe('getStarRating', () => {
    it('returns 1 star for waves 1-3', () => {
      expect(getStarRating(1)).toBe(1);
      expect(getStarRating(2)).toBe(1);
      expect(getStarRating(3)).toBe(1);
    });

    it('returns 2 stars for waves 4-6', () => {
      expect(getStarRating(4)).toBe(2);
      expect(getStarRating(5)).toBe(2);
      expect(getStarRating(6)).toBe(2);
    });

    it('returns 3 stars for waves 7-9', () => {
      expect(getStarRating(7)).toBe(3);
      expect(getStarRating(8)).toBe(3);
      expect(getStarRating(9)).toBe(3);
    });

    it('returns 4 stars for waves 10-14', () => {
      expect(getStarRating(10)).toBe(4);
      expect(getStarRating(12)).toBe(4);
      expect(getStarRating(14)).toBe(4);
    });

    it('returns 5 stars for wave 15+', () => {
      expect(getStarRating(15)).toBe(5);
      expect(getStarRating(20)).toBe(5);
      expect(getStarRating(100)).toBe(5);
    });
  });

  describe('generateShareText', () => {
    it('includes score with comma formatting', () => {
      const text = generateShareText(12345, 5, 75, 'classic');
      expect(text).toContain('12,345');
    });

    it('includes wave number', () => {
      const text = generateShareText(1000, 7, 80, 'classic');
      expect(text).toContain('Wave: 7');
    });

    it('includes accuracy percentage', () => {
      const text = generateShareText(1000, 3, 85, 'classic');
      expect(text).toContain('85%');
    });

    it('includes star rating based on wave', () => {
      const text = generateShareText(1000, 7, 80, 'classic');
      // Wave 7 = 3 stars
      expect(text).toContain('\u2605\u2605\u2605');
    });

    it('includes empty stars for remaining', () => {
      const text = generateShareText(1000, 1, 50, 'classic');
      // Wave 1 = 1 star, 4 empty
      expect(text).toContain('\u2605\u2606\u2606\u2606\u2606');
    });

    it('includes game title header', () => {
      const text = generateShareText(1000, 1, 50, 'classic');
      expect(text).toContain('SPACE INVADERS');
    });

    it('includes rank tier name', () => {
      const text = generateShareText(1000, 5, 50, 'classic');
      expect(text).toContain('Rank:');
    });

    it('formats score with comma separators', () => {
      const text = generateShareText(1000000, 15, 90, 'classic');
      expect(text).toContain('1,000,000');
    });

    it('handles zero accuracy', () => {
      const text = generateShareText(0, 1, 0, 'classic');
      expect(text).toContain('0%');
    });
  });
});
