/**
 * Type definitions for IIIF media parsing utilities
 *
 * @see https://iiif.io/api/presentation/3.0/
 * @see https://www.w3.org/TR/media-frags/
 * @see https://www.w3.org/TR/webvtt1/
 */

/**
 * Chapter data structure parsed from IIIF Range structures
 *
 * Represents a temporal segment in time-based media with optional metadata.
 * Used for scrollytelling choreography, timeline UI, and transcript display.
 *
 * @see https://iiif.io/api/presentation/3.0/#range
 */
export interface Chapter {
	/** Unique identifier for the chapter (from IIIF Range id) */
	id: string;

	/** Human-readable chapter label */
	label: string;

	/** Start time of the chapter in seconds */
	startTime: number;

	/** End time of the chapter in seconds */
	endTime: number;

	/** Optional thumbnail URL for visual representation */
	thumbnail?: string;

	/** Optional metadata key-value pairs from IIIF Range */
	metadata?: Record<string, string>;
}

/**
 * Speaker segment data structure parsed from VTT NOTE directives
 *
 * Represents a temporal segment with speaker identification for semantic styling.
 *
 * @see https://www.w3.org/TR/webvtt1/#introduction-notes
 */
export interface SpeakerSegment {
	/** Speaker name or identifier (e.g., "Narrator", "John Doe") */
	speaker: string;

	/** Start time of the speaker segment in seconds */
	startTime: number;

	/** End time of the speaker segment in seconds */
	endTime: number;
}

/**
 * Temporal fragment parsed from W3C Media Fragment URI
 *
 * Represents time-based targeting for annotations on audio/video content.
 *
 * @see https://www.w3.org/TR/media-frags/#naming-time
 */
export interface TemporalFragment {
	/** Start time in seconds */
	start: number;

	/** End time in seconds (optional per W3C spec) */
	end?: number;
}

/**
 * Spatial fragment parsed from W3C Media Fragment URI
 *
 * Represents region-based targeting for annotations on images/video.
 *
 * @see https://www.w3.org/TR/media-frags/#naming-space
 */
export interface SpatialFragment {
	/** X coordinate (pixels or percentage based on unit) */
	x: number;

	/** Y coordinate (pixels or percentage based on unit) */
	y: number;

	/** Width (pixels or percentage based on unit) */
	width: number;

	/** Height (pixels or percentage based on unit) */
	height: number;

	/** Coordinate unit: 'pixel' (default) or 'percent' */
	unit: 'pixel' | 'percent';
}

/**
 * Parsed annotation target with optional temporal and spatial fragments
 *
 * Result of parsing IIIF annotation targets.
 *
 * @see https://iiif.io/api/presentation/3.0/#annotation
 */
export interface ParsedAnnotationTarget {
	/** Canvas or source URI (without fragment) */
	source: string;

	/** Temporal fragment if present (#t=...) */
	temporal?: TemporalFragment;

	/** Spatial fragment if present (#xywh=...) */
	spatial?: SpatialFragment;
}
