# [placeholders.dev](https://placeholders.dev)
Generate super-fast placeholder images in 330+ edge locations, powered by Cloudflare Workers
![350x150 placeholder image](https://images.placeholders.dev/350x100)![200x100 placeholder image](https://images.placeholders.dev/?width=200&amp;height=100&amp;bgColor=%23000&amp;textColor=rgba(255,255,255,0.5))![140x100 placeholder image](https://images.placeholders.dev/?width=140&amp;height=100&amp;bgColor=%23313131&amp;textColor=%23dfdfde)
![1055x100 placeholder image](https://images.placeholders.dev/?width=1055&amp;height=100&amp;text=Hello%20World&amp;bgColor=%23434343&amp;textColor=%23dfdfde)

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Cherry/placeholders.dev)

## Info

placeholders.dev generates custom placeholder images on the fly, such as the examples above. All of these images are generated on Cloudflare's Edge, at 330+ locations, ensuring the best possible performance for all of your users. All images are cached for lengthy periods of time.

## Technology

This project makes use of Cloudflare Workers, and Cloudflare Workers Static Assets. It also implements a HTMLRewriter to update the total Cloudflare PoPs in multiple locations.

### Example URLs:

- Basic url path: `https://images.placeholders.dev/350`
- Full url path: `https://images.placeholders.dev/350x150`
- Full query params:`https://images.placeholders.dev/?width=1055&height=100&text=Made%20with%20placeholders.dev&bgColor=%23f7f6f6&textColor=%236d6e71`

### Available API Options

- `width`
	- Width of generated image. Defaults to `300`.
- `height`
	- Height of generated image. Defaults to 150.
- `text`
	- Text to display on generated image. Defaults to the image dimensions.
- `fontFamily`
	- Font to use for the text. Defaults to `sans-serif`.
- `fontWeight`
	- Font weight to use for the text. Defaults to `bold`.
- `fontSize`
	- Font size to use for the text. Defaults to 20% of the shortest image dimension, rounded down.
- `dy`
	- Adjustment applied to the dy attribute of the text element to appear vertically centered. Defaults to 35% of the font size.
- `bgColor`
	- Background color of the image. Defaults to `#ddd`
- `textColor`
	- Color of the text. For transparency, use an rgba or hsla value. Defaults to `rgba(0,0,0,0.5)`
- `textWrap`
	- Wrap text to fit within the image (to best ability). Will not alter font size, so especially long strings may still appear outside of the image. Defaults to `false`.

## Dev

- `npm run start:dev` (this will use `wrangler dev` to locally start the Cloudflare Worker for testing)

or

- `npm run publish` (push to `placeholders-dev` workers.dev)

or

- `npm run publish:staging` (push to `placeholders-staging` workers.dev)

## Production

- `npm run publish:prod` (publishes to placeholders.dev via Workers)
