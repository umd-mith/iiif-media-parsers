/**
 * Tests for the docs build utilities
 *
 * These functions support the GitHub Pages showcase site by
 * transforming raw parser output into display-ready formats.
 */

import { describe, test, expect } from 'vitest';
import { formatTimestamp, processFixture } from './buildDocs.js';
import { parseRanges } from './parseRanges.js';

describe('formatTimestamp', () => {
	test('formats zero seconds', () => {
		expect(formatTimestamp(0)).toBe('0:00');
	});

	test('formats seconds under a minute', () => {
		expect(formatTimestamp(45)).toBe('0:45');
	});

	test('formats exact minutes', () => {
		expect(formatTimestamp(120)).toBe('2:00');
	});

	test('formats minutes and seconds', () => {
		expect(formatTimestamp(90)).toBe('1:30');
	});

	test('formats hours', () => {
		expect(formatTimestamp(3661)).toBe('1:01:01');
	});

	test('preserves fractional seconds from float timestamps', () => {
		expect(formatTimestamp(3971.24)).toBe('1:06:11.24');
	});

	test('formats float seconds under a minute', () => {
		expect(formatTimestamp(5.5)).toBe('0:05.5');
	});

	test('pads single-digit seconds', () => {
		expect(formatTimestamp(61)).toBe('1:01');
	});

	test('pads single-digit minutes when hours present', () => {
		expect(formatTimestamp(3605)).toBe('1:00:05');
	});

	test('handles large durations', () => {
		expect(formatTimestamp(7278.422)).toBe('2:01:18.422');
	});
});

describe('processFixture', () => {
	test('transforms parsed chapters into display objects with formatted timestamps', () => {
		const manifest = {
			'@context': 'http://iiif.io/api/presentation/3/context.json',
			id: 'https://example.org/manifest',
			type: 'Manifest' as const,
			items: [
				{
					id: 'https://example.org/canvas/1',
					type: 'Canvas' as const,
					duration: 300
				}
			],
			structures: [
				{
					type: 'Range' as const,
					id: 'https://example.org/range/1',
					label: { en: ['Chapter One'] },
					items: [
						{
							type: 'Canvas' as const,
							id: 'https://example.org/canvas/1#t=0,120'
						}
					]
				},
				{
					type: 'Range' as const,
					id: 'https://example.org/range/2',
					label: { en: ['Chapter Two'] },
					items: [
						{
							type: 'Canvas' as const,
							id: 'https://example.org/canvas/1#t=120,300'
						}
					]
				}
			]
		};

		const chapters = parseRanges(manifest);
		const result = processFixture(chapters);

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			label: 'Chapter One',
			startTime: '0:00',
			endTime: '2:00',
			id: 'https://example.org/range/1'
		});
		expect(result[1]).toEqual({
			label: 'Chapter Two',
			startTime: '2:00',
			endTime: '5:00',
			id: 'https://example.org/range/2'
		});
	});

	test('handles chapters with fractional timestamps', () => {
		const manifest = {
			'@context': 'http://iiif.io/api/presentation/3/context.json',
			id: 'https://example.org/manifest',
			type: 'Manifest' as const,
			items: [
				{
					id: 'https://example.org/canvas/1',
					type: 'Canvas' as const,
					duration: 100
				}
			],
			structures: [
				{
					type: 'Range' as const,
					id: 'https://example.org/range/1',
					label: { en: ['Intro'] },
					items: [
						{
							type: 'Canvas' as const,
							id: 'https://example.org/canvas/1#t=0,65.75'
						}
					]
				}
			]
		};

		const chapters = parseRanges(manifest);
		const result = processFixture(chapters);

		expect(result).toHaveLength(1);
		expect(result[0]?.startTime).toBe('0:00');
		expect(result[0]?.endTime).toBe('1:05.75');
	});

	test('returns empty array for empty chapters', () => {
		expect(processFixture([])).toEqual([]);
	});
});
