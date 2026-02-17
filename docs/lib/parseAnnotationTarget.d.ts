/**
 * IIIF Annotation Target Parser
 *
 * Parses annotation targets (string URIs or SpecificResource objects)
 * extracting temporal and spatial fragments per W3C Media Fragments spec.
 *
 * @see https://www.w3.org/TR/media-frags/
 * @see https://iiif.io/api/presentation/3.0/#annotation
 */
import type { ParsedAnnotationTarget, AnnotationTargetInput } from './types.js';
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
export declare function parseMediaFragment(uri: string): ParsedAnnotationTarget;
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
export declare function parseAnnotationTarget(
	target: AnnotationTargetInput
): ParsedAnnotationTarget | null;
//# sourceMappingURL=parseAnnotationTarget.d.ts.map
