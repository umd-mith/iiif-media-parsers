# iiif-media-parsers

[![CI](https://github.com/umd-mith/iiif-media-parsers/actions/workflows/ci.yml/badge.svg)](https://github.com/umd-mith/iiif-media-parsers/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@umd-mith/iiif-media-parsers)](https://www.npmjs.com/package/@umd-mith/iiif-media-parsers)

Lightweight TypeScript utilities for parsing IIIF time-based media structures,
W3C Media Fragments, and WebVTT speaker annotations.

## Features

- Parse IIIF Range structures into chapter data
- Extract speaker segments from WebVTT voice tags
- Parse W3C Media Fragment URIs (temporal + spatial)
- Zero runtime dependencies
- Full TypeScript support with strict types
- ESM-only, tree-shakeable

## Installation

```bash
npm install @umd-mith/iiif-media-parsers
```

## Quick Start

```typescript
import {
  parseRanges,
  parseSpeakers,
  parseAnnotationTarget
} from '@umd-mith/iiif-media-parsers';

// Parse chapters from IIIF manifest
const chapters = parseRanges(manifest);
// => [{ id: 'range-1', label: 'Introduction', startTime: 0, endTime: 30 }]

// Extract speakers from WebVTT
const speakers = parseSpeakers(vttContent);
// => [{ speaker: 'Narrator', startTime: 0, endTime: 120 }]

// Parse media fragment URI
const target = parseAnnotationTarget('https://example.org/canvas#t=10,20');
// => { source: 'https://example.org/canvas', temporal: { start: 10, end: 20 } }
```

## API Reference

### parseRanges(manifest)

Parses IIIF Presentation API v3 Range structures into chapter objects.

```typescript
import { parseRanges } from '@umd-mith/iiif-media-parsers';

const manifest = {
  id: 'https://example.org/manifest',
  type: 'Manifest',
  structures: [
    {
      id: 'range-1',
      type: 'Range',
      label: { en: ['Introduction'] },
      items: [{ id: 'canvas#t=0,30', type: 'Canvas' }]
    },
    {
      id: 'range-2',
      type: 'Range',
      label: { en: ['Main Content'] },
      items: [{ id: 'canvas#t=30,120', type: 'Canvas' }]
    }
  ]
};

const chapters = parseRanges(manifest);
// => [
//   { id: 'range-1', label: 'Introduction', startTime: 0, endTime: 30 },
//   { id: 'range-2', label: 'Main Content', startTime: 30, endTime: 120 }
// ]
```

**Parameters:**
- `manifest` - IIIF Presentation API v3 Manifest object

**Returns:** `Chapter[]` - Array of chapters sorted by startTime

### parseSpeakers(vttContent)

Extracts speaker segments from WebVTT voice tags (`<v>`).

```typescript
import { parseSpeakers } from '@umd-mith/iiif-media-parsers';

const vtt = `WEBVTT

00:00:00.000 --> 00:00:10.000
<v Mary Johnson>I remember when the community center first opened.

00:00:10.000 --> 00:00:25.000
<v Mary Johnson>It was such an important place for all of us.

00:00:25.000 --> 00:00:40.000
<v Interviewer>Can you tell me more about those early days?`;

const segments = parseSpeakers(vtt);
// => [
//   { speaker: 'Mary Johnson', startTime: 0, endTime: 25 },
//   { speaker: 'Interviewer', startTime: 25, endTime: 40 }
// ]
```

**Parameters:**
- `vttContent` - Raw WebVTT file content as string

**Returns:** `SpeakerSegment[]` - Array of speaker segments sorted by startTime

### parseAnnotationTarget(target)

Parses IIIF annotation targets, extracting temporal and spatial fragments.

```typescript
import { parseAnnotationTarget } from '@umd-mith/iiif-media-parsers';

// Simple string URI with temporal fragment
const result1 = parseAnnotationTarget('https://example.org/canvas#t=10,20');
// => { source: 'https://example.org/canvas', temporal: { start: 10, end: 20 } }

// Spatial fragment (for images/video regions)
const result2 = parseAnnotationTarget('https://example.org/canvas#xywh=100,200,50,75');
// => { source: '...', spatial: { x: 100, y: 200, width: 50, height: 75, unit: 'pixel' } }

// SpecificResource with FragmentSelector
const result3 = parseAnnotationTarget({
  type: 'SpecificResource',
  source: 'https://example.org/canvas',
  selector: { type: 'FragmentSelector', value: 't=10,20' }
});
// => { source: 'https://example.org/canvas', temporal: { start: 10, end: 20 } }
```

**Parameters:**
- `target` - String URI or SpecificResource object

**Returns:** `ParsedAnnotationTarget | null`

### parseMediaFragment(uri)

Low-level parser for W3C Media Fragment URIs.

```typescript
import { parseMediaFragment } from '@umd-mith/iiif-media-parsers';

// Temporal fragments
parseMediaFragment('https://example.org/video#t=10,20');
// => { source: '...', temporal: { start: 10, end: 20 } }

parseMediaFragment('https://example.org/video#t=10');
// => { source: '...', temporal: { start: 10 } }  // end optional

parseMediaFragment('https://example.org/video#t=,20');
// => { source: '...', temporal: { start: 0, end: 20 } }  // from beginning

// Spatial fragments
parseMediaFragment('https://example.org/image#xywh=100,200,50,75');
// => { source: '...', spatial: { x: 100, y: 200, width: 50, height: 75, unit: 'pixel' } }

parseMediaFragment('https://example.org/image#xywh=percent:10,20,30,40');
// => { source: '...', spatial: { ..., unit: 'percent' } }
```

## Types

### Chapter

```typescript
interface Chapter {
  id: string;           // Unique identifier from IIIF Range
  label: string;        // Human-readable chapter label
  startTime: number;    // Start time in seconds
  endTime: number;      // End time in seconds
  thumbnail?: string;   // Optional thumbnail URL
  metadata?: Record<string, string>;  // Optional key-value metadata
}
```

### SpeakerSegment

```typescript
interface SpeakerSegment {
  speaker: string;      // Speaker name from <v> tag
  startTime: number;    // Start time in seconds
  endTime: number;      // End time in seconds
}
```

### TemporalFragment

```typescript
interface TemporalFragment {
  start: number;        // Start time in seconds
  end?: number;         // End time in seconds (optional per W3C spec)
}
```

### SpatialFragment

```typescript
interface SpatialFragment {
  x: number;            // X coordinate
  y: number;            // Y coordinate
  width: number;        // Width
  height: number;       // Height
  unit: 'pixel' | 'percent';  // Coordinate unit
}
```

### ParsedAnnotationTarget

```typescript
interface ParsedAnnotationTarget {
  source: string;                // Canvas/source URI without fragment
  temporal?: TemporalFragment;   // Temporal fragment if present
  spatial?: SpatialFragment;     // Spatial fragment if present
}
```

## Examples

### Oral History Interview Navigation

Build a chapter-based timeline for oral history recordings:

```typescript
import { parseRanges, parseSpeakers } from '@umd-mith/iiif-media-parsers';

// Load IIIF manifest and VTT transcript
const manifest = await fetch(manifestUrl).then(r => r.json());
const vtt = await fetch(transcriptUrl).then(r => r.text());

// Extract navigation data
const chapters = parseRanges(manifest);
const speakers = parseSpeakers(vtt);

// Build timeline UI
chapters.forEach(chapter => {
  const chapterSpeakers = speakers.filter(
    s => s.startTime >= chapter.startTime && s.startTime < chapter.endTime
  );
  console.log(`${chapter.label}: ${chapterSpeakers.map(s => s.speaker).join(', ')}`);
});
```

### Annotation Playback

Jump to specific moments from IIIF annotations:

```typescript
import { parseAnnotationTarget } from '@umd-mith/iiif-media-parsers';

// From IIIF annotation
const annotation = {
  type: 'Annotation',
  target: 'https://example.org/canvas#t=45.5,52.3'
};

const parsed = parseAnnotationTarget(annotation.target);
if (parsed?.temporal) {
  videoPlayer.currentTime = parsed.temporal.start;
  videoPlayer.play();
}
```

## Specifications

This library implements:

- [W3C Media Fragments URI 1.0](https://www.w3.org/TR/media-frags/) - temporal and spatial targeting
- [IIIF Presentation API 3.0](https://iiif.io/api/presentation/3.0/) - Range structures
- [WebVTT](https://www.w3.org/TR/webvtt1/) - voice tags for speaker metadata

## Security Considerations

Labels and metadata from IIIF manifests may contain user-controlled content.
Always escape output before DOM insertion to prevent XSS:

```typescript
// Safe - uses textContent
element.textContent = chapter.label;

// Safe - uses DOM API
const textNode = document.createTextNode(chapter.label);
element.appendChild(textNode);
```

## Compatibility

- **Node.js:** 20.x, 22.x
- **Browsers:** ES2020+ (Chrome 80+, Firefox 78+, Safari 14+)
- **Module format:** ESM only (no CommonJS)
- **TypeScript:** 5.0+

## AI Assistance

This package was developed using Anthropic's Claude as a generative coding tool,
with human direction and review.

**Process:** AI generated initial implementations, tests, and documentation based
on W3C and IIIF specifications. Human maintainers directed requirements, reviewed
all outputs, and take full responsibility for the final code.

**Acknowledgment:** We recognize that AI capabilities derive in part from the
collective labor of programmers whose public work became training data, and that
our open-source output depends on proprietary AI infrastructure.

Following [Apache](https://www.apache.org/legal/generative-tooling.html) and
[OpenInfra](https://openinfra.org/legal/ai-policy/) guidance, we use `Assisted-by:`
commit trailers for ongoing contributions.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass (`pnpm test`)
5. Submit a pull request

For AI-assisted contributions, include commit trailers:
```
Assisted-by: Claude <noreply@anthropic.com>
```

## License

MIT License - see [LICENSE](LICENSE) for details.
