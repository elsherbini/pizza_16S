/**
 * Turns `src/content/story.md` into the structure the act components render.
 *
 * This runs inside the Vite plugin at build time, never in the browser, which
 * is why `marked` can stay a devDependency and none of it reaches the bundle.
 *
 * The format is three rules. `#` opens the hero; `##` opens an act, splitting
 * "Act 1 — Counting the menu {#richness}" into label, title and id; and a `---`
 * line splits an act's body into blocks. Everything else is ordinary markdown.
 */

import { Marked, type RendererThis, type Tokens } from 'marked';
import type { Act, Story } from './types.ts';

const SEPARATOR = /^-{3,}$/;
const ACT_HEADING = /^##\s+(.*)$/;
const HERO_HEADING = /^#\s+(.*)$/;
const ANCHOR = /\s*\{#([a-z0-9-]+)\}\s*$/;
const EM_DASH = /\s+—\s+/;

const marked = new Marked({
	renderer: {
		/**
		 * A fence tagged `formula` is a centred display line, not source code.
		 * Its contents go through as raw HTML so the `<sub>`, `<sup>` and
		 * entities the formulas are built from keep working.
		 */
		code({ text, lang }: Tokens.Code) {
			if (lang !== 'formula') return false;
			return `<p class="formula">${text}</p>\n`;
		},

		/**
		 * Rebuilt rather than patched so the first cell of each body row can be
		 * a row header. The one table in the piece is a glossary, where the left
		 * column labels the row rather than holding data of its own.
		 */
		table(this: RendererThis, token: Tokens.Table) {
			const align = (c: Tokens.TableCell) =>
				c.align ? ` style="text-align:${c.align}"` : '';
			const head = token.header
				.map((c) => `<th scope="col"${align(c)}>${this.parser.parseInline(c.tokens)}</th>`)
				.join('');
			const body = token.rows
				.map((row) => {
					const cells = row.map((c, i) => {
						const inner = this.parser.parseInline(c.tokens);
						return i === 0
							? `<th scope="row"${align(c)}>${inner}</th>`
							: `<td${align(c)}>${inner}</td>`;
					});
					return `<tr>${cells.join('')}</tr>`;
				})
				.join('\n');

			return `<table>\n<thead>\n<tr>${head}</tr>\n</thead>\n<tbody>\n${body}\n</tbody>\n</table>\n`;
		}
	}
});

/** Frontmatter, but only enough of it: one `key: value` per line. */
function splitFrontmatter(source: string): [Record<string, string>, string] {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(source);
	if (!match) return [{}, source];

	const fields: Record<string, string> = {};
	for (const line of match[1].split(/\r?\n/)) {
		const field = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line.trim());
		if (field) fields[field[1]] = field[2].replace(/^["']|["']$/g, '');
	}
	return [fields, source.slice(match[0].length)];
}

/**
 * Pulls a leading blockquote off a section body. The deck and the standfirst
 * are both plain strings on the page, so the `>` markers come off and the lines
 * join into one.
 */
function takeBlockquote(lines: string[]): [string | null, string[]] {
	let i = 0;
	while (i < lines.length && lines[i].trim() === '') i += 1;
	if (i === lines.length || !lines[i].startsWith('>')) return [null, lines];

	const quoted: string[] = [];
	while (i < lines.length && lines[i].startsWith('>')) {
		quoted.push(lines[i].replace(/^>\s?/, '').trim());
		i += 1;
	}
	return [quoted.join(' ').trim(), lines.slice(i)];
}

function splitSections(lines: string[]): { heading: string; body: string[] }[] {
	const sections: { heading: string; body: string[] }[] = [];
	for (const line of lines) {
		const act = ACT_HEADING.exec(line);
		if (act) {
			sections.push({ heading: act[1].trim(), body: [] });
		} else if (sections.length > 0) {
			sections[sections.length - 1].body.push(line);
		}
	}
	return sections;
}

function parseAct(heading: string, body: string[], seen: Set<string>): Act {
	const anchor = ANCHOR.exec(heading);
	if (!anchor) {
		throw new Error(`The act "${heading}" has no id. Headings end with an anchor, {#richness}.`);
	}
	const id = anchor[1];
	if (seen.has(id)) throw new Error(`Two acts share the id {#${id}}. Ids have to be unique.`);
	seen.add(id);

	const named = heading.replace(ANCHOR, '');
	const parts = named.split(EM_DASH);
	if (parts.length < 2) {
		throw new Error(`The act "${named}" needs an em dash — between its label and its title.`);
	}
	const [label, ...rest] = parts;

	const [standfirst, remainder] = takeBlockquote(body);
	if (standfirst === null) {
		throw new Error(`The act "${named}" has no standfirst. Put one in a blockquote under it.`);
	}

	const blocks: string[][] = [[]];
	for (const line of remainder) {
		if (SEPARATOR.test(line.trim())) blocks.push([]);
		else blocks[blocks.length - 1].push(line);
	}

	return {
		id,
		label: label.trim(),
		title: rest.join(' — ').trim(),
		standfirst,
		blocks: blocks
			.map((block) => block.join('\n').trim())
			.filter((block) => block !== '')
			.map((block) => marked.parse(block, { async: false }))
	};
}

export function parseStory(source: string): Story {
	const [fields, rest] = splitFrontmatter(source);
	const lines = rest.split(/\r?\n/);

	const heroIndex = lines.findIndex((line) => HERO_HEADING.test(line));
	if (heroIndex === -1) throw new Error('The story has no `# ` heading, so it has no hero.');

	const title = HERO_HEADING.exec(lines[heroIndex])![1].trim();
	const afterTitle = lines.slice(heroIndex + 1);
	const actStart = afterTitle.findIndex((line) => ACT_HEADING.test(line));
	const heroBody = actStart === -1 ? afterTitle : afterTitle.slice(0, actStart);

	const [deck, afterDeck] = takeBlockquote(heroBody);
	if (deck === null) throw new Error('The hero has no deck. Put one in a blockquote under the title.');
	const byline = afterDeck.join(' ').replace(/\s+/g, ' ').trim();

	const seen = new Set<string>();
	const acts = splitSections(afterTitle).map(({ heading, body }) => parseAct(heading, body, seen));

	return { description: fields.description ?? '', hero: { title, deck, byline }, acts };
}
