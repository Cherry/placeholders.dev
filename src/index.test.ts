import {
	afterAll,
	beforeAll,
	describe,
	expect,
	it,
	test,
} from 'vitest';
import { unstable_dev } from 'wrangler';

import { getKeys } from './utils';

import type { UnstableDevWorker } from 'wrangler';

describe('Worker', () => {
	let worker: UnstableDevWorker;

	beforeAll(async () => {
		worker = await unstable_dev('src/index.ts', {
			experimental: {
				disableExperimentalWarning: true,
			},
		});
	});

	afterAll(async () => {
		await worker.stop();
	});

	it('should return html landing page', async () => {
		const req = new Request('https://example.com', { method: 'GET' });
		const resp = await worker.fetch(req.url);
		expect(resp.status).toBe(200);

		// check if html is returned
		const headers = resp.headers;
		expect(headers.get('content-type')).toBe('text/html; charset=utf-8');
		const text = await resp.text();
		expect(text).toMatch(/^<!DOCTYPE html>/);
	});

	it('should sanitize for XSS', async () => {
		const req = new Request('https://example.com/api/?width=350&height=100&text=Hello%20World&bgColor=%22%3E%3Cscript%3Ealert(%22XSS%22);%3C/script%3E', { method: 'GET' });
		const resp = await worker.fetch(req.url);
		expect(resp.status).toBe(200);

		const text = await resp.text();
		expect(text).toBe('<svg xmlns="http://www.w3.org/2000/svg" width="350" height="100" viewBox="0 0 350 100"><rect fill="#ddd" width="350" height="100"/><text fill="rgba(0,0,0,0.5)" font-family="sans-serif" font-size="20" dy="7" font-weight="bold" x="50%" y="50%" text-anchor="middle">Hello World</text></svg>');
	});

	test.each([
		// basic tests
		[
			{
				width: 350,
				height: 100,
			},
			'<svg xmlns="http://www.w3.org/2000/svg" width="350" height="100" viewBox="0 0 350 100"><rect fill="#ddd" width="350" height="100"/><text fill="rgba(0,0,0,0.5)" font-family="sans-serif" font-size="20" dy="7" font-weight="bold" x="50%" y="50%" text-anchor="middle">350×100</text></svg>',
		],
		[
			{
				width: 200,
				height: 100,
				bgColor: '#000',
				textColor: 'rgba(255,255,255,0.5)',
			},
			'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect fill="#000" width="200" height="100"/><text fill="rgba(255,255,255,0.5)" font-family="sans-serif" font-size="20" dy="7" font-weight="bold" x="50%" y="50%" text-anchor="middle">200×100</text></svg>',
		],
		[
			{
				width: 140,
				height: 100,
				bgColor: '#313131',
				textColor: '#dfdfde',
			},
			'<svg xmlns="http://www.w3.org/2000/svg" width="140" height="100" viewBox="0 0 140 100"><rect fill="#313131" width="140" height="100"/><text fill="#dfdfde" font-family="sans-serif" font-size="20" dy="7" font-weight="bold" x="50%" y="50%" text-anchor="middle">140×100</text></svg>',
		],
		[
			{
				width: 350,
				height: 100,
				text: 'placeholders.dev',
			},
			'<svg xmlns="http://www.w3.org/2000/svg" width="350" height="100" viewBox="0 0 350 100"><rect fill="#ddd" width="350" height="100"/><text fill="rgba(0,0,0,0.5)" font-family="sans-serif" font-size="20" dy="7" font-weight="bold" x="50%" y="50%" text-anchor="middle">placeholders.dev</text></svg>',
		],
		[
			{
				width: 1055,
				height: 100,
				text: 'Hello World',
				bgColor: '#434343',
				textColor: '#dfdfde',
			},
			'<svg xmlns="http://www.w3.org/2000/svg" width="1055" height="100" viewBox="0 0 1055 100"><rect fill="#434343" width="1055" height="100"/><text fill="#dfdfde" font-family="sans-serif" font-size="20" dy="7" font-weight="bold" x="50%" y="50%" text-anchor="middle">Hello World</text></svg>',
		],
		// text wrapping
		[
			{
				width: 250,
				height: 200,
				text: 'This text is too long',
				bgColor: '#f7f6f6',
				textWrap: false,
			},
			'<svg xmlns="http://www.w3.org/2000/svg" width="250" height="200" viewBox="0 0 250 200"><rect fill="#f7f6f6" width="250" height="200"/><text fill="rgba(0,0,0,0.5)" font-family="sans-serif" font-size="40" dy="14" font-weight="bold" x="50%" y="50%" text-anchor="middle">This text is too long</text></svg>',
		],
		[
			{
				width: 250,
				height: 200,
				text: 'This text is too long',
				bgColor: '#f7f6f6',
				textWrap: true,
			},
			'<svg xmlns="http://www.w3.org/2000/svg" width="250" height="200" viewBox="0 0 250 200"><rect fill="#f7f6f6" width="250" height="200"/><foreignObject width="250" height="200"><div xmlns="http://www.w3.org/1999/xhtml" style="align-items: center;box-sizing: border-box;color: rgba(0,0,0,0.5);display: flex;font-family: sans-serif;font-size: 40px;font-weight: bold;height: 100%;line-height: 1.2;justify-content: center;padding: 0.5em;text-align: center;width: 100%;">This text is too long</div> </foreignObject></svg>',
		],
	])('should return accurate svg image with query params %s', async (query, expected) => {
		const searchParams = new URLSearchParams();
		for (const key of getKeys(query)) {
			searchParams.set(key, String(query[key]));
		}
		const req = new Request(`https://example.com/api/?${searchParams.toString()}`, { method: 'GET' });
		const resp = await worker.fetch(req.url);
		expect(resp.status).toBe(200);

		const text = await resp.text();
		expect(text).toBe(expected);
	});
});
