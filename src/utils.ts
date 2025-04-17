import PoPs from '@adaptivelink/pops';

/* security headers */
export const addHeaders = {
	'X-XSS-Protection': '1; mode=block',
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'no-referrer-when-downgrade',
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
	'Feature-Policy': [
		'geolocation \'none\';',
		'midi \'none\';',
		'sync-xhr \'none\';',
		'microphone \'none\';',
		'camera \'none\';',
		'magnetometer \'none\';',
		'gyroscope \'none\';',
		'speaker \'none\';',
		'fullscreen \'none\';',
		'payment \'none\';',
	].join(' '),
	'Content-Security-Policy': [
		'default-src \'self\';',
		'script-src \'self\' cdnjs.cloudflare.com static.cloudflareinsights.com;',
		'style-src \'self\' cdnjs.cloudflare.com \'unsafe-inline\' fonts.googleapis.com;',
		'img-src \'self\' data: images.placeholders.dev;',
		'child-src \'none\';',
		'font-src \'self\' fonts.gstatic.com cdnjs.cloudflare.com;',
		'connect-src \'self\';',
		'prefetch-src \'none\';',
		'object-src \'none\';',
		'form-action \'none\';',
		'frame-ancestors \'none\';',
		'upgrade-insecure-requests;',
	].join(' '),
} as const;

/* caching */
export const cacheTtl = 60 * 60 * 24 * 90; // 90 days
export const filesRegex = /(.*\.(ac3|avi|bmp|br|bz2|css|cue|dat|doc|docx|dts|eot|exe|flv|gif|gz|htm|html|ico|img|iso|jpeg|jpg|js|json|map|mkv|mp3|mp4|mpeg|mpg|ogg|pdf|png|ppt|pptx|qt|rar|rm|svg|swf|tar|tgz|ttf|txt|wav|webp|webm|webmanifest|woff|woff2|xls|xlsx|xml|zip))$/;

/* HTML rewriter for more accurate count of Cloudflare PoPs */
export const CloudflarePoPs = PoPs.cloudflare.code.length;
export const description = `Generate super fast placeholder images powered by Cloudflare Workers in ${CloudflarePoPs}+ edge locations.`;
export class PoPsRewriter implements HTMLRewriterElementContentHandlers {
	element(element: Element) {
		if (element.tagName === 'title') {
			element.setInnerContent(description);
		} else if (element.tagName === 'meta' && (element.getAttribute('name') === 'description' || element.getAttribute('name') === 'twitter:description' || element.getAttribute('property') === 'og:description')) {
			element.setAttribute('content', description);
		} else if (element.tagName === 'span' && element.hasAttribute('class') && element.getAttribute('class')?.includes('edgeLocations')) {
			element.setInnerContent(String(CloudflarePoPs));
		}
	}
}

export const availableImageOptions = [
	'width',
	'height',
	'text',
	'dy',
	'fontFamily',
	'fontWeight',
	'fontSize',
	'bgColor',
	'textColor',
	'darkBgColor',
	'darkTextColor',
	'textWrap',
] as const;

export function getKeys<T extends object>(obj: T) {
	return Object.keys(obj) as Array<keyof T>;
}

export function escapeXml(str: string): string {
	return str
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('\'', '&apos;')
		.replaceAll('"', '&quot;');
}
