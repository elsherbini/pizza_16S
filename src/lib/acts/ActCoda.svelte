<script lang="ts">
	import { act } from '$lib/content/index';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	const content = act('coda');

	// The only act that is not a scroller. Its three blocks are the three
	// regions of the page: running prose, the glossary table breaking out of the
	// measure, and the colophon.
	const [prose, glossary, colophon] = content.blocks;
</script>

<ActHeader act={content} />

<section class="coda">
	<div class="prose-column">{@html prose}</div>

	<div class="table-wrap">{@html glossary}</div>

	<div class="prose-column colophon">{@html colophon}</div>
</section>

<style>
	/*
	 * These blocks arrive as `{@html}`, which Svelte's scoped styles cannot
	 * reach, so every selector below is global and fenced behind `.coda`.
	 */
	.coda {
		padding: 0 1.25rem 7rem;
	}

	.prose-column {
		margin: 0 auto;
	}

	.coda :global(h3) {
		font-size: 1.35rem;
		letter-spacing: -0.01em;
		margin: 2.75rem 0 1rem;
		font-weight: 600;
	}

	.coda :global(h4) {
		font-family: var(--font-ui);
		font-size: 0.78rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-muted);
		margin: 2.25rem 0 0.5rem;
		font-weight: 600;
	}

	.table-wrap {
		max-width: 52rem;
		margin: 0 auto 1rem;
		overflow-x: auto;
		border: 1px solid var(--hairline);
		border-radius: 0.5rem;
		background: var(--surface);
	}

	.table-wrap :global(table) {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-ui);
		font-size: 0.8rem;
	}

	.table-wrap :global(th),
	.table-wrap :global(td) {
		text-align: left;
		padding: 0.5rem 0.85rem;
		border-bottom: 1px solid var(--hairline);
		font-weight: 400;
		vertical-align: top;
	}

	.table-wrap :global(thead th) {
		font-weight: 600;
		color: var(--ink);
		white-space: nowrap;
	}

	.table-wrap :global(tbody th) {
		color: var(--ink);
		font-weight: 500;
	}

	.table-wrap :global(tbody td) {
		color: var(--ink-secondary);
	}

	.table-wrap :global(tbody tr:last-child th),
	.table-wrap :global(tbody tr:last-child td) {
		border-bottom: none;
	}

	/* The third column names the tool function, so it is set in the mono face. */
	.table-wrap :global(tbody td:nth-child(3)) {
		font-family: var(--font-mono);
		font-size: 0.74rem;
		color: var(--ink-muted);
	}

	.colophon {
		margin-top: 3rem;
	}
</style>
