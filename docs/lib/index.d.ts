/**
 * iiif-media-parsers
 *
 * TypeScript utilities for parsing IIIF media fragments, ranges, and WebVTT speaker annotations.
 *
 * @packageDocumentation
 */
export type {
	Chapter,
	SpeakerSegment,
	TemporalFragment,
	SpatialFragment,
	ParsedAnnotationTarget,
	AnnotationTargetInput,
	IIIFResourceType
} from './types.js';
export { parseRanges } from './parseRanges.js';
export { parseSpeakers } from './parseSpeakers.js';
export { parseAnnotationTarget, parseMediaFragment } from './parseAnnotationTarget.js';
//# sourceMappingURL=index.d.ts.map
