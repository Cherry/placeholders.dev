import { writeDataPoint } from './analytics';
import { sanitizers } from './sanitizers';
import { type Options, simpleSvgPlaceholder } from './simple-svg-placeholder';
import { type Env } from './types';
import { addHeaders } from './utils';
import {
	PoPsRewriter,
	availableImageOptions,
	cacheTtl,
	filesRegex,
} from './utils';

async function handleEvent(request: Request, env: Env, ctx: ExecutionContext) {
	const url = new URL(request.url);
	url.searchParams.sort(); // improve cache-hits by sorting search params

	const cache = caches.default; // Cloudflare edge caching
	// when publishing to prod, we serve images from an `images` subdomain
	// when in dev, we serve from `/api`
	if (url.host === 'images.placeholders.dev' || url.pathname.startsWith('/api')) {
		// do our API work
		let response;
		if (url.host === 'images.placeholders.dev') {
			response = await cache.match(url, { ignoreMethod: true }); // try to find match for this request in the edge cache
		}
		if (response) {
			// use cache found on Cloudflare edge. Set X-Worker-Cache header for helpful debug
			const newHdrs = new Headers(response.headers);
			newHdrs.set('X-Worker-Cache', 'true');
			writeDataPoint(env.PLACEHOLDERS_ANALYTICS, request, { cached: 1 });
			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers: newHdrs,
			});
		}
		const imageOptions: Options = {
			dataUri: false, // always return an unencoded SVG source
			width: 300,
			height: 150,
			fontFamily: 'sans-serif',
			fontWeight: 'bold',
			bgColor: '#ddd',
			textColor: 'rgba(0,0,0,0.5)',
		};

		// options that can be overwritten
		for (const key of availableImageOptions) {
			if (url.searchParams.has(key)) {
				const rawValue = url.searchParams.get(key);
				if (!rawValue) { continue; }
				let value;
				if (key in sanitizers) {
					value = sanitizers[key](rawValue);
				} else {
					value = url.searchParams.get(key);
				}
				if (value) {
					// @ts-expect-error TODO: better type sanitizers
					imageOptions[key] = value;
				}
			}
		}
		response = new Response(simpleSvgPlaceholder(imageOptions), {
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

		ctx.waitUntil(cache.put(url, response.clone())); // store in cache
		writeDataPoint(env.PLACEHOLDERS_ANALYTICS, request, { cached: 0 });
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
		asset = await env.ASSETS.fetch(request);
	} catch (err) {
		const probableError = err as Error;
		return new Response(probableError?.message || probableError.toString(), { status: 500 });
	}

	// recreate response so that headers are mutable
	asset = new Response(asset.body, asset);
	// set cache headers
	asset.headers.set('Cache-Control', `public, max-age=${options.cacheControl.browserTTL}`);

	// append security headers to HTML
	if (asset?.headers?.has?.('content-type') && asset.headers.get('content-type')?.includes?.('text/html')) {
		// we're about to manipualte headers, so need to recreaete the response to be mutable
		// set security headers on html pages
		for (const name of Object.keys(addHeaders)) {
			const keyedName = name as keyof typeof addHeaders;
			asset.headers.set(name, addHeaders[keyedName]);
		}
	}

	const transformed = new HTMLRewriter().on('*', new PoPsRewriter()).transform(asset);
	return transformed;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		try {
			const response = await handleEvent(request, env, ctx);
			return response;
		} catch (err) {
			console.error(err);
			return new Response('Internal Error', { status: 500 });
		}
	},
};
