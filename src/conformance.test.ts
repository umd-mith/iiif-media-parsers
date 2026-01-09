/**
 * IIIF Cookbook Conformance Tests
 *
 * Tests parseRanges against official IIIF Cookbook example manifests
 * for time-based media (audio/video) with temporal fragments.
 *
 * @see https://iiif.io/api/cookbook/
 */

import { describe, it, expect } from 'vitest';
import { parseRanges, parseAnnotationTarget, parseMediaFragment } from './index.js';
import operaSingleCanvas from './fixtures/cookbook-0026-opera-toc.json';
import operaMultiCanvas from './fixtures/cookbook-0065-opera-multi-canvas.json';

describe('IIIF Cookbook Conformance', () => {
	describe('Recipe 0026: A/V Table of Contents (Single Canvas)', () => {
		it('should parse opera section structure with temporal fragments', () => {
			const chapters = parseRanges(operaSingleCanvas);

			expect(chapters.length).toBeGreaterThan(0);

			// All chapters should have timing from temporal fragments
			const withTiming = chapters.filter((c) => c.startTime !== undefined && c.startTime >= 0);
			expect(withTiming.length).toBeGreaterThan(0);
		});

		it('should parse temporal fragments from canvas URIs', () => {
			const chapters = parseRanges(operaSingleCanvas);

			// First scene: Preludio e Coro uses #t=0,302.05
			const firstSection = chapters.find((c) => c.startTime === 0);
			expect(firstSection).toBeDefined();
			expect(firstSection?.endTime).toBeCloseTo(302.05, 1);
		});

		it('should resolve open-ended temporal fragments from canvas duration', () => {
			const chapters = parseRanges(operaSingleCanvas);

			// "Atto Secondo" uses #t=3971.24 (no end time)
			// End time is resolved from canvas duration (7278.422)
			const actTwo = chapters.find((c) => c.label.toLowerCase().includes('atto secondo'));
			expect(actTwo).toBeDefined();
			expect(actTwo?.startTime).toBeCloseTo(3971.24, 1);
			expect(actTwo?.endTime).toBeCloseTo(7278.422, 1); // Canvas duration
		});

		it('should preserve Italian labels from manifest', () => {
			const chapters = parseRanges(operaSingleCanvas);
			const labels = chapters.map((c) => c.label);

			// Should extract Italian labels
			expect(labels.some((l) => l.includes('Atto'))).toBe(true);
		});
	});

	describe('Recipe 0065: A/V Table of Contents (Multiple Canvases)', () => {
		it('should parse chapters across multiple canvases', () => {
			const chapters = parseRanges(operaMultiCanvas);

			expect(chapters.length).toBeGreaterThan(0);

			// Should have chapters from different canvases
			const uniqueIds = new Set(chapters.map((c) => c.id));
			expect(uniqueIds.size).toBeGreaterThan(1);
		});

		it('should handle temporal fragments on different canvases', () => {
			const chapters = parseRanges(operaMultiCanvas);

			// Act I is on canvas 1, Act II on canvas 2
			// Both should have valid timing
			chapters.forEach((chapter) => {
				expect(chapter.startTime).toBeGreaterThanOrEqual(0);
			});
		});
	});

	describe('W3C Media Fragment URI Conformance', () => {
		it('should parse temporal fragment with start and end', () => {
			const result = parseMediaFragment(
				'https://iiif.io/api/cookbook/recipe/0026-toc-opera/canvas/1#t=0,302.05'
			);

			expect(result?.temporal?.start).toBe(0);
			expect(result?.temporal?.end).toBeCloseTo(302.05, 2);
		});

		it('should parse open-ended temporal fragment', () => {
			const result = parseMediaFragment(
				'https://iiif.io/api/cookbook/recipe/0026-toc-opera/canvas/1#t=3971.24'
			);

			expect(result?.temporal?.start).toBeCloseTo(3971.24, 2);
			expect(result?.temporal?.end).toBeUndefined();
		});

		it('should parse temporal fragment starting from 0', () => {
			const result = parseMediaFragment('https://example.org/canvas#t=,20');

			expect(result?.temporal?.start).toBe(0);
			expect(result?.temporal?.end).toBe(20);
		});

		it('should parse spatial fragment (xywh)', () => {
			const result = parseMediaFragment('https://example.org/canvas#xywh=100,200,300,400');

			expect(result?.spatial).toEqual({
				x: 100,
				y: 200,
				width: 300,
				height: 400,
				unit: 'pixel'
			});
		});

		it('should parse spatial fragment with percent unit', () => {
			const result = parseMediaFragment('https://example.org/canvas#xywh=percent:10,20,30,40');

			expect(result?.spatial?.unit).toBe('percent');
		});
	});

	describe('Annotation Target Parsing', () => {
		it('should parse string URI target with temporal fragment', () => {
			const result = parseAnnotationTarget(
				'https://iiif.io/api/cookbook/recipe/0026-toc-opera/canvas/1#t=0,302.05'
			);

			expect(result?.source).toBe('https://iiif.io/api/cookbook/recipe/0026-toc-opera/canvas/1');
			expect(result?.temporal?.start).toBe(0);
			expect(result?.temporal?.end).toBeCloseTo(302.05, 2);
		});

		it('should parse SpecificResource with FragmentSelector', () => {
			const result = parseAnnotationTarget({
				type: 'SpecificResource',
				source: 'https://example.org/canvas/1',
				selector: {
					type: 'FragmentSelector',
					value: 't=10,20'
				}
			});

			expect(result?.source).toBe('https://example.org/canvas/1');
			expect(result?.temporal?.start).toBe(10);
			expect(result?.temporal?.end).toBe(20);
		});

		it('should parse SpecificResource with source object', () => {
			const result = parseAnnotationTarget({
				type: 'SpecificResource',
				source: {
					id: 'https://example.org/canvas/1',
					type: 'Canvas'
				},
				selector: {
					type: 'FragmentSelector',
					value: 't=10,20'
				}
			});

			expect(result?.source).toBe('https://example.org/canvas/1');
			expect(result?.temporal?.start).toBe(10);
		});
	});
});
