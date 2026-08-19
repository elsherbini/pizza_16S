/**
 * Kept apart from `parse.ts` so that looking an act up does not drag `marked`
 * and the whole parser into the browser bundle.
 */

import type { Act, Story } from './types.ts';

export function findAct(story: Story, id: string): Act {
	const act = story.acts.find((candidate) => candidate.id === id);
	if (act) return act;
	const known = story.acts.map((candidate) => candidate.id).join(', ');
	throw new Error(`No act with the id "${id}". The story has: ${known}.`);
}
