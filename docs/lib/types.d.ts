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
 * Speaker segment data structure parsed from VTT voice tags
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
 * Supports all W3C Media Fragments temporal patterns:
 * - `#t=10,20` (start and end)
 * - `#t=10` (start only, end optional)
 * - `#t=,20` (from beginning to end time)
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
 * Supports pixel and percentage coordinate systems per W3C spec:
 * - `#xywh=100,200,50,75` (pixels, default)
 * - `#xywh=percent:10,20,30,40` (percentages)
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
 * Result of parsing IIIF annotation targets, supporting both:
 * - Simple string URIs: `"https://example.org/canvas#t=10,20"`
 * - SpecificResource with FragmentSelector
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
/**
 * IIIF content resource types that can be annotation targets.
 * @see https://iiif.io/api/presentation/3.0/#55-annotation-page
 */
export type IIIFResourceType = 'Canvas' | 'Image' | 'Sound' | 'Video';
/**
 * Input type for annotation targets.
 * Can be a simple string URI or a SpecificResource object.
 */
export type AnnotationTargetInput =
	| string
	| {
			type: 'SpecificResource';
			source:
				| string
				| {
						id: string;
						type?: IIIFResourceType;
				  };
			selector?: {
				type: 'FragmentSelector' | string;
				value?: string;
				conformsTo?: string;
			};
	  };
//# sourceMappingURL=types.d.ts.map
