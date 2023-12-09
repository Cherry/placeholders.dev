import { describe, expect, it } from 'vitest';

import { sanitizers } from './sanitizers';

describe('Sanitizers', () => {
	it('number', () => {
		expect(sanitizers.width(350)).toBe(350);
		expect(sanitizers.width('350')).toBe(350);
		expect(sanitizers.width(' 350')).toBe(350);
		expect(sanitizers.width(' 350 ')).toBe(350);
		expect(sanitizers.width(350.5)).toBe(350.5);
		expect(sanitizers.width('350.5')).toBe(350.5);
		expect(sanitizers.width('350.50')).toBe(350.5);
		expect(sanitizers.width('0350.50')).toBe(350.5);
		expect(sanitizers.width('')).toBe(null);
		expect(sanitizers.width('abc')).toBe(null);
		expect(sanitizers.width('350abc')).toBe(null);
		expect(sanitizers.width('350 abc')).toBe(null);
		expect(sanitizers.width('abc350')).toBe(null);
		expect(sanitizers.width('abc 350')).toBe(null);
		expect(sanitizers.width('350.5')).toBe(350.5);
		expect(sanitizers.width('350.5abc')).toBe(null);
		expect(sanitizers.width('350.5 abc')).toBe(null);
		expect(sanitizers.width('abc350.5')).toBe(null);
		expect(sanitizers.width('abc 350.5')).toBe(null);
		expect(sanitizers.width('350.5.5')).toBe(null);
		expect(sanitizers.width('350.5.5abc')).toBe(null);
		expect(sanitizers.width('350.5.5 abc')).toBe(null);
		expect(sanitizers.width('abc350.5.5')).toBe(null);
		expect(sanitizers.width('abc 350.5.5')).toBe(null);
		expect(sanitizers.width('350.5.5.5')).toBe(null);
		expect(sanitizers.width('350.5.5.5abc')).toBe(null);
		expect(sanitizers.width('350.5.5.5 abc')).toBe(null);
		expect(sanitizers.width('abc350.5.5.5')).toBe(null);
		expect(sanitizers.width('abc 350.5.5.5')).toBe(null);
		expect(sanitizers.width('350 350')).toBe(null);
		expect(sanitizers.width('350 350.5')).toBe(null);
		expect(sanitizers.width('350.5 350')).toBe(null);
		expect(sanitizers.width('350.5 350.5')).toBe(null);
		expect(sanitizers.width('350 350 350')).toBe(null);
		expect(sanitizers.width('350 350 350 350')).toBe(null);
	});

	it('string', () => {
		expect(sanitizers.text('Hello World')).toBe('Hello World');
		expect(sanitizers.text('')).toBe('');
		expect(sanitizers.text(' <script>alert("XSS");</script> ')).toBe('  ');
		expect(sanitizers.text('<script>alert("XSS");</script>')).toBe('');
		expect(sanitizers.text('<script>alert("XSS");</script>abc')).toBe('abc');
		expect(sanitizers.text('abc<script>alert("XSS");</script>')).toBe('abc');
		expect(sanitizers.text('abc<script>alert("XSS");</script>abc')).toBe('abcabc');
		expect(sanitizers.text('<script>alert("XSS");</script> abc')).toBe(' abc');
		expect(sanitizers.text('abc <script>alert("XSS");</script>')).toBe('abc ');
		expect(sanitizers.text('abc <script>alert("XSS");</script> abc')).toBe('abc  abc');
		expect(sanitizers.text('<script>alert("XSS");</script> abc <script>alert("XSS");</script>')).toBe(' abc ');
		expect(sanitizers.text('bar<strong>foo</strong>')).toBe('barfoo');
		expect(sanitizers.text('bar<em>foo</em>')).toBe('barfoo');
		// @ts-expect-error intentional bad data
		expect(sanitizers.text(123)).toBe('123');
	});

	it('color', () => {
		// double check string sanitization
		expect(sanitizers.bgColor('Hello World')).toBe(null);
		expect(sanitizers.bgColor('')).toBe(null);
		expect(sanitizers.bgColor(' <script>alert("XSS");</script> ')).toBe(null);

		// hex
		expect(sanitizers.bgColor('#000')).toBe('#000');
		expect(sanitizers.bgColor('#000000')).toBe('#000000');
		expect(sanitizers.bgColor('#00000000')).toBe('#00000000');
		expect(sanitizers.bgColor('#000000000')).toBe(null);
		expect(sanitizers.bgColor('#yyy')).toBe(null);
		expect(sanitizers.bgColor('#yyyyyy')).toBe(null);

		// rgb/rgba
		expect(sanitizers.bgColor('rgb(0,0,0)')).toBe('rgb(0,0,0)');
		expect(sanitizers.bgColor('rgb(0, 0, 0)')).toBe('rgb(0, 0, 0)');
		expect(sanitizers.bgColor('rgb(0,0,0,0)')).toBe('rgb(0,0,0,0)');
		expect(sanitizers.bgColor('rgb(a,b,c)')).toBe(null);
		expect(sanitizers.bgColor('rgb(...)')).toBe(null);
		expect(sanitizers.bgColor('rgb(1)')).toBe(null);

		expect(sanitizers.bgColor('rgba(0,0,0,0)')).toBe('rgba(0,0,0,0)');
		expect(sanitizers.bgColor('rgba(0, 0, 0, 0)')).toBe('rgba(0, 0, 0, 0)');
		expect(sanitizers.bgColor('rgba(0,0,0,0.5)')).toBe('rgba(0,0,0,0.5)');
		expect(sanitizers.bgColor('rgba(a,b,c)')).toBe(null);
		expect(sanitizers.bgColor('rgba(...)')).toBe(null);
		expect(sanitizers.bgColor('rgba(1)')).toBe(null);

		expect(sanitizers.bgColor('black')).toBe('black');
		expect(sanitizers.bgColor('white')).toBe('white');
		expect(sanitizers.bgColor('blue')).toBe('blue');
		expect(sanitizers.bgColor('blueyyyy')).toBe(null);
	});
});
