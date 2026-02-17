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
 * @returns Array of SpeakerSegment objects sorted by startTime (may be empty)
 *
 * @remarks
 * Returns an empty array when:
 * - Input is null, undefined, or empty/whitespace-only string
 * - VTT contains no cues with voice tags (`<v Speaker>`)
 * - Voice tags don't appear at the start of cue text
 *
 * Cues are silently skipped when:
 * - Timing line is malformed (not `HH:MM:SS.mmm --> HH:MM:SS.mmm`)
 * - No voice tag present in cue text
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
export declare function parseSpeakers(vttContent: string): SpeakerSegment[];
//# sourceMappingURL=parseSpeakers.d.ts.map
