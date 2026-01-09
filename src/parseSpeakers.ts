/**
 * VTT Speaker Segment Parser
 *
 * Parses WebVTT voice tags (<v>) to extract speaker information for semantic styling.
 * Follows W3C WebVTT specification for speaker identification.
 *
 * @see https://www.w3.org/TR/webvtt1/#the-cue-payload
 */

import type { SpeakerSegment } from './types.js';

/**
 * Internal representation of a parsed cue with timing and speaker
 */
interface ParsedCue {
	startTime: number;
	endTime: number;
	speaker: string | null;
	text: string;
}

/**
 * Parses VTT content to extract speaker segments from voice tags.
 *
 * Follows W3C WebVTT specification using <v> voice tags for speaker identification:
 * ```
 * 00:00:00.000 --> 00:00:10.000
 * <v John Doe>Hello, my name is John.
 * ```
 *
 * Groups consecutive cues by speaker and calculates continuous segments.
 *
 * @param vttContent - Raw WebVTT file content
 * @returns Array of SpeakerSegment objects sorted by startTime
 *
 * @example
 * ```typescript
 * const vtt = `WEBVTT
 *
 * 00:00:00.000 --> 00:00:10.000
 * <v John Doe>Hello, my name is John.
 *
 * 00:00:10.000 --> 00:00:20.000
 * <v Jane Smith>Nice to meet you!`;
 *
 * const segments = parseSpeakers(vtt);
 * // => [
 * //   { speaker: 'John Doe', startTime: 0, endTime: 10 },
 * //   { speaker: 'Jane Smith', startTime: 10, endTime: 20 }
 * // ]
 * ```
 */
export function parseSpeakers(vttContent: string): SpeakerSegment[] {
	if (!vttContent || vttContent.trim() === '') {
		return [];
	}

	// Parse all cues with speaker information
	const cues = parseVTTCues(vttContent);

	// Filter to only cues with speakers
	const speakerCues = cues.filter((cue) => cue.speaker !== null);

	// Group consecutive cues by speaker
	const segments = groupBySpeaker(speakerCues);

	// Sort by start time for consistent ordering
	return segments.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Parses all VTT cues from content, extracting timing and speaker information.
 *
 * @param vttContent - Raw VTT content
 * @returns Array of parsed cues
 */
function parseVTTCues(vttContent: string): ParsedCue[] {
	const cues: ParsedCue[] = [];
	const lines = vttContent.split('\n');
	let i = 0;

	while (i < lines.length) {
		const line = lines[i]!.trim();

		// Check for cue timing line
		if (line.includes('-->')) {
			const cue = parseCue(lines, i);
			if (cue) {
				cues.push(cue);
			}
			i = skipCueLines(lines, i);
			continue;
		}

		i++;
	}

	return cues;
}

/**
 * Parses a single VTT cue starting at the given line index.
 *
 * Extracts timing information and speaker from voice tag.
 *
 * @param lines - Array of VTT file lines
 * @param startIndex - Index of the timing line
 * @returns Parsed cue or null if malformed
 */
function parseCue(lines: string[], startIndex: number): ParsedCue | null {
	const timingLine = lines[startIndex];
	if (!timingLine) {
		return null;
	}

	const timing = parseCueTiming(timingLine);
	if (!timing) {
		return null;
	}

	const textLines = collectCueText(lines, startIndex + 1);
	const fullText = textLines.join(' ');

	// Extract speaker from voice tag
	const speaker = extractSpeakerFromVoiceTag(fullText);

	return {
		startTime: timing.startTime,
		endTime: timing.endTime,
		speaker,
		text: fullText
	};
}

/**
 * Parses timing from a VTT cue timing line.
 *
 * @param timingLine - VTT timing line (e.g., "00:00:10.000 --> 00:00:20.000")
 * @returns Start and end times or null if malformed
 */
function parseCueTiming(timingLine: string): { startTime: number; endTime: number } | null {
	const timingMatch = timingLine.match(
		/(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})/
	);

	if (!timingMatch) {
		return null;
	}

	const startTime = parseVTTTimestamp(timingMatch[1]!);
	const endTime = parseVTTTimestamp(timingMatch[2]!);

	if (startTime === null || endTime === null) {
		return null;
	}

	return { startTime, endTime };
}

