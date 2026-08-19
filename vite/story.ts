/**
 * Compiles `src/content/story.md` into a data module at build time.
 *
 * The prose is authored as one markdown document and read by the act
 * components as rendered HTML, so nothing here reaches the browser: the
 * markdown, the parser and `marked` all stay on the build side.
 */

import type { Plugin } from 'vite';
import { parseStory } from '../src/lib/content/parse.ts';

export function storyMarkdown(): Plugin {
	return {
		name: 'pizza-story-markdown',
		// Ahead of Vite's own handling, which would try to read a `.md` file as
		// JavaScript and fail on the first paragraph.
		enforce: 'pre',

		transform(code, id) {
			if (!id.endsWith('.md')) return null;
			return { code: `export default ${JSON.stringify(parseStory(code))};`, map: null };
		}
	};
}
