/**
 * Utilities for generating the GitHub Pages showcase site.
 *
 * Transforms raw parser output into display-ready formats
 * for the fixture showcase and live demo sections.
 */
import type { Chapter } from './types.js';
/** Display-ready chapter with formatted timestamps */
export interface DisplayChapter {
	id: string;
	label: string;
	startTime: string;
	endTime: string;
}
/**
 * Format a duration in seconds to a human-readable timestamp.
 *
 * @example
 * formatTimestamp(3971.24) // "1:06:11.24"
 * formatTimestamp(90)      // "1:30"
 * formatTimestamp(0)       // "0:00"
 */
export declare function formatTimestamp(totalSeconds: number): string;
/**
 * Transform parsed Chapter[] into display-ready objects
 * with formatted timestamps for the showcase site.
 */
export declare function processFixture(chapters: Chapter[]): DisplayChapter[];
//# sourceMappingURL=buildDocs.d.ts.map
