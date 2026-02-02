/**
 * IIIF Range Structure Parser
 *
 * Parses IIIF Presentation API v3 Range structures into Chapter objects.
 * Supports nested ranges (recursive parsing) and temporal fragment extraction.
 *
 * @see https://iiif.io/api/presentation/3.0/#range
 */
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
export function parseRanges(manifest) {
	if (!manifest.structures || manifest.structures.length === 0) {
		return [];
	}
	const chapters = [];
	// Build canvas duration lookup map for resolving open-ended fragments
	const canvasDurations = buildCanvasDurationMap(manifest.items);
	// Process each top-level range
	for (const range of manifest.structures) {
		processRange(range, chapters, canvasDurations);
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
 * @param canvasDurations - Map of canvas IDs to durations for resolving open-ended fragments
 */
function processRange(range, chapters, canvasDurations) {
	if (!range || !range.items || range.items.length === 0) {
		return;
	}
	// Check if this range has direct temporal fragments
	const temporalItems = range.items.filter(
		(item) => item.type === 'Canvas' && hasTemporalFragment(item.id)
	);
	if (temporalItems.length > 0) {
		// This range has temporal fragments - create a chapter
		const chapter = createChapterFromRange(range, temporalItems, canvasDurations);
		if (chapter) {
			chapters.push(chapter);
		}
	}
	// Recursively process nested ranges
	const nestedRanges = range.items.filter((item) => item.type === 'Range');
	for (const nestedRange of nestedRanges) {
		processRange(nestedRange, chapters, canvasDurations);
	}
}
/**
 * Creates a Chapter object from a Range with temporal fragments.
 *
 * Extracts start and end times from the first temporal fragment in the range.
 * For open-ended fragments (no end time), resolves end from canvas duration.
 * Supports float timestamps and handles malformed fragments gracefully.
 *
 * @param range - IIIF Range object
 * @param items - Array of Canvas items with temporal fragments
 * @param canvasDurations - Map of canvas IDs to durations
 * @returns Chapter object or null if parsing fails
 */
function createChapterFromRange(range, items, canvasDurations) {
	// Use first temporal fragment for timing
	const firstItem = items[0];
	if (!firstItem) {
		return null;
	}
	const timing = extractTemporalFragment(firstItem.id);
	if (!timing) {
		return null;
	}
	// Resolve end time for open-ended fragments using canvas duration
	let endTime = timing.end;
	if (endTime === undefined) {
		const canvasId = extractCanvasId(firstItem.id);
		const duration = canvasDurations.get(canvasId);
		if (duration !== undefined) {
			endTime = duration;
		} else {
			// Cannot determine end time - skip this chapter
			return null;
		}
	}
	const label = extractLabel(range.label);
	const thumbnail = extractThumbnail(range.thumbnail);
	const metadata = extractMetadata(range.metadata);
	// Build result conditionally (exactOptionalPropertyTypes)
	const chapter = {
		id: range.id,
		label,
		startTime: timing.start,
		endTime
	};
	if (thumbnail) chapter.thumbnail = thumbnail;
	if (metadata) chapter.metadata = metadata;
	return chapter;
}
/**
 * Checks if a Canvas ID contains a temporal fragment.
 *
 * @param canvasId - Canvas identifier (may include Media Fragment)
 * @returns True if the ID contains a `#t=` fragment
 */
function hasTemporalFragment(canvasId) {
	return canvasId.includes('#t=');
}
/**
 * Extracts temporal timing from a Media Fragment URI.
 *
 * Parses Media Fragments per W3C Media Fragments URI spec:
 * - `#t=10,20` - start and end times
 * - `#t=10` - start time only (end resolved from canvas duration)
 * - `#t=10.5,25.75` - floating point precision supported
 *
 * @param canvasId - Canvas ID with temporal fragment
 * @returns Object with start and optional end times, or null if malformed
 *
 * @see https://www.w3.org/TR/media-frags/#naming-time
 */
function extractTemporalFragment(canvasId) {
	// W3C Media Fragments spec: t=start[,end]
	const match = canvasId.match(/#t=([0-9.]+)(?:,([0-9.]+))?$/);
	if (!match) {
		return null;
	}
	const start = parseFloat(match[1]);
	if (isNaN(start) || start < 0) {
		return null;
	}
	const endStr = match[2];
	if (!endStr) {
		// Open-ended fragment - end will be resolved from canvas duration
		return { start };
	}
	const end = parseFloat(endStr);
	if (isNaN(end) || end <= start) {
		return null;
	}
	return { start, end };
}
/**
 * Builds a map of canvas IDs to their durations for resolving open-ended fragments.
 *
 * @param canvases - Array of IIIF Canvas objects from manifest.items
 * @returns Map of canvas ID to duration
 */
function buildCanvasDurationMap(canvases) {
	const map = new Map();
	if (!canvases) {
		return map;
	}
	for (const canvas of canvases) {
		if (canvas.id && canvas.duration !== undefined) {
			map.set(canvas.id, canvas.duration);
		}
	}
	return map;
}
/**
 * Extracts the base canvas ID from a URI with fragment.
 *
 * @param canvasIdWithFragment - Canvas ID possibly containing fragment (e.g., "canvas#t=10")
 * @returns Base canvas ID without fragment
 */
function extractCanvasId(canvasIdWithFragment) {
	const hashIndex = canvasIdWithFragment.indexOf('#');
	return hashIndex === -1 ? canvasIdWithFragment : canvasIdWithFragment.slice(0, hashIndex);
}
/**
 * Gets first non-empty string from an array of strings.
 *
 * @param labels - Array of label strings
 * @returns First non-empty label or null
 */
function getFirstLabel(labels) {
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
function extractLabel(labelMap) {
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
function extractThumbnail(thumbnails) {
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
function extractMetadata(metadata) {
	if (!metadata || metadata.length === 0) {
		return undefined;
	}
	const result = {};
	for (const item of metadata) {
		const key = extractLabel(item.label);
		const value = extractLabel(item.value);
		result[key] = value;
	}
	return result;
}
//# sourceMappingURL=parseRanges.js.map
