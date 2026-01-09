/**
 * Export verification tests
 *
 * Verifies that all expected types and functions are correctly exported
 * and usable by consumers of the package.
 */
import { describe, test, expect } from 'vitest';

// Import all expected exports
import {
	// Types
	type Chapter,
	type SpeakerSegment,
	type TemporalFragment,
	type SpatialFragment,
	type ParsedAnnotationTarget,
	type AnnotationTargetInput,
	type IIIFResourceType,
	// Functions
	parseRanges,
	parseSpeakers,
	parseAnnotationTarget,
	parseMediaFragment
} from './index.js';

describe('Public API exports', () => {
	describe('Type exports', () => {
		test('Chapter type is usable', () => {
			const chapter: Chapter = {
				id: 'ch1',
				label: 'Introduction',
				startTime: 0,
				endTime: 30
			};
			expect(chapter.id).toBe('ch1');
		});

		test('SpeakerSegment type is usable', () => {
			const segment: SpeakerSegment = {
				speaker: 'Narrator',
				startTime: 0,
				endTime: 60
			};
			expect(segment.speaker).toBe('Narrator');
		});

		test('TemporalFragment type is usable', () => {
			const temporal: TemporalFragment = {
				start: 10,
				end: 20
			};
			expect(temporal.start).toBe(10);
		});

		test('SpatialFragment type is usable', () => {
			const spatial: SpatialFragment = {
				x: 100,
				y: 200,
				width: 50,
				height: 75,
				unit: 'pixel'
			};
			expect(spatial.unit).toBe('pixel');
		});

		test('ParsedAnnotationTarget type is usable', () => {
			const target: ParsedAnnotationTarget = {
				source: 'https://example.org/canvas',
				temporal: { start: 10, end: 20 }
			};
			expect(target.source).toBe('https://example.org/canvas');
		});

		test('AnnotationTargetInput type accepts string', () => {
			const input: AnnotationTargetInput = 'https://example.org/canvas#t=10,20';
			expect(typeof input).toBe('string');
		});

		test('AnnotationTargetInput type accepts SpecificResource', () => {
			const input: AnnotationTargetInput = {
				type: 'SpecificResource',
				source: 'https://example.org/canvas',
				selector: { type: 'FragmentSelector', value: 't=10,20' }
			};
			expect(input.type).toBe('SpecificResource');
		});

		test('IIIFResourceType restricts to valid IIIF types', () => {
			const types: IIIFResourceType[] = ['Canvas', 'Image', 'Sound', 'Video'];
			expect(types).toHaveLength(4);
			// TypeScript ensures only valid literals are assignable
			const canvas: IIIFResourceType = 'Canvas';
			expect(canvas).toBe('Canvas');
		});
	});

	describe('Function exports', () => {
		test('parseRanges is exported and callable', () => {
			expect(typeof parseRanges).toBe('function');
		});

		test('parseSpeakers is exported and callable', () => {
			expect(typeof parseSpeakers).toBe('function');
		});

		test('parseAnnotationTarget is exported and callable', () => {
			expect(typeof parseAnnotationTarget).toBe('function');
		});

		test('parseMediaFragment is exported and callable', () => {
			expect(typeof parseMediaFragment).toBe('function');
		});
	});

	describe('Type consistency', () => {
		test('parseAnnotationTarget returns ParsedAnnotationTarget', () => {
			const result = parseAnnotationTarget('https://example.org/canvas#t=10,20');

			// TypeScript ensures this is ParsedAnnotationTarget | null
			if (result) {
				const target: ParsedAnnotationTarget = result;
				expect(target.source).toBe('https://example.org/canvas');
				expect(target.temporal?.start).toBe(10);
			}
		});

		test('parseMediaFragment returns ParsedAnnotationTarget', () => {
			const result = parseMediaFragment('https://example.org/canvas#t=10,20');

			// TypeScript ensures this is ParsedAnnotationTarget
			const target: ParsedAnnotationTarget = result;
			expect(target.source).toBe('https://example.org/canvas');
		});

		test('AnnotationTargetInput works with parseAnnotationTarget', () => {
			// String input
			const stringInput: AnnotationTargetInput = 'https://example.org/canvas#t=5';
			const result1 = parseAnnotationTarget(stringInput);
			expect(result1?.temporal?.start).toBe(5);

			// SpecificResource input
			const objectInput: AnnotationTargetInput = {
				type: 'SpecificResource',
				source: { id: 'https://example.org/canvas' },
				selector: { type: 'FragmentSelector', value: 't=15,25' }
			};
			const result2 = parseAnnotationTarget(objectInput);
			expect(result2?.temporal?.start).toBe(15);
		});
	});
});
