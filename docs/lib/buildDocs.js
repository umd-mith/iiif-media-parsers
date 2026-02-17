/**
 * Utilities for generating the GitHub Pages showcase site.
 *
 * Transforms raw parser output into display-ready formats
 * for the fixture showcase and live demo sections.
 */
/**
 * Format a duration in seconds to a human-readable timestamp.
 *
 * @example
 * formatTimestamp(3971.24) // "1:06:11.24"
 * formatTimestamp(90)      // "1:30"
 * formatTimestamp(0)       // "0:00"
 */
export function formatTimestamp(totalSeconds) {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const wholeSeconds = Math.floor(totalSeconds % 60);
	const fractional = totalSeconds % 1;
	const secondsStr = wholeSeconds.toString().padStart(2, '0');
	const minutesStr = hours > 0 ? minutes.toString().padStart(2, '0') : minutes.toString();
	let result = hours > 0 ? `${hours}:${minutesStr}:${secondsStr}` : `${minutesStr}:${secondsStr}`;
	if (fractional > 0) {
		// Remove trailing zeros but keep meaningful precision
		const fracStr = fractional.toFixed(10).slice(1).replace(/0+$/, '');
		result += fracStr;
	}
	return result;
}
/**
 * Transform parsed Chapter[] into display-ready objects
 * with formatted timestamps for the showcase site.
 */
export function processFixture(chapters) {
	return chapters.map((ch) => ({
		id: ch.id,
		label: ch.label,
		startTime: formatTimestamp(ch.startTime),
		endTime: formatTimestamp(ch.endTime)
	}));
}
//# sourceMappingURL=buildDocs.js.map
