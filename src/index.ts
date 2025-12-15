import { writeDataPoint } from './analytics';
import { processOption, sanitizeNumber, sanitizers } from './sanitizers';
import { type Options, simpleSvgPlaceholder } from './simple-svg-placeholder';
import { type Env } from './types';
import { addHeaders } from './utils';
import {
	PoPsRewriter,
	errorCacheHeader,
	imageCacheHeader,
	isStaticFile,
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


		const baseURL = url.pathname.replace('/api', '');
		if (baseURL !== '/') {
			// URL might be /350, in which case validate and set height and width
			// or if it's /350x150, then set both height and width
			const size = baseURL.replace('/', '');
			const sizeParts = size.split('x');
			const width = sanitizeNumber(sizeParts[0]);
			const height = sizeParts[1] ? sanitizeNumber(sizeParts[1]) : null;
			if (height && width) {
				imageOptions.width = width;
				imageOptions.height = height;
			} else if (width) {
				imageOptions.width = width;
				imageOptions.height = width;
			}
		}
		// options that can be overwritten via query
		processOption(imageOptions, 'width', url.searchParams.get('width'), sanitizers.width);
		processOption(imageOptions, 'height', url.searchParams.get('height'), sanitizers.height);
		processOption(imageOptions, 'text', url.searchParams.get('text'), sanitizers.text);
		processOption(imageOptions, 'dy', url.searchParams.get('dy'), sanitizers.dy);
		processOption(imageOptions, 'fontFamily', url.searchParams.get('fontFamily'), sanitizers.fontFamily);
		processOption(imageOptions, 'fontWeight', url.searchParams.get('fontWeight'), sanitizers.fontWeight);
		processOption(imageOptions, 'fontSize', url.searchParams.get('fontSize'), sanitizers.fontSize);
		processOption(imageOptions, 'bgColor', url.searchParams.get('bgColor'), sanitizers.bgColor);
		processOption(imageOptions, 'textColor', url.searchParams.get('textColor'), sanitizers.textColor);
		processOption(imageOptions, 'darkBgColor', url.searchParams.get('darkBgColor'), sanitizers.darkBgColor);
		processOption(imageOptions, 'darkTextColor', url.searchParams.get('darkTextColor'), sanitizers.darkTextColor);
		processOption(imageOptions, 'textWrap', url.searchParams.get('textWrap'), sanitizers.textWrap);
		response = new Response(simpleSvgPlaceholder(imageOptions), {
			headers: {
				'content-type': 'image/svg+xml; charset=utf-8',
				'access-control-allow-origin': '*',
			},
		});

		// set cache header on 200 response
		if (response.status === 200) {
			response.headers.set('Cache-Control', imageCacheHeader);
		} else {
			// only cache other things for 5 minutes (errors, 404s, etc.)
			response.headers.set('Cache-Control', errorCacheHeader);
		}

		ctx.waitUntil(cache.put(url, response.clone())); // store in cache
		writeDataPoint(env.PLACEHOLDERS_ANALYTICS, request, { cached: 0 });
		return response;
	}

	// else get the assets from Workers Assets
	// And then finally run any necessary code on the asset, like setting headers, HTMLRewriter, etc.
	const options = {
		cacheControl: {
			edgeTTL: 60 * 60 * 1, // 1 hour
			browserTTL: 60 * 60 * 1, // 1 hour
			bypassCache: false,
		},
	};
	if (isStaticFile(url.pathname)) {
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
	asset = new Response(asset.body, {
		status: asset.status,
		statusText: asset.statusText,
		headers: asset.headers,
	});
	// set cache headers
	asset.headers.set('Cache-Control', `public, max-age=${options.cacheControl.browserTTL}`);

	// only process HTML with security headers and HTMLRewriter
	const isHtml = asset.headers.get('content-type')?.includes('text/html');
	if (isHtml) {
		// set security headers on html pages
		for (const name of Object.keys(addHeaders)) {
			const keyedName = name as keyof typeof addHeaders;
			asset.headers.set(name, addHeaders[keyedName]);
		}
		return new HTMLRewriter().on('*', new PoPsRewriter()).transform(asset);
	}

	return asset;
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
