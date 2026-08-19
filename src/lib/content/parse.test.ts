import { describe, expect, test } from 'vitest';
import { findAct } from './find';
import { parseStory } from './parse';

const HERO = `---
description: A meta description.
---

# Pizza, alpha and beta

> Every diversity metric is a way of comparing restaurants
> you are not allowed to walk into.

A scrolling explainer. Scroll to begin.
`;

const act = (body: string) => `${HERO}
## Act 1 — Counting the menu {#richness}

> Observed richness, and the thing it refuses to look at.

${body}
`;

describe('the hero', () => {
	test('takes its title from the level-one heading', () => {
		expect(parseStory(HERO).hero.title).toBe('Pizza, alpha and beta');
	});

	test('takes its deck from the blockquote, joined into one line', () => {
		expect(parseStory(HERO).hero.deck).toBe(
			'Every diversity metric is a way of comparing restaurants you are not allowed to walk into.'
		);
	});

	test('takes its byline from the paragraph after the blockquote', () => {
		expect(parseStory(HERO).hero.byline).toBe('A scrolling explainer. Scroll to begin.');
	});

	test('reads the meta description out of the frontmatter', () => {
		expect(parseStory(HERO).description).toBe('A meta description.');
	});
});

describe('an act heading', () => {
	const { acts } = parseStory(act('Some prose.'));

	test('splits the label from the title on the em dash', () => {
		expect(acts[0].label).toBe('Act 1');
		expect(acts[0].title).toBe('Counting the menu');
	});

	test('takes its id from the trailing anchor', () => {
		expect(acts[0].id).toBe('richness');
	});

	test('takes its standfirst from the blockquote under it', () => {
		expect(acts[0].standfirst).toBe('Observed richness, and the thing it refuses to look at.');
	});
});

describe('blocks', () => {
	test('an act with no separator is a single block', () => {
		expect(parseStory(act('Some prose.')).acts[0].blocks).toHaveLength(1);
	});

	test('a separator on its own line starts a new block', () => {
		const { acts } = parseStory(act('First.\n\n---\n\nSecond.\n\n---\n\nThird.'));
		expect(acts[0].blocks).toHaveLength(3);
		expect(acts[0].blocks[1]).toContain('Second.');
	});

	test('a block keeps its own paragraphs', () => {
		const { acts } = parseStory(act('One.\n\nTwo.\n\n---\n\nThree.'));
		expect(acts[0].blocks[0].match(/<p>/g)).toHaveLength(2);
	});

	test('renders markdown emphasis and code spans', () => {
		const { acts } = parseStory(act('This is a **sample**, from `otu_table`.'));
		expect(acts[0].blocks[0]).toContain('<strong>sample</strong>');
		expect(acts[0].blocks[0]).toContain('<code>otu_table</code>');
	});

	test('passes inline HTML through untouched', () => {
		const { acts } = parseStory(act('<em>p<sub>i</sub></em> is the share of tickets.'));
		expect(acts[0].blocks[0]).toContain('<em>p<sub>i</sub></em>');
	});

	test('renders subheadings, which the coda needs', () => {
		const { acts } = parseStory(act('### Some tickets get printed twice\n\nPCR does not amplify.'));
		expect(acts[0].blocks[0]).toContain('<h3>Some tickets get printed twice</h3>');
	});
});

describe('a formula fence', () => {
	const { acts } = parseStory(act('```formula\nC = 1 - F<sub>1</sub> / N\n```'));

	test('becomes a formula paragraph', () => {
		expect(acts[0].blocks[0]).toContain('<p class="formula">C = 1 - F<sub>1</sub> / N</p>');
	});

	test('leaves an ordinary code fence alone', () => {
		const { acts: plain } = parseStory(act('```\nnot a formula\n```'));
		expect(plain[0].blocks[0]).toContain('<pre>');
	});
});

describe('a table', () => {
	const { acts } = parseStory(
		act('| Pizza | Ecology |\n| --- | --- |\n| One pizzeria | A sample |')
	);

	test('marks header cells as column headers', () => {
		expect(acts[0].blocks[0]).toContain('<th scope="col">Pizza</th>');
	});

	test('marks the first cell of each body row as a row header', () => {
		expect(acts[0].blocks[0]).toContain('<th scope="row">One pizzeria</th>');
		expect(acts[0].blocks[0]).toContain('<td>A sample</td>');
	});
});

describe('mistakes the parser refuses to pass on', () => {
	test('an act with no id', () => {
		expect(() =>
			parseStory(`${HERO}\n## Act 1 — Counting the menu\n\n> A standfirst.\n\nProse.`)
		).toThrow(/id/);
	});

	test('two acts sharing an id', () => {
		const source = `${HERO}
## Act 1 — Counting the menu {#richness}

> A standfirst.

Prose.

## Act 2 — Eighty percent plain cheese {#richness}

> Another standfirst.

Prose.
`;
		expect(() => parseStory(source)).toThrow(/richness/);
	});

	test('an act heading with no em dash between label and title', () => {
		expect(() =>
			parseStory(`${HERO}\n## Counting the menu {#richness}\n\n> A standfirst.\n\nProse.`)
		).toThrow(/—/);
	});

	test('an act with no standfirst', () => {
		expect(() => parseStory(`${HERO}\n## Act 1 — Counting {#richness}\n\nProse.`)).toThrow(
			/standfirst/
		);
	});
});

describe('looking an act up by id', () => {
	const story = parseStory(act('Some prose.'));

	test('finds it', () => {
		expect(findAct(story, 'richness').title).toBe('Counting the menu');
	});

	test('names the missing id and lists what is there', () => {
		expect(() => findAct(story, 'evenness')).toThrow(/evenness/);
		expect(() => findAct(story, 'evenness')).toThrow(/richness/);
	});
});
