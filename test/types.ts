import type { Env } from '../src/types';
declare module 'cloudflare:test' {
	interface ProvidedEnv extends Env {}
}
