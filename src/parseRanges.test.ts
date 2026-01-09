/**
 * Tests for IIIF Range Structure Parser
 *
 * @see https://iiif.io/api/presentation/3.0/#range
 */

import { describe, it, expect } from 'vitest';
import { parseRanges } from './parseRanges.js';

describe('parseRanges', () => {
	describe('basic Range parsing', () => {
		it('should parse a simple Range with one temporal fragment', () => {
			const manifest = {
				'@context': 'http://iiif.io/api/presentation/3/context.json',
				id: 'https://example.org/manifest.json',
				type: 'Manifest',
				label: { en: ['Test Manifest'] },
				items: [
					{
						id: 'https://example.org/canvas/1',
						type: 'Canvas',
						duration: 300
					}
				],
				structures: [
					{
						id: 'https://example.org/range/1',
						type: 'Range',
						label: { en: ['Introduction'] },
						items: [
							{
								id: 'https://example.org/canvas/1#t=0,30',
								type: 'Canvas'
							}
						]
					}
				]
			};

			const chapters = parseRanges(manifest);

			expect(chapters).toHaveLength(1);
			expect(chapters[0]).toEqual({
				id: 'https://example.org/range/1',
				label: 'Introduction',
				startTime: 0,
				endTime: 30,
				thumbnail: undefined,
				metadata: undefined
			});
		});

		it('should parse multiple Ranges with temporal fragments', () => {
			const manifest = {
				'@context': 'http://iiif.io/api/presentation/3/context.json',
				id: 'https://example.org/manifest.json',
				type: 'Manifest',
				label: { en: ['Test Manifest'] },
				items: [
					{
						id: 'https://example.org/canvas/1',
						type: 'Canvas',
						duration: 300
					}
				],
				structures: [
					{
						id: 'https://example.org/range/1',
						type: 'Range',
						label: { en: ['Chapter 1'] },
						items: [
							{
								id: 'https://example.org/canvas/1#t=0,60',
								type: 'Canvas'
							}
						]
					},
					{
						id: 'https://example.org/range/2',
						type: 'Range',
						label: { en: ['Chapter 2'] },
						items: [
							{
								id: 'https://example.org/canvas/1#t=60,120',
								type: 'Canvas'
							}
						]
					}
				]
			};

			const chapters = parseRanges(manifest);

			expect(chapters).toHaveLength(2);
			expect(chapters[0]?.label).toBe('Chapter 1');
			expect(chapters[0]?.startTime).toBe(0);
			expect(chapters[0]?.endTime).toBe(60);
			expect(chapters[1]?.label).toBe('Chapter 2');
			expect(chapters[1]?.startTime).toBe(60);
			expect(chapters[1]?.endTime).toBe(120);
		});

		it('should handle multilingual labels by preferring English', () => {
			const manifest = {
				'@context': 'http://iiif.io/api/presentation/3/context.json',
				id: 'https://example.org/manifest.json',
				type: 'Manifest',
				label: { en: ['Test Manifest'] },
				items: [
					{
						id: 'https://example.org/canvas/1',
						type: 'Canvas',
						duration: 300
					}
				],
				structures: [
					{
						id: 'https://example.org/range/1',
						type: 'Range',
						label: {
							en: ['Introduction'],
							es: ['Introducción'],
							fr: ['Présentation']
						},
						items: [
							{
								id: 'https://example.org/canvas/1#t=0,30',
								type: 'Canvas'
							}
						]
					}
				]
			};

			const chapters = parseRanges(manifest);

			expect(chapters[0]?.label).toBe('Introduction');
		});

		it('should fall back to first available language if English not present', () => {
			const manifest = {
				'@context': 'http://iiif.io/api/presentation/3/context.json',
				id: 'https://example.org/manifest.json',
				type: 'Manifest',
				label: { fr: ['Test Manifest'] },
				items: [
					{
						id: 'https://example.org/canvas/1',
						type: 'Canvas',
						duration: 300
					}
				],
				structures: [
					{
						id: 'https://example.org/range/1',
						type: 'Range',
						label: {
							fr: ['Présentation']
						},
						items: [
							{
								id: 'https://example.org/canvas/1#t=0,30',
								type: 'Canvas'
							}
						]
					}
				]
			};

			const chapters = parseRanges(manifest);

			expect(chapters[0]?.label).toBe('Présentation');
		});
	});

	describe('nested Range handling', () => {
		it('should recursively parse nested Ranges', () => {
			const manifest = {
				'@context': 'http://iiif.io/api/presentation/3/context.json',
				id: 'https://example.org/manifest.json',
				type: 'Manifest',
				label: { en: ['Test Manifest'] },
				items: [
					{
						id: 'https://example.org/canvas/1',
						type: 'Canvas',
						duration: 300
					}
				],
				structures: [
					{
						id: 'https://example.org/range/parent',
						type: 'Range',
						label: { en: ['Part 1'] },
						items: [
							{
								id: 'https://example.org/range/child1',
								type: 'Range',
								label: { en: ['Section 1.1'] },
								items: [
									{
										id: 'https://example.org/canvas/1#t=0,30',
										type: 'Canvas'
									}
								]
							},
							{
								id: 'https://example.org/range/child2',
								type: 'Range',
								label: { en: ['Section 1.2'] },
								items: [
									{
										id: 'https://example.org/canvas/1#t=30,60',
										type: 'Canvas'
									}
								]
							}
						]
					}
				]
			};

			const chapters = parseRanges(manifest);

			// Should flatten nested ranges
			expect(chapters).toHaveLength(2);
			expect(chapters[0]?.label).toBe('Section 1.1');
			expect(chapters[0]?.startTime).toBe(0);
			expect(chapters[0]?.endTime).toBe(30);
			expect(chapters[1]?.label).toBe('Section 1.2');
			expect(chapters[1]?.startTime).toBe(30);
			expect(chapters[1]?.endTime).toBe(60);
		});

		it('should handle deeply nested Ranges (3 levels)', () => {
			const manifest = {
				'@context': 'http://iiif.io/api/presentation/3/context.json',
				id: 'https://example.org/manifest.json',
				type: 'Manifest',
				label: { en: ['Test Manifest'] },
				items: [
					{
						id: 'https://example.org/canvas/1',
						type: 'Canvas',
						duration: 300
					}
				],
				structures: [
					{
						id: 'https://example.org/range/level1',
						type: 'Range',
						label: { en: ['Level 1'] },
						items: [
							{
								id: 'https://example.org/range/level2',
								type: 'Range',
								label: { en: ['Level 2'] },
								items: [
									{
										id: 'https://example.org/range/level3',
										type: 'Range',
										label: { en: ['Level 3'] },
										items: [
											{
												id: 'https://example.org/canvas/1#t=10,20',
												type: 'Canvas'
											}
										]
									}
								]
							}
						]
					}
				]
			};

			const chapters = parseRanges(manifest);

			expect(chapters).toHaveLength(1);
			expect(chapters[0]?.label).toBe('Level 3');
			expect(chapters[0]?.startTime).toBe(10);
			expect(chapters[0]?.endTime).toBe(20);
		});
	});

	describe('metadata and thumbnail extraction', () => {
		it('should extract thumbnail URL if present', () => {
			const manifest = {
				'@context': 'http://iiif.io/api/presentation/3/context.json',
				id: 'https://example.org/manifest.json',
				type: 'Manifest',
				label: { en: ['Test Manifest'] },
				items: [
					{
						id: 'https://example.org/canvas/1',
						type: 'Canvas',
						duration: 300
					}
				],
				structures: [
					{
						id: 'https://example.org/range/1',
						type: 'Range',
						label: { en: ['Chapter 1'] },
						thumbnail: [
							{
								id: 'https://example.org/thumb.jpg',
								type: 'Image'
							}
						],
						items: [
							{
								id: 'https://example.org/canvas/1#t=0,30',
								type: 'Canvas'
							}
						]
					}
				]
			};

			const chapters = parseRanges(manifest);

			expect(chapters[0]?.thumbnail).toBe('https://example.org/thumb.jpg');
		});

		it('should extract metadata as key-value pairs', () => {
			const manifest = {
				'@context': 'http://iiif.io/api/presentation/3/context.json',
				id: 'https://example.org/manifest.json',
				type: 'Manifest',
				label: { en: ['Test Manifest'] },
				items: [
					{
						id: 'https://example.org/canvas/1',
						type: 'Canvas',
						duration: 300
					}
				],
				structures: [
					{
						id: 'https://example.org/range/1',
						type: 'Range',
						label: { en: ['Chapter 1'] },
						metadata: [
							{
								label: { en: ['Speaker'] },
								value: { en: ['John Doe'] }
							},
							{
								label: { en: ['Location'] },
								value: { en: ['New York'] }
							}
						],
						items: [
							{
								id: 'https://example.org/canvas/1#t=0,30',
								type: 'Canvas'
							}
						]
					}
				]
			};

			const chapters = parseRanges(manifest);

			expect(chapters[0]?.metadata).toEqual({
				Speaker: 'John Doe',
				Location: 'New York'
			});
		});
	});

	describe('edge cases', () => {
		it('should return empty array when no structures present', () => {
			const manifest = {
				'@context': 'http://iiif.io/api/presentation/3/context.json',
				id: 'https://example.org/manifest.json',
				type: 'Manifest',
				label: { en: ['Test Manifest'] },
				items: [
					{
						id: 'https://example.org/canvas/1',
						type: 'Canvas',
						duration: 300
					}
				]
			};

			const chapters = parseRanges(manifest);

			expect(chapters).toEqual([]);
		});

		it('should return empty array when structures is empty', () => {
			const manifest = {
				'@context': 'http://iiif.io/api/presentation/3/context.json',
				id: 'https://example.org/manifest.json',
				type: 'Manifest',
				label: { en: ['Test Manifest'] },
				items: [
					{
						id: 'https://example.org/canvas/1',
						type: 'Canvas',
						duration: 300
					}
				],
				structures: []
			};

			const chapters = parseRanges(manifest);

			expect(chapters).toEqual([]);
		});

		it('should skip Ranges without temporal fragments', () => {
			const manifest = {
				'@context': 'http://iiif.io/api/presentation/3/context.json',
				id: 'https://example.org/manifest.json',
				type: 'Manifest',
				label: { en: ['Test Manifest'] },
				items: [
					{
						id: 'https://example.org/canvas/1',
						type: 'Canvas',
						duration: 300
					}
				],
				structures: [
					{
						id: 'https://example.org/range/1',
						type: 'Range',
						label: { en: ['No Timing'] },
						items: []
					},
					{
						id: 'https://example.org/range/2',
						type: 'Range',
						label: { en: ['Chapter 1'] },
						items: [
							{
								id: 'https://example.org/canvas/1#t=0,30',
								type: 'Canvas'
							}
						]
					}
				]
			};

			const chapters = parseRanges(manifest);

			expect(chapters).toHaveLength(1);
			expect(chapters[0]?.label).toBe('Chapter 1');
		});

		it('should handle malformed temporal fragments gracefully', () => {
			const manifest = {
				'@context': 'http://iiif.io/api/presentation/3/context.json',
				id: 'https://example.org/manifest.json',
				type: 'Manifest',
				label: { en: ['Test Manifest'] },
				items: [
					{
						id: 'https://example.org/canvas/1',
						type: 'Canvas',
						duration: 300
					}
				],
				structures: [
					{
						id: 'https://example.org/range/1',
						type: 'Range',
						label: { en: ['Bad Fragment'] },
						items: [
							{
								id: 'https://example.org/canvas/1#t=invalid',
								type: 'Canvas'
							}
						]
					}
				]
			};

			const chapters = parseRanges(manifest);

			// Should skip malformed fragments
			expect(chapters).toEqual([]);
		});

		it('should resolve open-ended temporal fragments using canvas duration', () => {
			// Per W3C Media Fragments spec, #t=10 is valid (end time optional)
			// We resolve end time from canvas duration
			const manifest = {
				'@context': 'http://iiif.io/api/presentation/3/context.json',
				id: 'https://example.org/manifest.json',
				type: 'Manifest',
				label: { en: ['Test Manifest'] },
				items: [
					{
						id: 'https://example.org/canvas/1',
						type: 'Canvas',
						duration: 300
					}
				],
				structures: [
					{
						id: 'https://example.org/range/1',
						type: 'Range',
						label: { en: ['Open Ended'] },
						items: [
							{
								id: 'https://example.org/canvas/1#t=10',
								type: 'Canvas'
							}
						]
					},
					{
						id: 'https://example.org/range/2',
						type: 'Range',
						label: { en: ['Complete Range'] },
						items: [
							{
								id: 'https://example.org/canvas/1#t=30,60',
								type: 'Canvas'
							}
						]
					}
				]
			};

			const chapters = parseRanges(manifest);

			// Both chapters should be returned, sorted by startTime
			expect(chapters).toHaveLength(2);
			expect(chapters[0]?.label).toBe('Open Ended');
			expect(chapters[0]?.startTime).toBe(10);
			expect(chapters[0]?.endTime).toBe(300); // Resolved from canvas duration
			expect(chapters[1]?.label).toBe('Complete Range');
			expect(chapters[1]?.startTime).toBe(30);
			expect(chapters[1]?.endTime).toBe(60);
		});

		it('should skip open-ended fragments when canvas duration unavailable', () => {
			// When canvas has no duration, we cannot resolve open-ended fragments
			const manifest = {
				'@context': 'http://iiif.io/api/presentation/3/context.json',
				id: 'https://example.org/manifest.json',
				type: 'Manifest',
				label: { en: ['Test Manifest'] },
				items: [
					{
						id: 'https://example.org/canvas/1',
						type: 'Canvas'
						// No duration!
					}
				],
				structures: [
					{
						id: 'https://example.org/range/1',
						type: 'Range',
						label: { en: ['Open Ended'] },
						items: [
							{
								id: 'https://example.org/canvas/1#t=10',
								type: 'Canvas'
							}
						]
					},
					{
						id: 'https://example.org/range/2',
						type: 'Range',
						label: { en: ['Complete Range'] },
						items: [
							{
								id: 'https://example.org/canvas/1#t=30,60',
								type: 'Canvas'
							}
						]
					}
				]
			};

			const chapters = parseRanges(manifest);

			// Open-ended fragment skipped (no duration), only complete range returned
			expect(chapters).toHaveLength(1);
			expect(chapters[0]?.label).toBe('Complete Range');
		});

		it('should handle missing label gracefully with fallback', () => {
			const manifest = {
				'@context': 'http://iiif.io/api/presentation/3/context.json',
				id: 'https://example.org/manifest.json',
				type: 'Manifest',
				label: { en: ['Test Manifest'] },
				items: [
					{
						id: 'https://example.org/canvas/1',
						type: 'Canvas',
						duration: 300
					}
				],
				structures: [
					{
						id: 'https://example.org/range/1',
						type: 'Range',
						items: [
							{
								id: 'https://example.org/canvas/1#t=0,30',
								type: 'Canvas'
							}
						]
					}
				]
			};

			const chapters = parseRanges(manifest);

			expect(chapters).toHaveLength(1);
			expect(chapters[0]?.label).toBe('Untitled Chapter');
		});

		it('should handle float timestamps in temporal fragments', () => {
			const manifest = {
				'@context': 'http://iiif.io/api/presentation/3/context.json',
				id: 'https://example.org/manifest.json',
				type: 'Manifest',
				label: { en: ['Test Manifest'] },
				items: [
					{
						id: 'https://example.org/canvas/1',
						type: 'Canvas',
						duration: 300
					}
				],
				structures: [
					{
						id: 'https://example.org/range/1',
						type: 'Range',
						label: { en: ['Chapter 1'] },
						items: [
							{
								id: 'https://example.org/canvas/1#t=10.5,25.75',
								type: 'Canvas'
							}
						]
					}
				]
			};

			const chapters = parseRanges(manifest);

			expect(chapters[0]?.startTime).toBe(10.5);
			expect(chapters[0]?.endTime).toBe(25.75);
		});
	});
});
