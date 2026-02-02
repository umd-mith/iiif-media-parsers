/**
 * IIIF Range Structure Parser
 *
 * Parses IIIF Presentation API v3 Range structures into Chapter objects.
 * Supports nested ranges (recursive parsing) and temporal fragment extraction.
 *
 * @see https://iiif.io/api/presentation/3.0/#range
 */
import type { Chapter } from './types.js';
/**
 * IIIF Manifest structure with optional structures array
 */
interface IIIFManifest {
	'@context'?: string | string[];
	id: string;
	type: 'Manifest';
	label?: Record<string, string[]>;
	structures?: IIIFRange[];
	items?: IIIFCanvas[];
	[key: string]: unknown;
}
/**
 * IIIF Canvas with duration for time-based media
 */
interface IIIFCanvas {
	id: string;
	type: 'Canvas';
	duration?: number;
	[key: string]: unknown;
}
/**
 * IIIF Range structure
 */
interface IIIFRange {
	id: string;
	type: 'Range';
	label?: Record<string, string[]>;
	items?: (IIIFRangeItem | IIIFRange)[];
	thumbnail?: Array<{
		id: string;
		type: string;
	}>;
	metadata?: Array<{
		label: Record<string, string[]>;
		value: Record<string, string[]>;
	}>;
}
/**
 * IIIF Range item (Canvas reference with temporal fragment)
 */
interface IIIFRangeItem {
	id: string;
	type: 'Canvas';
}
/**
 * Parses IIIF Range structures from a manifest into Chapter objects.
 *
 * This function recursively processes Range structures, extracting temporal
 * information from Media Fragment URIs (e.g., `#t=10,20`), and flattening
 * nested ranges into a linear array of chapters.
 *
 * @param manifest - IIIF Presentation API v3 Manifest
 * @returns Array of Chapter objects sorted by startTime (may be empty)
 *
 * @remarks
 * Returns an empty array when:
 * - Manifest has no `structures` property
 * - No ranges contain temporal fragments (`#t=...`)
 *
 * Ranges are silently skipped when:
 * - No Canvas items with temporal fragments
 * - Temporal fragment is malformed (non-numeric, negative values)
 * - Time range is invalid (`end <= start`)
 * - Open-ended fragment (`#t=10`) without canvas duration to resolve end time
 *
 * @example
 * ```typescript
 * const manifest = {
 *   id: 'https://example.org/manifest',
 *   type: 'Manifest',
 *   structures: [
 *     {
 *       id: 'range-1',
 *       type: 'Range',
 *       label: { en: ['Introduction'] },
 *       items: [{ id: 'canvas#t=0,30', type: 'Canvas' }]
 *     }
 *   ]
 * };
 * const chapters = parseRanges(manifest);
 * // => [{ id: 'range-1', label: 'Introduction', startTime: 0, endTime: 30 }]
 * ```
 */
export declare function parseRanges(manifest: IIIFManifest): Chapter[];
export {};
//# sourceMappingURL=parseRanges.d.ts.map
