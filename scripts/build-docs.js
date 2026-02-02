#!/usr/bin/env node

/**
 * Build script for the GitHub Pages showcase site.
 *
 * Runs parseRanges against each fixture and writes display-ready
 * JSON to docs/fixtures/. Copies the library's dist/ output into
 * docs/lib/ for direct browser ESM import.
 */

import { readFile, writeFile, cp } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRanges } from '../dist/index.js';
import { processFixture } from '../dist/buildDocs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const fixtures = [
	{
		input: 'src/fixtures/cookbook-0026-opera-toc.json',
		output: 'docs/fixtures/cookbook-0026.json',
		name: 'Cookbook Recipe 0026: Table of Contents (Single Canvas)'
	},
	{
		input: 'src/fixtures/cookbook-0065-opera-multi-canvas.json',
		output: 'docs/fixtures/cookbook-0065.json',
		name: 'Cookbook Recipe 0065: Table of Contents (Multiple Canvases)'
	}
];

async function build() {
	console.log('Building docs site data...\n');

	for (const fixture of fixtures) {
		const raw = await readFile(join(root, fixture.input), 'utf-8');
		const manifest = JSON.parse(raw);
		const chapters = parseRanges(manifest);
		const display = processFixture(chapters);

		const output = {
			name: fixture.name,
			sourceFile: fixture.input,
			chapterCount: display.length,
			chapters: display,
			structures: manifest.structures ?? []
		};

		await writeFile(join(root, fixture.output), JSON.stringify(output, null, '\t'));
		console.log(`  ${fixture.name}: ${display.length} chapters → ${fixture.output}`);
	}

	// Copy dist/ into docs/lib/ for browser ESM import
	await cp(join(root, 'dist'), join(root, 'docs', 'lib'), { recursive: true });
	console.log('\n  Copied dist/ → docs/lib/');

	console.log('\nDone.');
}

build().catch((err) => {
	console.error('Build failed:', err);
	process.exit(1);
});
