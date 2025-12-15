import sanitizeHtml from 'sanitize-html';
import validateColor from 'validate-color';

import type { Options } from './simple-svg-placeholder';
import type { availableImageOptions } from './utils';

export function sanitizeNumber(input: string | number): number | null {
	const str = String(input);
	const isValid = !/^\s*$/.test(str.trim()) && !Number.isNaN(Number(str));
	if (isValid) {
		return Number(str);
	}
	return null;
}

export function sanitizeString(input: string): string {
	let value = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
	value = value.replaceAll(/["<>]+/g, '');
	return value;
}

export function sanitizeColor(input: string): string | null {
	const value = sanitizeString(input); // first remove any HTML
	const isValidColor = validateColor(value);
	if (isValidColor) {
		return value;
	}
	return null;
}

export function sanitizeStringForCss(input: string): string {
	let value = sanitizeString(input);
	value = value.replaceAll(/[:;]+/g, '');
	return value;
}

export function sanitizeBoolean(input: string | number | boolean): boolean {
	const str = String(input);
	if (str.toLowerCase() === 'true') {
		return true;
	}
	if (str === '1') {
		return true;
	}
	return false;
}

// map each available option to its sanitizer, ensuring return types match Options
type SanitizersType = {
	[K in typeof availableImageOptions[number]]: (input: string) => NonNullable<Options[K]> | null;
};

export const sanitizers: SanitizersType = {
	width: sanitizeNumber,
	height: sanitizeNumber,
	text: sanitizeString,
	dy: sanitizeNumber,
	fontFamily: sanitizeStringForCss,
	fontWeight: sanitizeNumber,
	fontSize: sanitizeNumber,
	bgColor: sanitizeColor,
	textColor: sanitizeColor,
	darkBgColor: sanitizeColor,
	darkTextColor: sanitizeColor,
	textWrap: sanitizeBoolean,
};

// processes a single option with full type checking
export function processOption<K extends keyof Options>(
	options: Options,
	key: K,
	rawValue: string | null,
	sanitizer: (value: string) => NonNullable<Options[K]> | null,
): void {
	if (!rawValue) { return; }
	const value = sanitizer(rawValue);
	if (value !== null) {
		options[key] = value;
	}
}
