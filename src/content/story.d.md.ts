/**
 * The type of `story.md` once the Vite plugin in `vite/story.ts` has compiled
 * it. TypeScript looks for `<name>.d.<ext>.ts` beside a file imported with a
 * non-JavaScript extension.
 */

declare const story: import('../lib/content/types.ts').Story;
export default story;
