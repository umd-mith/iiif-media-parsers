/**
 * IIIF Annotation Target Parser
 *
 * Parses annotation targets (string URIs or SpecificResource objects)
 * extracting temporal and spatial fragments per W3C Media Fragments spec.
 *
 * @see https://www.w3.org/TR/media-frags/
 * @see https://iiif.io/api/presentation/3.0/#annotation
 */

import type {
	TemporalFragment,
	SpatialFragment,
	ParsedAnnotationTarget,
	AnnotationTargetInput
} from './types.js';

/**
 * Safely parses a numeric string, returning undefined for empty/invalid.
 * Also rejects negative values per W3C Media Fragments spec.
 */
function parseNonNegativeValue(str: string | undefined): number | undefined {
	if (str === undefined || str === '') {
		return undefined;
	}
	const num = parseFloat(str);
	// Reject NaN and negative values per W3C spec
	return isNaN(num) || num < 0 ? undefined : num;
}

/**
 * Parses temporal fragment from a fragment string.
 *
 * @param fragment - Fragment string (without #)
 * @returns TemporalFragment or undefined if invalid/not present
 */
function parseTemporalFromFragment(fragment: string): TemporalFragment | undefined {
	// Regex matches: t= followed by optional number, optional comma, optional number
	const match = fragment.match(/t=([0-9.]*),?([0-9.]*)/);
	if (!match) {
		return undefined;
	}

	const startStr = match[1];
	const endStr = match[2];

	// Both empty means invalid (just "t=")
	if (startStr === '' && endStr === '') {
		return undefined;
	}

	// Handle t=,end pattern (from start) - empty start means 0
	const start = startStr === '' ? 0 : parseNonNegativeValue(startStr);
	const end = parseNonNegativeValue(endStr);

	// Start must be valid (parseNonNegativeValue handles negative rejection)
	if (start === undefined) {
		return undefined;
	}

	// Reject invalid temporal ordering: end must be greater than start
	// This matches the validation in parseRanges.ts extractTemporalFragment
	if (end !== undefined && end <= start) {
		return undefined;
	}

	return { start, end };
}

/**
 * Parses spatial fragment from a fragment string.
 *
 * Supports W3C Media Fragments spatial targeting:
 * - `xywh=100,200,50,75` - pixel coordinates (default)
 * - `xywh=percent:10,20,30,40` - percentage coordinates
 *
 * @param fragment - Fragment string (without #)
 * @returns SpatialFragment or undefined if invalid/not present
 *
 * @see https://www.w3.org/TR/media-frags/#naming-space
 */
function parseSpatialFromFragment(fragment: string): SpatialFragment | undefined {
	// Regex matches: xywh=[pixel:|percent:]x,y,w,h
	const match = fragment.match(/xywh=(pixel:|percent:)?([0-9.]+),([0-9.]+),([0-9.]+),([0-9.]+)/);
	if (!match) {
		return undefined;
	}

	const unit = match[1] === 'percent:' ? 'percent' : 'pixel';
	const x = parseNonNegativeValue(match[2]);
	const y = parseNonNegativeValue(match[3]);
	const width = parseNonNegativeValue(match[4]);
	const height = parseNonNegativeValue(match[5]);

	// All four values must be valid
	if (x === undefined || y === undefined || width === undefined || height === undefined) {
		return undefined;
	}

	// For percentage units, validate bounds (0-100) and that region fits within canvas
	if (unit === 'percent') {
		// Individual values must be <= 100
		if (x > 100 || y > 100 || width > 100 || height > 100) {
			return undefined;
		}
		// Region must fit within bounds (x + width <= 100, y + height <= 100)
		if (x + width > 100 || y + height > 100) {
			return undefined;
		}
	}

	return { x, y, width, height, unit };
}

