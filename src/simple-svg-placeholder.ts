// Heavily based on https://github.com/cloudfour/simple-svg-placeholder/tree/main
// License: MIT
import { escapeXml } from './utils';

export type Options = {
	width?: number;
	height?: number;
	text?: string;
	dy?: number;
	fontFamily?: string;
	fontWeight?: string | number;
	fontSize?: number;
	lineHeight?: number;
	bgColor?: string;
	textColor?: string;
	darkBgColor?: string;
	darkTextColor?: string;
	dataUri?: boolean;
	charset?: string;
	textWrap?: boolean;
	padding?: string;
};


export function simpleSvgPlaceholder({
	width = 300,
	height = 150,
	text = `${width}×${height}`,
	fontFamily = 'sans-serif',
	fontWeight = 'bold',
	fontSize = Math.floor(Math.min(width, height) * 0.2),
	lineHeight = 1.2,
	dy = fontSize * 0.35,
	bgColor = '#ddd',
	textColor = 'rgba(0,0,0,0.5)',
	darkBgColor,
	darkTextColor,
	dataUri = true,
	charset = 'UTF-8', // eslint-disable-line unicorn/text-encoding-identifier-case
	textWrap = false,
	padding = '0.5em',
}: Options = {}) {
	const safeText = escapeXml(text);
	let content = '';

	let style = '';

	if (darkBgColor || darkTextColor) {
		style = `<style>
      @media (prefers-color-scheme: dark) {
        ${darkBgColor ? `rect { fill: ${darkBgColor}; }` : ''}
        ${darkTextColor && !textWrap ? `text { fill: ${darkTextColor}; }` : ''}
        ${darkTextColor && textWrap ? `div { color: ${darkTextColor} !important; }` : ''}
      }
      </style>`;
	}

	if (textWrap) {
		content = `<foreignObject width="${width}" height="${height}">
		<div xmlns="http://www.w3.org/1999/xhtml" style="
			align-items: center;
			box-sizing: border-box;
			color: ${textColor};
			display: flex;
			font-family: ${fontFamily};
			font-size: ${fontSize}px;
			font-weight: ${fontWeight};
			height: 100%;
			line-height: ${lineHeight};
			justify-content: center;
			padding: ${padding};
			text-align: center;
			width: 100%;
		">${safeText}</div>
	  </foreignObject>`;
	} else {
		content = `<text fill="${textColor}" font-family="${fontFamily}" font-size="${fontSize}" dy="${dy}" font-weight="${fontWeight}" x="50%" y="50%" text-anchor="middle">${safeText}</text>`;
	}

	const str = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
	${style}
	<rect fill="${bgColor}" width="${width}" height="${height}"/>
	${content}
	</svg>`;

	// Thanks to: filamentgroup/directory-encoder
	const cleaned = str
		.replaceAll(/[\t\n\r]/gim, '') // Strip newlines and tabs
		.replaceAll(/\s\s+/g, ' '); // Condense multiple spaces

	if (dataUri) {
		const encoded = encodeURIComponent(cleaned)
			.replaceAll('(', '%28') // Encode brackets
			.replaceAll(')', '%29');

		return `data:image/svg+xml;charset=${charset},${encoded}`;
	}

	return cleaned;
}
