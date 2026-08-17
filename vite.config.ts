import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

/**
 * GitHub Pages serves a project site from a subdirectory, so the build needs to
 * know its prefix or every asset resolves against the domain root and 404s.
 * `npm run build:gh` sets it; local dev and preview leave it empty.
 */
const envBase = process.env.BASE_PATH ?? '';
const base: '' | `/${string}` = envBase.startsWith('/') ? (envBase as `/${string}`) : '';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			paths: { base },

			adapter: adapter({ fallback: undefined, precompress: false, strict: true })
		})
	],
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node'
	}
});
