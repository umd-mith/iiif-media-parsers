/**
 * Parse W3C Media Fragment URIs from IIIF annotation targets
 *
 * @see https://www.w3.org/TR/media-frags/
 * @see https://iiif.io/api/presentation/3.0/#annotation
 */

import type { ParsedAnnotationTarget } from './types.js';

// TODO: Import from LDA-1263
// Placeholder - actual implementation will be extracted from @lakeland/iiif-utils

/**
 * Parses an IIIF annotation target (string URI or SpecificResource) into components
 *
 * Supports W3C Media Fragment temporal (#t=) and spatial (#xywh=) targeting.
 *
 * @param target - IIIF annotation target (string or SpecificResource object)
 * @returns Parsed target with source URI and optional temporal/spatial fragments
 */
export function parseAnnotationTarget(_target: unknown): ParsedAnnotationTarget {
	// Placeholder implementation
	return { source: '' };
}
