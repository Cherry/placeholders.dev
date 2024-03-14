import { describe, expect, it } from 'vitest';

import {
	sanitizeBoolean,
	sanitizeColor,
	sanitizeNumber,
	sanitizeString,
	sanitizeStringForCss,
} from '../src/sanitizers';

describe('Sanitizers', () => {
	it('number', () => {
		expect(sanitizeNumber(350)).toBe(350);
		expect(sanitizeNumber('350')).toBe(350);
		expect(sanitizeNumber(' 350')).toBe(350);
		expect(sanitizeNumber(' 350 ')).toBe(350);
		expect(sanitizeNumber(350.5)).toBe(350.5);
		expect(sanitizeNumber('350.5')).toBe(350.5);
		expect(sanitizeNumber('350.50')).toBe(350.5);
		expect(sanitizeNumber('0350.50')).toBe(350.5);
		expect(sanitizeNumber('')).toBe(null);
		expect(sanitizeNumber('abc')).toBe(null);
		expect(sanitizeNumber('350abc')).toBe(null);
		expect(sanitizeNumber('350 abc')).toBe(null);
		expect(sanitizeNumber('abc350')).toBe(null);
		expect(sanitizeNumber('abc 350')).toBe(null);
		expect(sanitizeNumber('350.5')).toBe(350.5);
		expect(sanitizeNumber('350.5abc')).toBe(null);
		expect(sanitizeNumber('350.5 abc')).toBe(null);
		expect(sanitizeNumber('abc350.5')).toBe(null);
		expect(sanitizeNumber('abc 350.5')).toBe(null);
		expect(sanitizeNumber('350.5.5')).toBe(null);
		expect(sanitizeNumber('350.5.5abc')).toBe(null);
		expect(sanitizeNumber('350.5.5 abc')).toBe(null);
		expect(sanitizeNumber('abc350.5.5')).toBe(null);
		expect(sanitizeNumber('abc 350.5.5')).toBe(null);
		expect(sanitizeNumber('350.5.5.5')).toBe(null);
		expect(sanitizeNumber('350.5.5.5abc')).toBe(null);
		expect(sanitizeNumber('350.5.5.5 abc')).toBe(null);
		expect(sanitizeNumber('abc350.5.5.5')).toBe(null);
		expect(sanitizeNumber('abc 350.5.5.5')).toBe(null);
		expect(sanitizeNumber('350 350')).toBe(null);
		expect(sanitizeNumber('350 350.5')).toBe(null);
		expect(sanitizeNumber('350.5 350')).toBe(null);
		expect(sanitizeNumber('350.5 350.5')).toBe(null);
		expect(sanitizeNumber('350 350 350')).toBe(null);
		expect(sanitizeNumber('350 350 350 350')).toBe(null);
	});

	it('string', () => {
		expect(sanitizeString('Hello World')).toBe('Hello World');
		expect(sanitizeString('')).toBe('');
		expect(sanitizeString(' <script>alert("XSS");</script> ')).toBe('  ');
		expect(sanitizeString('<script>alert("XSS");</script>')).toBe('');
		expect(sanitizeString('<script>alert("XSS");</script>abc')).toBe('abc');
		expect(sanitizeString('abc<script>alert("XSS");</script>')).toBe('abc');
		expect(sanitizeString('abc<script>alert("XSS");</script>abc')).toBe('abcabc');
		expect(sanitizeString('<script>alert("XSS");</script> abc')).toBe(' abc');
		expect(sanitizeString('abc <script>alert("XSS");</script>')).toBe('abc ');
		expect(sanitizeString('abc <script>alert("XSS");</script> abc')).toBe('abc  abc');
		expect(sanitizeString('<script>alert("XSS");</script> abc <script>alert("XSS");</script>')).toBe(' abc ');
		expect(sanitizeString('bar<strong>foo</strong>')).toBe('barfoo');
		expect(sanitizeString('bar<em>foo</em>')).toBe('barfoo');
		// @ts-expect-error intentional bad data
		expect(sanitizeString(123)).toBe('123');
	});

	it('color', () => {
		// double check string sanitization
		expect(sanitizeColor('Hello World')).toBe(null);
		expect(sanitizeColor('')).toBe(null);
		expect(sanitizeColor(' <script>alert("XSS");</script> ')).toBe(null);

		// hex
		expect(sanitizeColor('#000')).toBe('#000');
		expect(sanitizeColor('#000000')).toBe('#000000');
		expect(sanitizeColor('#00000000')).toBe('#00000000');
		expect(sanitizeColor('#000000000')).toBe(null);
		expect(sanitizeColor('#yyy')).toBe(null);
		expect(sanitizeColor('#yyyyyy')).toBe(null);

		// rgb/rgba
		expect(sanitizeColor('rgb(0,0,0)')).toBe('rgb(0,0,0)');
		expect(sanitizeColor('rgb(0, 0, 0)')).toBe('rgb(0, 0, 0)');
		expect(sanitizeColor('rgb(0,0,0,0)')).toBe('rgb(0,0,0,0)');
		expect(sanitizeColor('rgb(a,b,c)')).toBe(null);
		expect(sanitizeColor('rgb(...)')).toBe(null);
		expect(sanitizeColor('rgb(1)')).toBe(null);

		expect(sanitizeColor('rgba(0,0,0,0)')).toBe('rgba(0,0,0,0)');
		expect(sanitizeColor('rgba(0, 0, 0, 0)')).toBe('rgba(0, 0, 0, 0)');
		expect(sanitizeColor('rgba(0,0,0,0.5)')).toBe('rgba(0,0,0,0.5)');
		expect(sanitizeColor('rgba(a,b,c)')).toBe(null);
		expect(sanitizeColor('rgba(...)')).toBe(null);
		expect(sanitizeColor('rgba(1)')).toBe(null);

		expect(sanitizeColor('black')).toBe('black');
		expect(sanitizeColor('white')).toBe('white');
		expect(sanitizeColor('blue')).toBe('blue');
		expect(sanitizeColor('blueyyyy')).toBe(null);
	});

	it('string for css', () => {
		// double check string sanitization
		expect(sanitizeStringForCss('Hello World')).toBe('Hello World');
		expect(sanitizeStringForCss('')).toBe('');
		expect(sanitizeStringForCss(' <script>alert("XSS");</script> ')).toBe('  ');

		// prevent css property injection
		expect(sanitizeStringForCss('sans-serif; color: red')).toBe('sans-serif color red');
		expect(sanitizeStringForCss('sans-serif;;; color: red')).toBe('sans-serif color red');
	});

	it('boolean', () => {
		expect(sanitizeBoolean('true')).toBe(true);
		expect(sanitizeBoolean('false')).toBe(false);
		expect(sanitizeBoolean('1')).toBe(true);
		expect(sanitizeBoolean('0')).toBe(false);
		expect(sanitizeBoolean('')).toBe(false);
		expect(sanitizeBoolean('abc')).toBe(false);
		expect(sanitizeBoolean('trueabc')).toBe(false);
		expect(sanitizeBoolean('true abc')).toBe(false);
		expect(sanitizeBoolean('abctrue')).toBe(false);
		expect(sanitizeBoolean('abc true')).toBe(false);
		expect(sanitizeBoolean('true.5')).toBe(false);
		expect(sanitizeBoolean('true.5abc')).toBe(false);
		expect(sanitizeBoolean('true.5 abc')).toBe(false);
		expect(sanitizeBoolean('abctrue.5')).toBe(false);
		expect(sanitizeBoolean('abc true.5')).toBe(false);
		expect(sanitizeBoolean('true.5.5')).toBe(false);
		expect(sanitizeBoolean('true.5.5abc')).toBe(false);
		expect(sanitizeBoolean('true.5.5 abc')).toBe(false);
		expect(sanitizeBoolean('abctrue.5.5')).toBe(false);
		expect(sanitizeBoolean('abc true.5.5')).toBe(false);
		expect(sanitizeBoolean('true.5.5.5')).toBe(false);
		expect(sanitizeBoolean('true.5.5.5abc')).toBe(false);
		expect(sanitizeBoolean('true.5.5.5 abc')).toBe(false);
		expect(sanitizeBoolean('abctrue.5.5.5')).toBe(false);
		expect(sanitizeBoolean('abc true.5.5.5')).toBe(false);
		expect(sanitizeBoolean('true true')).toBe(false);
		expect(sanitizeBoolean('true true.5')).toBe(false);
		expect(sanitizeBoolean('true.5 true')).toBe(false);
		expect(sanitizeBoolean('true.5 true.5')).toBe(false);

		// @ts-expect-error intentional bad data
		expect(sanitizeBoolean(1)).toBe(true);
	});
});
