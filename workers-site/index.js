import PoPs from '@adaptivelink/pops';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import generateSVG from '@cloudfour/simple-svg-placeholder';

import { sanitizers } from './sanitizers.js';

const CloudflarePoPs = PoPs.cloudflare.code.length;

const DEBUG = false;

/* security headers */
const addHeaders = {
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
};

/* HTML rewriter for more accurate count of Cloudflare PoPs */
const description = `Generate super fast placeholder images powered by Cloudflare Workers in ${CloudflarePoPs}+ edge locations.`;
class PoPsRewriter {
	element(element) {
		if (element.tagName === 'title') {
			element.setInnerContent(description);
		} else if (element.tagName === 'meta' && (element.getAttribute('name') === 'description' || element.getAttribute('name') === 'twitter:description' || element.getAttribute('property') === 'og:description')) {
			element.setAttribute('content', description);
		} else if (element.tagName === 'span' && element.hasAttribute('class') && element.getAttribute('class').includes('edgeLocations')) {
			element.setInnerContent(String(CloudflarePoPs));
		}
	}
}

/* caching */
const cacheTtl = 60 * 60 * 24 * 90; // 90 days
const filesRegex = /(.*\.(ac3|avi|bmp|br|bz2|css|cue|dat|doc|docx|dts|eot|exe|flv|gif|gz|htm|html|ico|img|iso|jpeg|jpg|js|json|map|mkv|mp3|mp4|mpeg|mpg|ogg|pdf|png|ppt|pptx|qt|rar|rm|svg|swf|tar|tgz|ttf|txt|wav|webp|webm|webmanifest|woff|woff2|xls|xlsx|xml|zip))$/;

async function handleEvent(event) {
	const url = new URL(event.request.url);
	url.searchParams.sort(); // improve cache-hits by sorting search params

	const cache = caches.default; // Cloudflare edge caching
	// when publishing to prod, we serve images from an `images` subdomain
	// when in dev, we serve from `/api`
	if (url.host === 'images.placeholders.dev' || url.pathname.startsWith('/api')) {
		// do our API work
		let response = await cache.match(url, { ignoreMethod: true }); // try to find match for this request in the edge cache
		if (response) {
			// use cache found on Cloudflare edge. Set X-Worker-Cache header for helpful debug
			const newHdrs = new Headers(response.headers);
			newHdrs.set('X-Worker-Cache', 'true');
			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers: newHdrs,
			});
		}
		const imageOptions = {
			dataUri: false, // always return an unencoded SVG source
			width: 300,
			height: 150,
			fontFamily: 'sans-serif',
			fontWeight: 'bold',
			bgColor: '#ddd',
			textColor: 'rgba(0,0,0,0.5)',
		};

		// options that can be overwritten
		for (const key of ['width', 'height', 'text', 'dy', 'fontFamily', 'fontWeight', 'fontSize', 'bgColor', 'textColor']) {
			if (url.searchParams.has(key)) {
				let value;
				if (key in sanitizers) {
					value = sanitizers[key](url.searchParams.get(key));
				} else {
					value = url.searchParams.get(key);
				}
				if (value) {
					imageOptions[key] = value;
				}
			}
		}
		response = new Response(generateSVG(imageOptions), {
			headers: {
				'content-type': 'image/svg+xml; charset=utf-8',
				'access-control-allow-origin': '*',
			},
		});

		// set cache header on 200 response
		if (response.status === 200) {
			response.headers.set('Cache-Control', 'public, max-age=' + cacheTtl);
		} else {
			// only cache other things for 5 minutes (errors, 404s, etc.)
			response.headers.set('Cache-Control', 'public, max-age=300');
		}

		event.waitUntil(cache.put(url, response.clone())); // store in cache
		return response;
	}

	// else get the assets from KV
	const options = {
		cacheControl: {
			edgeTTL: 60 * 60 * 1, // 1 hour
			browserTTL: 60 * 60 * 1, // 1 hour
			bypassCache: false,
		},
	};
	if (filesRegex.test(url.pathname)) {
		options.cacheControl.edgeTTL = 60 * 60 * 24 * 30; // 30 days
		options.cacheControl.browserTTL = 60 * 60 * 24 * 30; // 30 days
	}
	let asset = null;
	try {
		if (DEBUG) {
			// customize caching
			options.cacheControl.bypassCache = true;
		}
		asset = await getAssetFromKV(event, options);
	} catch (err) {
		// if an error is thrown try to serve the asset at 404.html
		if (!DEBUG) {
			try {
				const notFoundResponse = await getAssetFromKV(event, {
					mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req),
				});

				const headers = new Headers(notFoundResponse.headers);
				headers.set('content-type', 'text/html; charset=utf-8');
				return new Response(notFoundResponse.body, {
					headers,
					status: 404,
				});
			} catch {}
		}

		return new Response(err.message || err.toString(), { status: 500 });
	}

	if (asset && asset.headers && asset.headers.has('content-type') && asset.headers.get('content-type').includes('text/html')) {
		// set security headers on html pages
		for (const name of Object.keys(addHeaders)) {
			asset.headers.set(name, addHeaders[name]);
		}
	}

	/* global HTMLRewriter */
	const transformed = new HTMLRewriter().on('*', new PoPsRewriter()).transform(asset);
	return transformed;
}

addEventListener('fetch', (event) => {
	try {
		event.respondWith(handleEvent(event));
	} catch (err) {
		if (DEBUG) {
			return event.respondWith(
				new Response(err.message || err.toString(), {
					status: 500,
				}),
			);
		}
		event.respondWith(new Response('Internal Error', { status: 500 }));
	}
});
