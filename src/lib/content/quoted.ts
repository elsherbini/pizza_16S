/**
 * Used by the prose tests: asserts that a sentence still appears in
 * `src/content/story.md`.
 *
 * Whitespace is flattened on both sides of the comparison, so rewrapping a
 * paragraph in the markdown never breaks a test whose subject is a number.
 */

import { readFileSync } from 'node:fs';

const flatten = (text: string) => text.replace(/\s+/g, ' ').trim();
const story = flatten(readFileSync(new URL('../../content/story.md', import.meta.url), 'utf8'));

export function quotes(fragment: string): void {
	if (story.includes(flatten(fragment))) return;
	throw new Error(`story.md no longer contains "${fragment}"`);
}
