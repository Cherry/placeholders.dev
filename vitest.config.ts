import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';


export default defineWorkersConfig({
	test: {
		pool: '@cloudflare/vitest-pool-workers',
		poolOptions: {
			workers: {
				isolatedStorage: true,
				wrangler: {
					configPath: './wrangler.toml',
				},
			},
		},
	},
});