/**
 * Parses a WebVTT timestamp into seconds.
 *
 * Supports formats:
 * - `HH:MM:SS.mmm` (with hours)
 * - `MM:SS.mmm` (without hours)
 *
 * @param timestamp - VTT timestamp string
 * @returns Time in seconds or null if malformed
 */
function parseVTTTimestamp(timestamp: string): number | null {
	const parts = timestamp.split(':');

	let hours = 0;
	let minutes = 0;
	let seconds = 0;

	if (parts.length === 3) {
		// HH:MM:SS.mmm
		hours = parseInt(parts[0]!, 10);
		minutes = parseInt(parts[1]!, 10);
		seconds = parseFloat(parts[2]!);
	} else if (parts.length === 2) {
		// MM:SS.mmm
		minutes = parseInt(parts[0]!, 10);
		seconds = parseFloat(parts[1]!);
	} else {
		return null;
	}

	if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
		return null;
	}

	return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Collects cue text lines starting from index.
 *
 * @param lines - Array of VTT file lines
 * @param startIndex - Index after timing line
 * @returns Array of text lines
 */
function collectCueText(lines: string[], startIndex: number): string[] {
	const textLines: string[] = [];
	let i = startIndex;

	while (i < lines.length) {
		const line = lines[i]!.trim();
		// Stop at blank line or next timing line
		if (line === '' || line.includes('-->')) {
			break;
		}
		// Skip NOTE lines
		if (!line.match(/^NOTE\s+/i)) {
			textLines.push(line);
		}
		i++;
	}

	return textLines;
}

/**
 * Skips past cue lines to find the next cue.
 *
 * @param lines - Array of VTT file lines
 * @param startIndex - Index of current cue timing line
 * @returns Index of next non-cue line
 */
function skipCueLines(lines: string[], startIndex: number): number {
	let i = startIndex + 1;
	while (i < lines.length) {
		const line = lines[i]!.trim();
		// Stop at empty line or next timing line
		if (line === '' || line.includes('-->')) {
			return i;
		}
		i++;
	}
	return i;
}

/**
 * Extracts speaker name from WebVTT voice tag.
 *
 * Per W3C spec, voice tags use format: <v Speaker Name>Text
 * The voice tag doesn't need to be closed if it spans the entire cue.
 *
 * @param text - Cue text (may contain voice tag)
 * @returns Speaker name or null if no voice tag present
 *
 * @example
 * ```typescript
 * extractSpeakerFromVoiceTag('<v John Doe>Hello!') // => 'John Doe'
 * extractSpeakerFromVoiceTag('Regular text') // => null
 * ```
 */
function extractSpeakerFromVoiceTag(text: string): string | null {
	// Match <v Speaker Name> at start of text
	const match = text.match(/^<v\s+([^>]+)>/i);
	if (match) {
		return match[1]!.trim();
	}

	return null;
}

/**
 * Groups consecutive cues by speaker into segments.
 *
 * Merges consecutive cues from the same speaker into continuous segments.
 *
 * @param cues - Array of parsed cues with speakers
 * @returns Array of speaker segments
 */
function groupBySpeaker(cues: ParsedCue[]): SpeakerSegment[] {
	if (cues.length === 0) {
		return [];
	}

	const segments: SpeakerSegment[] = [];
	let currentSpeaker = cues[0]!.speaker!;
	let currentStart = cues[0]!.startTime;
	let currentEnd = cues[0]!.endTime;

	for (let i = 1; i < cues.length; i++) {
		const cue = cues[i]!;

		if (cue.speaker === currentSpeaker && cue.startTime === currentEnd) {
			// Same speaker, consecutive timing - extend segment
			currentEnd = cue.endTime;
		} else {
			// Different speaker or gap - save current segment
			segments.push({
				speaker: currentSpeaker,
				startTime: currentStart,
				endTime: currentEnd
			});

			// Start new segment
			currentSpeaker = cue.speaker!;
			currentStart = cue.startTime;
			currentEnd = cue.endTime;
		}
	}

	// Add final segment
	segments.push({
		speaker: currentSpeaker,
		startTime: currentStart,
		endTime: currentEnd
	});

	return segments;
}
