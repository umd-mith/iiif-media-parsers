/**
 * Parse WebVTT NOTE directives for speaker identification
 *
 * @see https://www.w3.org/TR/webvtt1/#introduction-notes
 */

import type { SpeakerSegment } from './types.js';

// TODO: Import from LDA-1263
// Placeholder - actual implementation will be extracted from @lakeland/iiif-utils

/**
 * Parses WebVTT content to extract speaker segments from NOTE directives
 *
 * @param vttContent - Raw WebVTT file content
 * @returns Array of speaker segments with timing
 */
export function parseSpeakers(_vttContent: string): SpeakerSegment[] {
	// Placeholder implementation
	return [];
}
