import sanitizeHtml from 'sanitize-html';
import validateColor from 'validate-color';

function sanitizeNumber(input) {
	const isValid = !/^\s*$/.test(input) && !Number.isNaN(input);
	if (isValid) {
		return Number(input);
	}
	return null;
}

function sanitizeString(input) {
	let value = sanitizeHtml(input, { allowedTags: [], allowedAttributes: [] });
	value = value.replace(/["<>]+/g, '');
	return value;
}

function sanitizeColor(input) {
	const value = sanitizeString(input); // first remove any HTML
	const isValidColor = validateColor(value);
	if (isValidColor) {
		return value;
	}
	return null;
}
export const sanitizers = {
	width: sanitizeNumber,
	height: sanitizeNumber,
	text: sanitizeString,
	dy: sanitizeString,
	fontFamily: sanitizeString,
	fontWeight: sanitizeNumber,
	fontSize: sanitizeNumber,
	bgColor: sanitizeColor,
	textColor: sanitizeColor,
};
