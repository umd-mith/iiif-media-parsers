/**
 * Interactive demo for the iiif-media-parsers showcase site.
 *
 * Imports the library's ESM bundle and wires up the live parser UI.
 * Also loads pre-computed fixture data into the showcase tables.
 */

import { parseRanges, parseSpeakers, parseAnnotationTarget } from './lib/index.js';
import { formatTimestamp, processFixture } from './lib/buildDocs.js';

// --- DOM helpers (safe text insertion, no innerHTML with user data) ---

function el(tag, textContent) {
	const node = document.createElement(tag);
	if (textContent !== undefined) node.textContent = textContent;
	return node;
}

function clearChildren(node) {
	while (node.firstChild) node.removeChild(node.firstChild);
}

function buildTableRow(cells) {
	const tr = document.createElement('tr');
	for (const text of cells) {
		tr.appendChild(el('td', text));
	}
	return tr;
}

function buildTable(headers, rows) {
	const table = document.createElement('table');
	table.setAttribute('role', 'grid');

	const thead = document.createElement('thead');
	const headerRow = document.createElement('tr');
	for (const h of headers) {
		headerRow.appendChild(el('th', h));
	}
	thead.appendChild(headerRow);
	table.appendChild(thead);

	const tbody = document.createElement('tbody');
	for (const row of rows) {
		tbody.appendChild(buildTableRow(row));
	}
	table.appendChild(tbody);

	return table;
}

// --- Fixture showcase ---

async function loadFixture(id, inputEl, tableEl) {
	const resp = await fetch(`fixtures/${id}.json`);
	const data = await resp.json();

	// Show raw structures from the embedded fixture data
	inputEl.querySelector('code').textContent = JSON.stringify(data.structures, null, 2);

	// Populate table
	const tbody = tableEl.querySelector('tbody');
	clearChildren(tbody);
	for (const ch of data.chapters) {
		tbody.appendChild(buildTableRow([ch.label, ch.startTime, ch.endTime]));
	}
}

// --- Live parser: parseRanges ---

function renderChaptersTable(chapters, container) {
	clearChildren(container);

	if (chapters.length === 0) {
		const p = el('p');
		p.appendChild(el('em', 'No Range structures found in this manifest.'));
		container.appendChild(p);
		return;
	}

	const display = processFixture(chapters);
	const rows = display.map((ch) => [ch.label, ch.startTime, ch.endTime]);
	container.appendChild(buildTable(['Label', 'Start', 'End'], rows));
}

function setParseStatus(text) {
	const status = document.getElementById('parse-status');
	if (status) status.textContent = text;
}

function handleParse() {
	const input = document.getElementById('manifest-input');
	const output = document.getElementById('ranges-output');

	setParseStatus('');

	let manifest;
	try {
		manifest = JSON.parse(input.value);
	} catch (e) {
		clearChildren(output);
		const p = el('p', 'Invalid JSON: ' + e.message);
		p.className = 'parse-error';
		output.appendChild(p);
		return;
	}

	try {
		const chapters = parseRanges(manifest);
		renderChaptersTable(chapters, output);
		if (chapters.length > 0) {
			setParseStatus(chapters.length + ' chapter' + (chapters.length === 1 ? '' : 's') + ' parsed');
		}
	} catch (e) {
		clearChildren(output);
		const p = el('p', 'Parse error: ' + e.message);
		p.className = 'parse-error';
		output.appendChild(p);
	}
}

function handleClear() {
	const input = document.getElementById('manifest-input');
	const output = document.getElementById('ranges-output');
	input.value = '';
	clearChildren(output);
	const p = el('p', 'Paste a IIIF manifest and click Parse.');
	p.className = 'output-placeholder';
	output.appendChild(p);
	setParseStatus('');
	input.focus();
}

// --- Live parser: parseAnnotationTarget ---

function handleParseTarget() {
	const input = document.getElementById('target-input');
	const output = document.getElementById('target-output');
	const value = input.value.trim();

	if (!value) {
		output.querySelector('code').textContent = 'Enter an annotation target URI above.';
		return;
	}

	const result = parseAnnotationTarget(value);
	output.querySelector('code').textContent = JSON.stringify(result, null, 2);
}

// --- Live parser: parseSpeakers ---

