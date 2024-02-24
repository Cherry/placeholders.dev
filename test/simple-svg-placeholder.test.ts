import { describe, expect, test } from 'vitest';

import { type Options, simpleSvgPlaceholder } from '../src/simple-svg-placeholder';

describe('simpleSVGPlaceholder', () => {
	const testOptions: Options[] = [
		{
			dataUri: true,
			width: 100,
			height: 100,
		},
		{
			dataUri: false,
			width: 100,
			height: 100,
		},
		{
			dataUri: false,
			width: 300,
			height: 300,
			text: 'Hello World',
		},
		{
			dataUri: false,
			width: 1920,
			height: 1080,
			text: 'Hello World',
			textColor: '#fff',
			bgColor: '#000',
		},
		{
			dataUri: false,
			width: 1920,
			height: 1080,
			text: 'Hello World',
			textColor: 'rgba(255,255,255,0.5)',
			bgColor: 'rgba(0,0,0,0.5)',
		},
		{
			dataUri: false,
			width: 300,
			height: 300,
			text: 'Some super long string',
			textColor: 'rgba(255,255,255,0.5)',
			bgColor: 'rgba(0,0,0,0.5)',
		},
		{
			dataUri: false,
			width: 300,
			height: 300,
			text: 'Some super long string',
			textColor: 'rgba(255,255,255,0.5)',
			bgColor: 'rgba(0,0,0,0.5)',
			textWrap: true,
		},
	];

	test.each(testOptions)('should return accurate svg placeholder for %s', (options) => {
		const svg = simpleSvgPlaceholder(options);
		expect(svg).toMatchSnapshot();
	});
});
