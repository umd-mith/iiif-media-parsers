/**
 * iiif-media-parsers
 *
 * TypeScript utilities for parsing IIIF media fragments, ranges, and WebVTT speaker annotations.
 *
 * @packageDocumentation
 */

// Types
export type {
	Chapter,
	SpeakerSegment,
	TemporalFragment,
	SpatialFragment,
	ParsedAnnotationTarget,
	AnnotationTargetInput,
	IIIFResourceType
} from './types.js';

// Parsers
export { parseRanges } from './parseRanges.js';
export { parseSpeakers } from './parseSpeakers.js';
export { parseAnnotationTarget, parseMediaFragment } from './parseAnnotationTarget.js';
