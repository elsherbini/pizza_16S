<script lang="ts">
	/**
	 * Acts 1 and 2. Three shops side by side, first as a countable set of pizza
	 * types and then as the share of the night each type actually took.
	 *
	 * Stages
	 *  0  one square per type present, all the same size
	 *  1  the richness count called out
	 *  2  squares become a stacked share of tickets
	 */
	import { observedRichness } from '$lib/diversity/alpha';
	import { countVector, soldPizzas, ticketsSold, type Shop } from '$lib/data/index';
	import { CATEGORY_COLOR, CATEGORY_LABEL, CATEGORY_ORDER } from '$lib/viz/theme';

	interface Props {
		shops: Shop[];
		stage: number;
	}

	let { shops, stage }: Props = $props();

	const WIDTH = 720;
	const HEIGHT = 470;
	const PANEL_W = 224;
	const GRID_COLUMNS = 5;
	const SQUARE = 26;
	const SQUARE_GAP = 7;
	const BAR_W = 62;
	const BAR_TOP = 62;
	const BAR_H = 268;

	const panelX = (index: number) => 24 + index * (PANEL_W + 8);

	interface Cell {
		key: string;
		name: string;
		count: number;
		color: string;
		x: number;
		y: number;
		width: number;
		height: number;
	}

	const panels = $derived(
		shops.map((shop, panelIndex) => {
			const entries = soldPizzas(shop);
			const total = ticketsSold(shop);
			const left = panelX(panelIndex);

			const gridWidth = GRID_COLUMNS * SQUARE + (GRID_COLUMNS - 1) * SQUARE_GAP;
			const gridLeft = left + (PANEL_W - gridWidth) / 2;
			const barLeft = left + (PANEL_W - BAR_W) / 2;

			let stacked = BAR_TOP;
			const cells: Cell[] = entries.map((entry, i) => {
				const share = entry.count / total;
				const height = share * BAR_H;
				const top = stacked;
				stacked += height;

				const grid = {
					x: gridLeft + (i % GRID_COLUMNS) * (SQUARE + SQUARE_GAP),
					y: BAR_TOP + Math.floor(i / GRID_COLUMNS) * (SQUARE + SQUARE_GAP),
					width: SQUARE,
					height: SQUARE
				};
				const bar = {
					x: barLeft,
					y: top,
					width: BAR_W,
					// A 2px surface gap between stacked segments, without letting a
					// thin segment collapse to nothing.
					height: Math.max(height - 2, 0.6)
				};

				return {
					key: entry.pizza.id,
					name: entry.pizza.name,
					count: entry.count,
					color: CATEGORY_COLOR[entry.pizza.category],
					...(stage >= 2 ? bar : grid)
				};
			});

			return {
				shop,
				total,
				richness: observedRichness(countVector(shop)),
				left,
				cells,
				largest: entries[0]
			};
		})
	);

	const usedCategories = $derived(
		CATEGORY_ORDER.filter((category) =>
			shops.some((shop) => soldPizzas(shop).some((s) => s.pizza.category === category))
		)
	);
</script>

<figure>
	<svg viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-label={ariaLabel(panels)}>
		{#each panels as panel (panel.shop.id)}
			<text class="shop-name" x={panel.left + PANEL_W / 2} y="24" text-anchor="middle">
				{panel.shop.name}
			</text>
			<text class="shop-meta" x={panel.left + PANEL_W / 2} y="42" text-anchor="middle">
				{panel.total} tickets
			</text>

			{#each panel.cells as cell (cell.key)}
				<g class="cell" style:transform="translate({cell.x}px, {cell.y}px)">
					<rect width="1" height="1" fill={cell.color} style:transform="scale({cell.width}, {cell.height})" />
				</g>
			{/each}

			{#if stage >= 1}
				<g class="readout" transform="translate({panel.left + PANEL_W / 2}, 384)">
					<text class="value" text-anchor="middle">{panel.richness}</text>
					<text class="value-label" y="20" text-anchor="middle">pizza types observed</text>
				</g>
			{/if}

			{#if stage >= 2 && panel.largest}
				<g transform="translate({panel.left + PANEL_W / 2}, 348)">
					<text class="callout" text-anchor="middle">
						{Math.round((panel.largest.count / panel.total) * 100)}% {panel.largest.pizza.name}
					</text>
				</g>
			{/if}
		{/each}
	</svg>

	<div class="legend caption">
		{#each usedCategories as category (category)}
			<span class="key">
				<span class="swatch" style:background={CATEGORY_COLOR[category]}></span>
				{CATEGORY_LABEL[category]}
			</span>
		{/each}
	</div>
</figure>

<script lang="ts" module>
	function ariaLabel(panels: Array<{ shop: { name: string }; richness: number }>): string {
		return `Observed richness: ${panels.map((p) => `${p.shop.name} ${p.richness} types`).join(', ')}`;
	}
</script>

<style>
	figure {
		margin: 0;
		width: 100%;
		max-width: 46rem;
	}

	svg {
		width: 100%;
		height: auto;
		display: block;
		overflow: visible;
	}

	.cell {
		transition: transform 850ms cubic-bezier(0.2, 0.7, 0.2, 1);
	}

	.cell rect {
		transition: transform 850ms cubic-bezier(0.2, 0.7, 0.2, 1);
		transform-origin: 0 0;
	}

	.shop-name {
		font-family: var(--font-ui);
		font-size: 0.8rem;
		font-weight: 600;
		fill: var(--ink);
	}

	.shop-meta {
		font-family: var(--font-ui);
		font-size: 0.7rem;
		fill: var(--ink-muted);
	}

	.value {
		font-family: var(--font-ui);
		font-size: 2rem;
		font-weight: 600;
		fill: var(--ink);
	}

	.value-label {
		font-family: var(--font-ui);
		font-size: 0.7rem;
		fill: var(--ink-muted);
	}

	.callout {
		font-family: var(--font-ui);
		font-size: 0.72rem;
		fill: var(--ink-secondary);
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 1rem;
		margin-top: 0.9rem;
	}

	.key {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.swatch {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 0.15rem;
		display: inline-block;
	}
</style>
