/**
 * The prose. Every sentence on the page comes from `src/content/story.md`,
 * which a Vite plugin parses at build time; see `vite/story.ts`.
 */

import story from '../../content/story.md';
import { findAct } from './find';
import type { Act, Story } from './types';

export type { Act, Story };
export { story };

/**
 * The act with this id, or a build-time failure naming the ids that do exist.
 * Acts are addressed by id rather than by position so that reordering or
 * renumbering them in the markdown cannot quietly repoint a component at the
 * wrong prose.
 */
export function act(id: string): Act {
	return findAct(story, id);
}
