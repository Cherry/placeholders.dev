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
		expect(text).toMatchSnapshot();
	});

	it('should sanitize for CSS prop injection', async () => {
		const req = new Request('https://example.com/api/?width=450&height=450&text=James&fontFamily=test;background:url(https://avatars.githubusercontent.com/u/856748?v=4)&textWrap=true', { method: 'GET' });
		const resp = await worker.fetch(req.url);
		expect(resp.status).toBe(200);

		const text = await resp.text();
		expect(text).toMatchSnapshot();
	});

	test.each([
		// basic tests
		[
			{
				width: 350,
				height: 100,
			},
		],
		[
			{
				width: 200,
				height: 100,
				bgColor: '#000',
				textColor: 'rgba(255,255,255,0.5)',
			},
		],
		[
			{
				width: 140,
				height: 100,
				bgColor: '#313131',
				textColor: '#dfdfde',
			},
		],
		[
			{
				width: 350,
				height: 100,
				text: 'placeholders.dev',
			},
		],
		[
			{
				width: 1055,
				height: 100,
				text: 'Hello World',
				bgColor: '#434343',
				textColor: '#dfdfde',
			},
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
		],
		[
			{
				width: 250,
				height: 200,
				text: 'This text is too long',
				bgColor: '#f7f6f6',
				textWrap: true,
			},
		],
	])('should return accurate svg image with query params %s', async (query) => {
		const searchParams = new URLSearchParams();
		for (const key of getKeys(query)) {
			searchParams.set(key, String(query[key]));
		}
		const req = new Request(`https://example.com/api/?${searchParams.toString()}`, { method: 'GET' });
		const resp = await worker.fetch(req.url);
		expect(resp.status).toBe(200);

		const text = await resp.text();
		expect(text).toMatchSnapshot();
	});
});
