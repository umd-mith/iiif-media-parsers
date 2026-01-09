/**
 * Tests for VTT Speaker Segment Parser
 *
 * NOTE: Uses W3C WebVTT specification-compliant <v> voice tags for speaker identification
 * @see https://www.w3.org/TR/webvtt1/#the-cue-payload
 */

import { describe, it, expect } from 'vitest';
import { parseSpeakers } from './parseSpeakers.js';

describe('parseSpeakers', () => {
	describe('basic voice tag parsing', () => {
		it('should parse VTT with <v> voice tags', () => {
			const vttContent = `WEBVTT

00:00:00.000 --> 00:00:10.000
<v John Doe>First segment by John Doe

00:00:10.000 --> 00:00:20.000
<v Jane Smith>Second segment by Jane Smith`;

			const segments = parseSpeakers(vttContent);

			expect(segments).toHaveLength(2);
			expect(segments[0]).toEqual({
				speaker: 'John Doe',
				startTime: 0,
				endTime: 10
			});
			expect(segments[1]).toEqual({
				speaker: 'Jane Smith',
				startTime: 10,
				endTime: 20
			});
		});

		it('should handle consecutive cues from same speaker', () => {
			const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
<v John Doe>First cue

00:00:05.000 --> 00:00:10.000
<v John Doe>Second cue

00:00:10.000 --> 00:00:15.000
<v Jane Smith>Third cue`;

			const segments = parseSpeakers(vttContent);

			expect(segments).toHaveLength(2);
			expect(segments[0]).toEqual({
				speaker: 'John Doe',
				startTime: 0,
				endTime: 10
			});
			expect(segments[1]).toEqual({
				speaker: 'Jane Smith',
				startTime: 10,
				endTime: 15
			});
		});

		it('should handle multi-word speaker names', () => {
			const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
<v Dr. Jane Elizabeth Smith>Content here`;

			const segments = parseSpeakers(vttContent);

			expect(segments).toHaveLength(1);
			expect(segments[0]?.speaker).toBe('Dr. Jane Elizabeth Smith');
		});
	});

	describe('voice tag format variations', () => {
		it('should handle extra whitespace in voice tag', () => {
			const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
<v  John Doe >Content`;

			const segments = parseSpeakers(vttContent);

			expect(segments).toHaveLength(1);
			expect(segments[0]?.speaker).toBe('John Doe');
		});

		it('should handle case-insensitive voice tag', () => {
			const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
<V John Doe>Content`;

			const segments = parseSpeakers(vttContent);

			expect(segments).toHaveLength(1);
			expect(segments[0]?.speaker).toBe('John Doe');
		});

		it('should ignore cues without voice tags', () => {
			const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
Regular subtitle without speaker

00:00:05.000 --> 00:00:10.000
<v John Doe>Cue with speaker

00:00:10.000 --> 00:00:15.000
Another subtitle without speaker`;

			const segments = parseSpeakers(vttContent);

			expect(segments).toHaveLength(1);
			expect(segments[0]).toEqual({
				speaker: 'John Doe',
				startTime: 5,
				endTime: 10
			});
		});
	});

	describe('timestamp parsing', () => {
		it('should parse timestamps with hours (HH:MM:SS.mmm)', () => {
			const vttContent = `WEBVTT

01:30:45.500 --> 01:30:55.750
<v Narrator>Content with hours`;

			const segments = parseSpeakers(vttContent);

			expect(segments[0]?.startTime).toBe(5445.5); // 1*3600 + 30*60 + 45.5
			expect(segments[0]?.endTime).toBe(5455.75); // 1*3600 + 30*60 + 55.75
		});

		it('should parse timestamps without hours (MM:SS.mmm)', () => {
			const vttContent = `WEBVTT

00:00:10.500 --> 00:00:20.250
<v Narrator>Content without hours`;

			const segments = parseSpeakers(vttContent);

			expect(segments[0]?.startTime).toBe(10.5);
			expect(segments[0]?.endTime).toBe(20.25);
		});

		it('should handle zero timestamps', () => {
			const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
<v Speaker>Zero start time`;

			const segments = parseSpeakers(vttContent);

			expect(segments[0]?.startTime).toBe(0);
			expect(segments[0]?.endTime).toBe(5);
		});
	});

	describe('speaker segment merging', () => {
		it('should merge consecutive segments from same speaker', () => {
			const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
<v John>First part

00:00:05.000 --> 00:00:10.000
<v John>Second part

00:00:10.000 --> 00:00:15.000
<v John>Third part`;

			const segments = parseSpeakers(vttContent);

			expect(segments).toHaveLength(1);
			expect(segments[0]).toEqual({
				speaker: 'John',
				startTime: 0,
				endTime: 15
			});
		});

		it('should not merge non-consecutive segments from same speaker', () => {
			const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
<v John>First segment

00:00:10.000 --> 00:00:15.000
<v John>Second segment (gap before this)`;

			const segments = parseSpeakers(vttContent);

			expect(segments).toHaveLength(2);
			expect(segments[0]?.endTime).toBe(5);
			expect(segments[1]?.startTime).toBe(10);
		});

		it('should handle alternating speakers correctly', () => {
			const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
<v Alice>First

00:00:05.000 --> 00:00:10.000
<v Bob>Second

00:00:10.000 --> 00:00:15.000
<v Alice>Third

00:00:15.000 --> 00:00:20.000
<v Bob>Fourth`;

			const segments = parseSpeakers(vttContent);

			expect(segments).toHaveLength(4);
			expect(segments.map((s) => s.speaker)).toEqual(['Alice', 'Bob', 'Alice', 'Bob']);
		});
	});

	describe('edge cases', () => {
		it('should return empty array for empty content', () => {
			const segments = parseSpeakers('');
			expect(segments).toEqual([]);
		});

		it('should return empty array for whitespace-only content', () => {
			const segments = parseSpeakers('   \n\n   ');
			expect(segments).toEqual([]);
		});

		it('should return empty array for VTT with no voice tags', () => {
			const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
Regular subtitle

00:00:05.000 --> 00:00:10.000
Another subtitle`;

			const segments = parseSpeakers(vttContent);
			expect(segments).toEqual([]);
		});

		it('should skip malformed timing lines', () => {
			const vttContent = `WEBVTT

INVALID TIMING LINE
<v John>This should be skipped

00:00:00.000 --> 00:00:05.000
<v Jane>This should work`;

			const segments = parseSpeakers(vttContent);

			expect(segments).toHaveLength(1);
			expect(segments[0]?.speaker).toBe('Jane');
		});

		it('should handle NOTE blocks gracefully (ignore them)', () => {
			const vttContent = `WEBVTT

NOTE This is a comment about the file

00:00:00.000 --> 00:00:05.000
<v Narrator>Actual content

NOTE Another comment

00:00:05.000 --> 00:00:10.000
<v Speaker>More content`;

			const segments = parseSpeakers(vttContent);

			expect(segments).toHaveLength(2);
			expect(segments[0]?.speaker).toBe('Narrator');
			expect(segments[1]?.speaker).toBe('Speaker');
		});
	});

	describe('sorting and ordering', () => {
		it('should sort segments by start time', () => {
			const vttContent = `WEBVTT

00:00:10.000 --> 00:00:15.000
<v Second>Out of order

00:00:00.000 --> 00:00:05.000
<v First>Should be first`;

			const segments = parseSpeakers(vttContent);

			expect(segments[0]?.speaker).toBe('First');
			expect(segments[1]?.speaker).toBe('Second');
		});
	});

	describe('real-world VTT content', () => {
		it('should parse typical oral history transcript format', () => {
			const vttContent = `WEBVTT

00:00:00.000 --> 00:00:08.500
<v Interviewer>Can you tell us about your experience?

00:00:08.500 --> 00:00:25.000
<v Subject>Well, it started back in 1965 when I first
moved to the city.

00:00:25.000 --> 00:00:30.000
<v Interviewer>What was that like?

00:00:30.000 --> 00:00:45.500
<v Subject>It was challenging but exciting.`;

			const segments = parseSpeakers(vttContent);

			expect(segments).toHaveLength(4);
			expect(segments[0]).toEqual({
				speaker: 'Interviewer',
				startTime: 0,
				endTime: 8.5
			});
			expect(segments[1]).toEqual({
				speaker: 'Subject',
				startTime: 8.5,
				endTime: 25
			});
		});

		it('should handle multi-line cue text with voice tag', () => {
			const vttContent = `WEBVTT

00:00:00.000 --> 00:00:10.000
<v Narrator>This is a longer cue
that spans multiple lines
in the VTT file`;

			const segments = parseSpeakers(vttContent);

			expect(segments).toHaveLength(1);
			expect(segments[0]?.speaker).toBe('Narrator');
			expect(segments[0]?.startTime).toBe(0);
			expect(segments[0]?.endTime).toBe(10);
		});
	});
});
