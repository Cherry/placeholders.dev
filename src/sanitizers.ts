import sanitizeHtml from 'sanitize-html';
import validateColor from 'validate-color';

export function sanitizeNumber(input: string | number) {
	const isValid = !/^\s*$/.test(String(input).trim()) && !Number.isNaN(Number(input));
	if (isValid) {
		return Number(input);
	}
	return null;
}

export function sanitizeString(input: string) {
	let value = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
	value = value.replaceAll(/["<>]+/g, '');
	return value;
}

export function sanitizeColor(input: string) {
	const value = sanitizeString(input); // first remove any HTML
	const isValidColor = validateColor(value);
	if (isValidColor) {
		return value;
	}
	return null;
}

export function sanitizeStringForCss(input: string) {
	let value = sanitizeString(input);
	value = value.replaceAll(/[:;]+/g, '');
	return value;
}

export function sanitizeBoolean(input: string) {
	if (String(input).toLowerCase() === 'true') {
		return true;
	}
	if (String(input) === '1') {
		return true;
	}
	return false;
}

export const sanitizers = {
	width: sanitizeNumber,
	height: sanitizeNumber,
	text: sanitizeString,
	dy: sanitizeString,
	fontFamily: sanitizeStringForCss,
	fontWeight: sanitizeNumber,
	fontSize: sanitizeNumber,
	bgColor: sanitizeColor,
	textColor: sanitizeColor,
	textWrap: sanitizeBoolean,
};