function handleParseSpeakers() {
	const input = document.getElementById('vtt-input');
	const output = document.getElementById('speakers-output');
	const value = input.value.trim();

	clearChildren(output);

	if (!value) {
		const p = el('p');
		p.appendChild(el('em', 'Paste WebVTT content with voice tags above.'));
		output.appendChild(p);
		return;
	}

	const segments = parseSpeakers(value);
	if (segments.length === 0) {
		const p = el('p');
		p.appendChild(el('em', 'No voice tags found. Use <v Speaker> syntax in cues.'));
		output.appendChild(p);
		return;
	}

	const rows = segments.map((seg) => [
		seg.speaker,
		formatTimestamp(seg.startTime),
		formatTimestamp(seg.endTime)
	]);
	output.appendChild(buildTable(['Speaker', 'Start', 'End'], rows));
}

// --- Default VTT for the speakers textarea ---

const defaultVtt = `WEBVTT

00:00:00.000 --> 00:00:08.500
<v Interviewer>Can you tell us about your experience?

00:00:08.500 --> 00:00:25.000
<v Subject>Well, it started back in 1965 when I first
moved to the city.

00:00:25.000 --> 00:00:30.000
<v Interviewer>What was that like?

00:00:30.000 --> 00:00:45.500
<v Subject>It was challenging but exciting.`;

// --- Default manifest for the textarea ---

const defaultManifest = {
	'@context': 'http://iiif.io/api/presentation/3/context.json',
	id: 'https://example.org/manifest',
	type: 'Manifest',
	items: [
		{
			id: 'https://example.org/canvas/1',
			type: 'Canvas',
			duration: 300
		}
	],
	structures: [
		{
			type: 'Range',
			id: 'https://example.org/range/1',
			label: { en: ['Introduction'] },
			items: [
				{
					type: 'Canvas',
					id: 'https://example.org/canvas/1#t=0,120'
				}
			]
		},
		{
			type: 'Range',
			id: 'https://example.org/range/2',
			label: { en: ['Main Content'] },
			items: [
				{
					type: 'Canvas',
					id: 'https://example.org/canvas/1#t=120,250'
				}
			]
		},
		{
			type: 'Range',
			id: 'https://example.org/range/3',
			label: { en: ['Conclusion'] },
			items: [
				{
					type: 'Canvas',
					id: 'https://example.org/canvas/1#t=250,300'
				}
			]
		}
	]
};

// --- Theme toggle ---

function initTheme() {
	const saved = localStorage.getItem('theme');
	if (saved) {
		document.documentElement.setAttribute('data-theme', saved);
	}
}

function toggleTheme() {
	const current = document.documentElement.getAttribute('data-theme');
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

	let next;
	if (current === 'dark' || (!current && prefersDark)) {
		next = 'light';
	} else {
		next = 'dark';
	}

	document.documentElement.setAttribute('data-theme', next);
	localStorage.setItem('theme', next);
}

// Apply saved theme immediately to avoid flash
initTheme();

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
	// Load fixtures
	loadFixture(
		'cookbook-0026',
		document.getElementById('fixture-0026-input'),
		document.getElementById('fixture-0026-table')
	);
	loadFixture(
		'cookbook-0065',
		document.getElementById('fixture-0065-input'),
		document.getElementById('fixture-0065-table')
	);

	// Pre-populate and auto-parse the textarea
	const input = document.getElementById('manifest-input');
	input.value = JSON.stringify(defaultManifest, null, 2);
	handleParse();

	// Pre-populate and auto-parse the VTT textarea
	const vttInput = document.getElementById('vtt-input');
	vttInput.value = defaultVtt;
	handleParseSpeakers();

	// Pre-populate the annotation target input
	document.getElementById('target-input').value =
		'https://example.org/canvas/1#t=30,60&xywh=100,100,300,300';
	handleParseTarget();

	// Wire up buttons
	document.getElementById('parse-btn').addEventListener('click', handleParse);
	document.getElementById('clear-btn').addEventListener('click', handleClear);
	document.getElementById('parse-target-btn').addEventListener('click', handleParseTarget);
	document.getElementById('parse-speakers-btn').addEventListener('click', handleParseSpeakers);
	document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
});
