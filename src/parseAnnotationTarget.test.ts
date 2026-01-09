/**
 * Tests for IIIF Annotation Target Parsing
 *
 * W3C Media Fragments URI specification compliance:
 * @see https://www.w3.org/TR/media-frags/
 */

import { describe, it, expect } from 'vitest';
import { parseMediaFragment, parseAnnotationTarget } from './parseAnnotationTarget.js';

describe('parseMediaFragment', () => {
	describe('temporal fragments (#t=)', () => {
		it('should parse start and end times: #t=10,20', () => {
			const result = parseMediaFragment('https://example.org/canvas#t=10,20');

			expect(result.source).toBe('https://example.org/canvas');
			expect(result.temporal).toEqual({ start: 10, end: 20 });
			expect(result.spatial).toBeUndefined();
		});

		it('should parse start time only: #t=10', () => {
			const result = parseMediaFragment('https://example.org/canvas#t=10');

			expect(result.source).toBe('https://example.org/canvas');
			expect(result.temporal).toEqual({ start: 10, end: undefined });
		});

		it('should parse from-start pattern: #t=,20', () => {
			const result = parseMediaFragment('https://example.org/canvas#t=,20');

			expect(result.source).toBe('https://example.org/canvas');
			expect(result.temporal).toEqual({ start: 0, end: 20 });
		});

		it('should parse floating point times: #t=10.5,25.75', () => {
			const result = parseMediaFragment('https://example.org/canvas#t=10.5,25.75');

			expect(result.source).toBe('https://example.org/canvas');
			expect(result.temporal).toEqual({ start: 10.5, end: 25.75 });
		});

		it('should handle zero start time: #t=0,30', () => {
			const result = parseMediaFragment('https://example.org/canvas#t=0,30');

			expect(result.temporal).toEqual({ start: 0, end: 30 });
		});

		it('should return undefined temporal for invalid fragment: #t=invalid', () => {
			const result = parseMediaFragment('https://example.org/canvas#t=invalid');

			expect(result.source).toBe('https://example.org/canvas');
			expect(result.temporal).toBeUndefined();
		});

		it('should reject negative start time: #t=-5,20', () => {
			const result = parseMediaFragment('https://example.org/canvas#t=-5,20');

			expect(result.source).toBe('https://example.org/canvas');
			expect(result.temporal).toBeUndefined();
		});

		it('should ignore malformed end time: #t=5,-20 parses as #t=5', () => {
			// Regex [0-9.]* doesn't match '-20', so end captures empty string
			const result = parseMediaFragment('https://example.org/canvas#t=5,-20');

			expect(result.source).toBe('https://example.org/canvas');
			expect(result.temporal).toEqual({ start: 5, end: undefined });
		});

		it('should handle URI without fragment', () => {
			const result = parseMediaFragment('https://example.org/canvas');

			expect(result.source).toBe('https://example.org/canvas');
			expect(result.temporal).toBeUndefined();
			expect(result.spatial).toBeUndefined();
		});

		it('should handle URI with empty fragment', () => {
			const result = parseMediaFragment('https://example.org/canvas#');

			expect(result.source).toBe('https://example.org/canvas');
			expect(result.temporal).toBeUndefined();
		});
	});

	describe('spatial fragments (#xywh=)', () => {
		it('should parse pixel coordinates: #xywh=100,200,50,75', () => {
			const result = parseMediaFragment('https://example.org/canvas#xywh=100,200,50,75');

			expect(result.source).toBe('https://example.org/canvas');
			expect(result.spatial).toEqual({
				x: 100,
				y: 200,
				width: 50,
				height: 75,
				unit: 'pixel'
			});
			expect(result.temporal).toBeUndefined();
		});

		it('should parse percent coordinates: #xywh=percent:10,20,30,40', () => {
			const result = parseMediaFragment('https://example.org/canvas#xywh=percent:10,20,30,40');

			expect(result.spatial).toEqual({
				x: 10,
				y: 20,
				width: 30,
				height: 40,
				unit: 'percent'
			});
		});

		it('should parse floating point coordinates', () => {
			const result = parseMediaFragment('https://example.org/canvas#xywh=10.5,20.5,30.5,40.5');

			expect(result.spatial).toEqual({
				x: 10.5,
				y: 20.5,
				width: 30.5,
				height: 40.5,
				unit: 'pixel'
			});
		});

		it('should return undefined spatial for incomplete fragment: #xywh=100,200', () => {
			const result = parseMediaFragment('https://example.org/canvas#xywh=100,200');

			expect(result.source).toBe('https://example.org/canvas');
			expect(result.spatial).toBeUndefined();
		});

		it('should return undefined spatial for invalid values: #xywh=a,b,c,d', () => {
			const result = parseMediaFragment('https://example.org/canvas#xywh=a,b,c,d');

			expect(result.spatial).toBeUndefined();
		});
	});

	describe('combined fragments', () => {
		it('should parse both temporal and spatial: #t=10,20&xywh=100,200,50,75', () => {
			const result = parseMediaFragment('https://example.org/canvas#t=10,20&xywh=100,200,50,75');

			expect(result.source).toBe('https://example.org/canvas');
			expect(result.temporal).toEqual({ start: 10, end: 20 });
			expect(result.spatial).toEqual({
				x: 100,
				y: 200,
				width: 50,
				height: 75,
				unit: 'pixel'
			});
		});

		it('should parse both in reverse order: #xywh=100,200,50,75&t=10,20', () => {
			const result = parseMediaFragment('https://example.org/canvas#xywh=100,200,50,75&t=10,20');

			expect(result.temporal).toEqual({ start: 10, end: 20 });
			expect(result.spatial).toEqual({
				x: 100,
				y: 200,
				width: 50,
				height: 75,
				unit: 'pixel'
			});
		});
	});
});

