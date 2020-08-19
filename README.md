# [placeholders.dev](https://placeholders.dev)
Generate super-fast placeholder images in 200+ edge locations, powered by Cloudflare Workers
![350x150 placeholder image](https://images.placeholders.dev/?width=350&amp;height=100)![200x100 placeholder image](https://images.placeholders.dev/?width=200&amp;height=100&amp;bgColor=%23000&amp;textColor=rgba(255,255,255,0.5))![140x100 placeholder image](https://images.placeholders.dev/?width=140&amp;height=100&amp;bgColor=%23313131&amp;textColor=%23dfdfde)
![1055x100 placeholder image](https://images.placeholders.dev/?width=1055&amp;height=100&amp;text=Hello%20World&amp;bgColor=%23434343&amp;textColor=%23dfdfde)

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/signalnerve/placeholders.dev)

## Info

placeholders.dev generates custom placeholder images on the fly, such as the examples above. All of these images are generated on Cloudflare's Edge, at 200+ locations, ensuring the best possible performance for all of your users. All images are cached for lengthy periods of time.

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

Example URL: `https://images.placeholders.dev/?width=1055&height=100&text=Made%20with%20placeholders.dev&bgColor=%23f7f6f6&textColor=%236d6e71`
## Dev

### Prerequisites

#### Wrangler
`wrangler` is a CLI tool from Cloudflare, designed to push projects to Cloudflare Workers. See [Cloudflare's documentation](https://developers.cloudflare.com/workers/tooling/wrangler/) for more information.

Install it with npm:
- `npm i @cloudflare/wrangler -g`

After install run `wrangler config` and follow the prompts to add your Wrangler API token. Follow the instructions in [Cloudflare's](https://developers.cloudflare.com/workers/quickstart/#api-token) docs for information on this.


### Build
- `wrangler build`

### Run

- `npm run start:dev` (this will use `cloudworker` to run a server on `localhost:3000` mimicking the API Worker)

or

- `npm run publish` (push to `placeholders-dev` workers.dev)

or

- `npm run publish:staging` (push to `placeholders-staging` workers.dev)

or

- `npm run publish:preview` (push to Cloudflare Workers preview builder)

## Production

- `npm run publish:prod` (publishes to placeholders.dev via Workers)
