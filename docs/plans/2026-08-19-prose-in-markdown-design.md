# Moving the prose into a markdown document

## The problem

Every sentence the reader sees lives inside a Svelte component. Editing a paragraph in Act 2
means opening `ActEvenness.svelte`, finding the right `<Step>`, and typing between `<p>`
tags with the surrounding tab indentation. The ten act components are 70% prose and 30%
wiring, and the prose cannot be read end to end anywhere.

The two prose test files make this worse rather than better: they assert on exact sentence
fragments read out of the `.svelte` sources, so fragments carry the component's indentation
(`"Vinnie's twelve\n\t\t\tscore 0.36"`) and rewrapping a paragraph breaks a test for no real
reason.

## The shape

One file, `src/content/story.md`, holding the whole piece in reading order. A Vite plugin
parses it at build time and hands the components rendered HTML. Nothing parses in the
browser.

## The document format

Three rules.

`# Title` opens the hero. The blockquote under it is the deck; the paragraph after that is
the byline.

`## Act 1 — Counting the menu {#richness}` opens an act. The em dash splits the label from
the title, the trailing anchor is the act's id, and the blockquote under the heading is the
standfirst.

`---` on its own line splits an act's body into blocks.

```markdown
## Act 3 — A slow Tuesday {#rarefaction}

> Rarefaction, Good's coverage, and why unequal sequencing depth ruins a comparison.

If one shop reports more pizza types than another, is it more varied, or was it
simply busier?

---

Every curve stops where that shop's night stopped.
```

Nothing else is reserved. `###` and below are ordinary subheadings, which Act 9 needs;
tables, emphasis, code spans and inline HTML all behave the way markdown says they do.

Formulas use a fenced block tagged `formula`, whose contents pass through as raw HTML into
`<p class="formula">`:

````markdown
```formula
C = 1 - F<sub>1</sub> / N
```
````

That keeps `<sub>`, `<sup>` and the entities the formulas already rely on working verbatim,
and sets the formula apart from the prose in the editor.

## Blocks, not steps

An act's body is a list of blocks. The nine scroller acts map block *n* to `<Step index={n}>`,
so adding a block adds a scroll step and the chart holds its final stage past the end of its
own range. Act 9 is not a scroller and maps its three blocks to its three regions: prose
column, full-bleed glossary table, colophon. One mechanism, two mappings.

## The plugin

`vite/story.ts` claims `.md` imports and emits a data module:

```ts
interface Story {
	description: string;
	hero: { title: string; deck: string; byline: string };
	acts: Act[];
}

interface Act {
	id: string;
	label: string;
	title: string;
	standfirst: string;
	blocks: string[]; // rendered HTML
}
```

`marked` does the markdown, as a devDependency. Its table renderer is overridden to emit
`<th scope="row">` for the first cell of each body row, so the glossary keeps the row headers
the hand-written table has now.

The parser throws at build time on a missing or duplicate act id, which is the failure that
would otherwise be silent.

## Component access

Acts are addressed by id, not position: `act('richness')` rather than `story.acts[1]`.
Renumbering or reordering acts in the markdown then cannot quietly repoint a component at
the wrong prose. Each act component becomes wiring:

```svelte
const content = act('richness');

<ActHeader act={content.label} title={content.title} standfirst={content.standfirst} />
<Scroller bind:active={step}>
	{#snippet graphic(active)}<RichnessCompare {shops} stage={active} />{/snippet}
	{#each content.blocks as html, i}
		<Step index={i}>{@html html}</Step>
	{/each}
</Scroller>
```

The interactive state stays in the components, where it belongs: `bind:depth` in Act 3, the
metric switch driven by scroll position in Act 8, the `q` slider in Act 2.

## Tests

`vite/story.test.ts` covers the parser against inline fixtures, written first. It is the only
new logic.

`prose-numbers.test.ts` and `ordination-numbers.test.ts` read `story.md` instead of ten
`.svelte` files, and normalise whitespace on both sides of the match so a fragment survives
rewrapping. The `file` field on each quote becomes a label used only in the test name.

## What does not change

`app.css` already defines `.formula`, `.prose-column p + p` and `code` globally, so rendered
HTML is styled without touching a chart. The charts, the diversity modules, the dataset and
the gallery route are untouched.