describe('parseAnnotationTarget', () => {
	describe('string targets', () => {
		it('should parse string target with temporal fragment', () => {
			const result = parseAnnotationTarget('https://example.org/canvas/1#t=10,20');

			expect(result).toEqual({
				source: 'https://example.org/canvas/1',
				temporal: { start: 10, end: 20 }
			});
		});

		it('should parse string target without fragment', () => {
			const result = parseAnnotationTarget('https://example.org/canvas/1');

			expect(result).toEqual({
				source: 'https://example.org/canvas/1'
			});
		});

		it('should parse string target with spatial fragment', () => {
			const result = parseAnnotationTarget('https://example.org/canvas/1#xywh=100,200,50,75');

			expect(result).toEqual({
				source: 'https://example.org/canvas/1',
				spatial: { x: 100, y: 200, width: 50, height: 75, unit: 'pixel' }
			});
		});
	});

	describe('SpecificResource targets with FragmentSelector', () => {
		it('should parse SpecificResource with temporal FragmentSelector', () => {
			const target = {
				type: 'SpecificResource' as const,
				source: 'https://example.org/canvas/1',
				selector: {
					type: 'FragmentSelector',
					conformsTo: 'http://www.w3.org/TR/media-frags/',
					value: 't=10,20'
				}
			};

			const result = parseAnnotationTarget(target);

			expect(result).toEqual({
				source: 'https://example.org/canvas/1',
				temporal: { start: 10, end: 20 }
			});
		});

		it('should parse SpecificResource with spatial FragmentSelector', () => {
			const target = {
				type: 'SpecificResource' as const,
				source: 'https://example.org/canvas/1',
				selector: {
					type: 'FragmentSelector',
					conformsTo: 'http://www.w3.org/TR/media-frags/',
					value: 'xywh=100,200,50,75'
				}
			};

			const result = parseAnnotationTarget(target);

			expect(result).toEqual({
				source: 'https://example.org/canvas/1',
				spatial: { x: 100, y: 200, width: 50, height: 75, unit: 'pixel' }
			});
		});

		it('should handle SpecificResource without conformsTo', () => {
			const target = {
				type: 'SpecificResource' as const,
				source: 'https://example.org/canvas/1',
				selector: {
					type: 'FragmentSelector',
					value: 't=5,15'
				}
			};

			const result = parseAnnotationTarget(target);

			expect(result).toEqual({
				source: 'https://example.org/canvas/1',
				temporal: { start: 5, end: 15 }
			});
		});

		it('should handle SpecificResource with object source', () => {
			const target = {
				type: 'SpecificResource' as const,
				source: {
					id: 'https://example.org/canvas/1',
					type: 'Canvas'
				},
				selector: {
					type: 'FragmentSelector',
					value: 't=10,20'
				}
			};

			const result = parseAnnotationTarget(target);

			expect(result?.source).toBe('https://example.org/canvas/1');
			expect(result?.temporal).toEqual({ start: 10, end: 20 });
		});

		it('should return source only for SpecificResource without selector', () => {
			const target = {
				type: 'SpecificResource' as const,
				source: 'https://example.org/canvas/1'
			};

			const result = parseAnnotationTarget(target);

			expect(result).toEqual({
				source: 'https://example.org/canvas/1'
			});
		});

		it('should return source for non-FragmentSelector', () => {
			const target = {
				type: 'SpecificResource' as const,
				source: 'https://example.org/canvas/1',
				selector: {
					type: 'PointSelector',
					x: 100,
					y: 200
				}
			};

			const result = parseAnnotationTarget(target);

			expect(result).toEqual({
				source: 'https://example.org/canvas/1'
			});
		});
	});

	describe('edge cases', () => {
		it('should return null for null input', () => {
			const result = parseAnnotationTarget(null as unknown as string);

			expect(result).toBeNull();
		});

		it('should return null for undefined input', () => {
			const result = parseAnnotationTarget(undefined as unknown as string);

			expect(result).toBeNull();
		});

		it('should return null for empty string', () => {
			const result = parseAnnotationTarget('');

			expect(result).toBeNull();
		});

		it('should return null for object without type', () => {
			const result = parseAnnotationTarget({ source: 'test' } as unknown as string);

			expect(result).toBeNull();
		});
	});
});