/**
 * Parses W3C Media Fragment URI components from a string.
 *
 * Supports temporal fragments (#t=start,end) per W3C Media Fragments spec:
 * - `#t=10,20` - start and end times
 * - `#t=10` - start time only (end optional)
 * - `#t=,20` - from start (0) to end time
 * - Float precision supported: `#t=10.5,25.75`
 *
 * @param uri - URI potentially containing media fragments
 * @returns Parsed fragment data with source URI (always returns an object)
 *
 * @remarks
 * Always returns a `ParsedAnnotationTarget` object with `source` property.
 *
 * The `temporal` property is undefined when:
 * - No `#t=` fragment present in URI
 * - Fragment is malformed (`#t=invalid`, `#t=`)
 * - Values are negative (`#t=-5,20`)
 * - Time range is invalid (`#t=20,10` where end <= start)
 *
 * The `spatial` property is undefined when:
 * - No `#xywh=` fragment present in URI
 * - Fragment is incomplete (`#xywh=100,200`)
 * - Values are negative
 * - Percentage values exceed bounds (>100 or region outside canvas)
 *
 * @example
 * ```typescript
 * parseMediaFragment('https://example.org/canvas#t=10,20')
 * // => { source: 'https://example.org/canvas', temporal: { start: 10, end: 20 } }
 *
 * parseMediaFragment('https://example.org/canvas#t=10')
 * // => { source: 'https://example.org/canvas', temporal: { start: 10 } }
 *
 * parseMediaFragment('https://example.org/canvas#t=20,10')
 * // => { source: 'https://example.org/canvas', temporal: undefined } // invalid range
 * ```
 *
 * @see https://www.w3.org/TR/media-frags/#naming-time
 */
export function parseMediaFragment(uri: string): ParsedAnnotationTarget {
	const hashIndex = uri.indexOf('#');

	if (hashIndex === -1) {
		return { source: uri };
	}

	const source = uri.substring(0, hashIndex);
	const fragment = uri.substring(hashIndex + 1);

	return {
		source,
		temporal: parseTemporalFromFragment(fragment),
		spatial: parseSpatialFromFragment(fragment)
	};
}

/**
 * Extracts source URI from a SpecificResource source field.
 */
function extractSourceUri(source: string | { id: string }): string {
	return typeof source === 'string' ? source : source.id;
}

/**
 * Parses a string annotation target.
 */
function parseStringTarget(target: string): ParsedAnnotationTarget | null {
	if (target === '') {
		return null;
	}
	return parseMediaFragment(target);
}

/**
 * Parses a SpecificResource annotation target.
 */
function parseSpecificResourceTarget(
	target: Extract<AnnotationTargetInput, { type: 'SpecificResource' }>
): ParsedAnnotationTarget {
	const source = extractSourceUri(target.source);

	// Check for FragmentSelector with value
	if (target.selector?.type === 'FragmentSelector' && target.selector.value) {
		// Parse the selector value as a fragment
		const fragmentResult = parseMediaFragment(`dummy#${target.selector.value}`);
		return {
			source,
			temporal: fragmentResult.temporal,
			spatial: fragmentResult.spatial
		};
	}

	// No FragmentSelector - return just the source
	return { source };
}

/**
 * Parses an IIIF annotation target into structured fragment data.
 *
 * Handles two IIIF patterns:
 * 1. Simple string with media fragment: `"https://example.org/canvas#t=10,20"`
 * 2. SpecificResource with FragmentSelector
 *
 * @param target - Annotation target (string URI or SpecificResource object)
 * @returns Parsed annotation target, or null if input is invalid
 *
 * @remarks
 * Returns `null` when:
 * - Input is null, undefined, or empty string
 * - Input is an object without `type: 'SpecificResource'`
 *
 * Returns object with undefined `temporal`/`spatial` when:
 * - No fragment present in URI or selector
 * - Fragment is malformed (see {@link parseMediaFragment} for details)
 * - Non-FragmentSelector types (e.g., PointSelector) - only source is extracted
 *
 * @example String target
 * ```typescript
 * parseAnnotationTarget('https://example.org/canvas#t=10,20')
 * // => { source: 'https://example.org/canvas', temporal: { start: 10, end: 20 } }
 * ```
 *
 * @example SpecificResource target
 * ```typescript
 * parseAnnotationTarget({
 *   type: 'SpecificResource',
 *   source: 'https://example.org/canvas',
 *   selector: { type: 'FragmentSelector', value: 't=10,20' }
 * })
 * // => { source: 'https://example.org/canvas', temporal: { start: 10, end: 20 } }
 * ```
 */
export function parseAnnotationTarget(
	target: AnnotationTargetInput
): ParsedAnnotationTarget | null {
	if (!target) {
		return null;
	}

	if (typeof target === 'string') {
		return parseStringTarget(target);
	}

	if (target.type === 'SpecificResource') {
		return parseSpecificResourceTarget(target);
	}

	return null;
}
