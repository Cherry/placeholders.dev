/* eslint-disable node/no-unsupported-features/es-syntax */
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import generateSVG from '@cloudfour/simple-svg-placeholder';
import sanitizeHtml from "sanitize-html";
import validateColor from 'validate-color';

const DEBUG = false;

addEventListener('fetch', event => {
	try{
		event.respondWith(handleEvent(event));
	}catch(e){
		if(DEBUG){
			return event.respondWith(
				new Response(e.message || e.toString(), {
					status: 500
				})
			);
		}
		event.respondWith(new Response('Internal Error', { status: 500 }));
	}
});

function sanitizeNumber(input){
	const isValid = !/^\s*$/.test(input) && !Number.isNaN(input);
	if(isValid){
		return Number(input);
	}
	return null;
}

function sanitizeString(input){
	let value = sanitizeHtml(input, {allowedTags: [], allowedAttributes: []});
	value = value.replace(/["><]+/g, '');
	return value;
}

function sanitizeColor(input){
	const value = sanitizeString(input); // first remove any HTML
	const isValidColor = validateColor(value);
	if(isValidColor){
		return value;
	}
	return null;
}
const sanitizers = {
	width: sanitizeNumber,
	height: sanitizeNumber,
	text: sanitizeString,
	dy: sanitizeString,
	fontFamily: sanitizeString,
	fontWeight: sanitizeNumber,
	fontSize: sanitizeNumber,
	bgColor: sanitizeColor,
	textColor: sanitizeColor
};

const addHeaders = {
	"X-XSS-Protection": "1; mode=block",
	"X-Frame-Options": "DENY",
	"X-Content-Type-Options": "nosniff",
	"Referrer-Policy": "no-referrer-when-downgrade",
	"Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
	"Feature-Policy": [
		"geolocation 'none';",
		"midi 'none';",
		"sync-xhr 'none';",
		"microphone 'none';",
		"camera 'none';",
		"magnetometer 'none';",
		"gyroscope 'none';",
		"speaker 'none';",
		"fullscreen 'none';",
		"payment 'none';"
	].join(' '),
	"Content-Security-Policy": [
		"default-src 'self';",
		"script-src 'self' cdnjs.cloudflare.com static.cloudflareinsights.com;",
		"style-src 'self' 'unsafe-inline' fonts.googleapis.com;",
		"img-src 'self' data:;",
		"child-src 'none';",
		"font-src 'self' fonts.gstatic.com;",
		"connect-src 'self';",
		"prefetch-src 'none';",
		"object-src 'none';",
		"form-action 'none';",
		"frame-ancestors 'none';",
		"upgrade-insecure-requests;"
	].join(' ')
};

const cacheTtl = 60 * 60 * 24 * 90; // 90 days
const filesRegex = /(.*\.(ac3|avi|bmp|br|bz2|css|cue|dat|doc|docx|dts|eot|exe|flv|gif|gz|htm|html|ico|img|iso|jpeg|jpg|js|json|map|mkv|mp3|mp4|mpeg|mpg|ogg|pdf|png|ppt|pptx|qt|rar|rm|svg|swf|tar|tgz|ttf|txt|wav|webp|webm|webmanifest|woff|woff2|xls|xlsx|xml|zip))$/;

async function handleEvent(event){
	const url = new URL(event.request.url);
	url.searchParams.sort(); // improve cache-hits by sorting search params

	const cache = caches.default; // Cloudflare edge caching
	// when publishing to prod, we serve images from an `images` subdomain
	// when in dev, we serve from `/api`
	if(url.host === 'images.placeholders.dev' || url.pathname.startsWith('/api')){
		// do our API work
		let response = await cache.match(url, {ignoreMethod: true}); // try to find match for this request in the edge cache
		if(response){
			// use cache found on Cloudflare edge. Set X-Worker-Cache header for helpful debug
			const newHdrs = new Headers(response.headers);
			newHdrs.set('X-Worker-Cache', "true");
			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers: newHdrs
			});
		}
		const imageOptions = {
			dataUri: false, // always return an unencoded SVG source
			width: 300,
			height: 150,
			fontFamily: 'sans-serif',
			fontWeight: 'bold',
			bgColor: '#ddd',
			textColor: 'rgba(0,0,0,0.5)'
		};

		// options that can be overwritten
		for(const key of ['width', 'height', 'text', 'dy', 'fontFamily', 'fontWeight', 'fontSize', 'bgColor', 'textColor']){
			if(url.searchParams.has(key)){
				let value;
				if(key in sanitizers){
					value = sanitizers[key](url.searchParams.get(key));
				}else{
					value = url.searchParams.get(key);
				}
				if(value){
					imageOptions[key] = value;
				}
			}
		}
		response = new Response(generateSVG(imageOptions), {
			headers: {
				'content-type': 'image/svg+xml; charset=utf-8'
			}
		});

		// set cache header on 200 response
		if(response.status === 200){
			response.headers.set('Cache-Control', "public, max-age=" + cacheTtl);
		}else{
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
			bypassCache: false
		}
	};
	if(url.pathname.match(filesRegex)){
		options.cacheControl.edgeTTL = 60 * 60 * 24 * 30; // 30 days
		options.cacheControl.browserTTL = 60 * 60 * 24 * 30; // 30 days
	}
	let asset = null;
	try{
		if(DEBUG){
			// customize caching
			options.cacheControl.bypassCache = true;
		}
		asset = getAssetFromKV(event, options);
	}catch(e){
		// if an error is thrown try to serve the asset at 404.html
		if(!DEBUG){
			try{
				const notFoundResponse = await getAssetFromKV(event, {
					mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req)
				});

				return new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 });
			}catch(e){}
		}

		return new Response(e.message || e.toString(), { status: 500 });
	}

	if(asset && asset.headers.get('content-type') === 'text/html'){
		// set security headers on html pages
		Object.keys(addHeaders).forEach(name => {
			asset.headers.set(name, addHeaders[name]);
		});
	}

	return asset;
}