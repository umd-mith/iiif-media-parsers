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
	type: string;
	label?: Record<string, string[]>;
	structures?: IIIFRange[];
	[key: string]: unknown;
}

/**
 * IIIF Range structure
 */
interface IIIFRange {
	id: string;
	type: string;
	label?: Record<string, string[]>;
	items?: (IIIFRangeItem | IIIFRange)[];
	thumbnail?: Array<{ id: string; type: string }>;
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
	type: string;
}

/**
 * Parses IIIF Range structures from a manifest into Chapter objects.
 *
 * This function recursively processes Range structures, extracting temporal
 * information from Media Fragment URIs (e.g., `#t=10,20`), and flattening
 * nested ranges into a linear array of chapters.
 *
 * @param manifest - IIIF Presentation API v3 Manifest
 * @returns Array of Chapter objects sorted by startTime
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
export function parseRanges(manifest: IIIFManifest): Chapter[] {
	if (!manifest.structures || manifest.structures.length === 0) {
		return [];
	}

	const chapters: Chapter[] = [];

	// Process each top-level range
	for (const range of manifest.structures) {
		processRange(range, chapters);
	}

	// Sort chapters by startTime for consistent ordering
	return chapters.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Recursively processes a Range structure, extracting chapters from
 * temporal fragments or nested ranges.
 *
 * @param range - IIIF Range object
 * @param chapters - Accumulator array for discovered chapters
 */
function processRange(range: IIIFRange, chapters: Chapter[]): void {
	if (!range || !range.items || range.items.length === 0) {
		return;
	}

	// Check if this range has direct temporal fragments
	const temporalItems = range.items.filter(
		(item): item is IIIFRangeItem => item.type === 'Canvas' && hasTemporalFragment(item.id)
	);

	if (temporalItems.length > 0) {
		// This range has temporal fragments - create a chapter
		const chapter = createChapterFromRange(range, temporalItems);
		if (chapter) {
			chapters.push(chapter);
		}
	}

	// Recursively process nested ranges
	const nestedRanges = range.items.filter((item): item is IIIFRange => item.type === 'Range');
	for (const nestedRange of nestedRanges) {
		processRange(nestedRange, chapters);
	}
}

/**
 * Creates a Chapter object from a Range with temporal fragments.
 *
 * Extracts start and end times from the first temporal fragment in the range.
 * Supports float timestamps and handles malformed fragments gracefully.
 *
 * @param range - IIIF Range object
 * @param items - Array of Canvas items with temporal fragments
 * @returns Chapter object or null if parsing fails
 */
function createChapterFromRange(range: IIIFRange, items: IIIFRangeItem[]): Chapter | null {
	// Use first temporal fragment for timing
	const firstItem = items[0];
	if (!firstItem) {
		return null;
	}

	const timing = extractTemporalFragment(firstItem.id);
	if (!timing) {
		return null;
	}

	const label = extractLabel(range.label);
	const thumbnail = extractThumbnail(range.thumbnail);
	const metadata = extractMetadata(range.metadata);

	return {
		id: range.id,
		label,
		startTime: timing.start,
		endTime: timing.end,
		thumbnail,
		metadata
	};
}

/**
 * Checks if a Canvas ID contains a temporal fragment.
 *
 * @param canvasId - Canvas identifier (may include Media Fragment)
 * @returns True if the ID contains a `#t=` fragment
 */
function hasTemporalFragment(canvasId: string): boolean {
	return canvasId.includes('#t=');
}

/**
 * Extracts temporal timing from a Media Fragment URI.
 *
 * Parses Media Fragments per W3C Media Fragments URI spec:
 * - `#t=10,20` - start and end times
 * - `#t=10` - start time only (end defaults to media duration)
 * - `#t=10.5,25.75` - floating point precision supported
 *
 * Note: End time is required for Chapter extraction. Start-only fragments
 * cannot be converted to chapters without knowing media duration.
 *
 * @param canvasId - Canvas ID with temporal fragment
 * @returns Object with start and end times, or null if malformed/incomplete
 *
 * @see https://www.w3.org/TR/media-frags/#naming-time
 */
function extractTemporalFragment(canvasId: string): { start: number; end: number } | null {
	// W3C Media Fragments spec: t=start[,end]
	// End time is optional in spec, but required for Chapter extraction
	const match = canvasId.match(/#t=([0-9.]+)(?:,([0-9.]+))?$/);
	if (!match) {
		return null;
	}

	const start = parseFloat(match[1]!);
	const endStr = match[2];

	// For chapters, we need both start and end times
	if (!endStr) {
		// Start-only fragment - cannot create chapter without duration
		return null;
	}

	const end = parseFloat(endStr);

	// Validate parsed values
	if (isNaN(start) || isNaN(end) || start < 0 || end <= start) {
		return null;
	}

	return { start, end };
}

/**
 * Gets first non-empty string from an array of strings.
 *
 * @param labels - Array of label strings
 * @returns First non-empty label or null
 */
function getFirstLabel(labels: string[]): string | null {
	return labels.length > 0 && labels[0] ? labels[0] : null;
}

/**
 * Extracts a label from an IIIF language map.
 *
 * Prefers English ('en') labels, falling back to the first available language.
 * Returns a fallback string if no label is present.
 *
 * @param labelMap - IIIF language map (optional)
 * @returns Label string
 */
function extractLabel(labelMap?: Record<string, string[]>): string {
	if (!labelMap) {
		return 'Untitled Chapter';
	}

	// Prefer English labels
	const enLabel = labelMap['en'] && getFirstLabel(labelMap['en']);
	if (enLabel) {
		return enLabel;
	}

	// Fall back to first available language
	for (const labels of Object.values(labelMap)) {
		const label = getFirstLabel(labels);
		if (label) {
			return label;
		}
	}

	return 'Untitled Chapter';
}

/**
 * Extracts thumbnail URL from IIIF thumbnail array.
 *
 * @param thumbnails - Array of IIIF thumbnail objects (optional)
 * @returns Thumbnail URL or undefined
 */
function extractThumbnail(thumbnails?: Array<{ id: string; type: string }>): string | undefined {
	if (!thumbnails || thumbnails.length === 0) {
		return undefined;
	}

	return thumbnails[0]?.id;
}

/**
 * Extracts metadata as key-value pairs from IIIF metadata array.
 *
 * Converts IIIF's structured metadata format (label/value pairs with language maps)
 * into a simple Record<string, string> for easier consumption.
 *
 * @param metadata - Array of IIIF metadata objects (optional)
 * @returns Metadata as key-value pairs or undefined
 */
function extractMetadata(
	metadata?: Array<{
		label: Record<string, string[]>;
		value: Record<string, string[]>;
	}>
): Record<string, string> | undefined {
	if (!metadata || metadata.length === 0) {
		return undefined;
	}

	const result: Record<string, string> = {};

	for (const item of metadata) {
		const key = extractLabel(item.label);
		const value = extractLabel(item.value);
		result[key] = value;
	}

	return result;
}
