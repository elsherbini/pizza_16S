<script lang="ts">
	/**
	 * Act 5. The distance matrix, which holds everything you know about how the
	 * samples relate and is unreadable the moment there are more than a handful.
	 *
	 * Stages
	 *  0  five shops, every number printed
	 *  1  all thirty-five, in the order they arrived
	 *  2  reordered along the first PCoA axis, so the blocks appear
	 */
	import { brayCurtis, distanceMatrix, relativeAbundance } from '$lib/diversity/beta';
	import { pcoa } from '$lib/diversity/ordination';
	import { allShops, countMatrix, heroShops, STYLE_LABELS, type Shop } from '$lib/data/index';
	import { STYLE_COLOR, formatNumber } from '$lib/viz/theme';

	interface Props {
		stage: number;
	}

	let { stage }: Props = $props();

	const WIDTH = 660;
	const HEIGHT = 470;

	/** Five discrete steps off the sequential ramp, rather than a continuous fill. */
	const BINS = [
		{ upper: 0.2, token: 'var(--seq-100)', label: '0.0–0.2' },
		{ upper: 0.4, token: 'var(--seq-250)', label: '0.2–0.4' },
		{ upper: 0.6, token: 'var(--seq-400)', label: '0.4–0.6' },
		{ upper: 0.8, token: 'var(--seq-550)', label: '0.6–0.8' },
		{ upper: Infinity, token: 'var(--seq-700)', label: '0.8–1.0' }
	];

	const binOf = (value: number) => BINS.find((bin) => value < bin.upper) ?? BINS[BINS.length - 1];

	const shops = $derived<Shop[]>(stage === 0 ? heroShops : allShops);

	const distances = $derived(
		distanceMatrix(countMatrix(shops).map(relativeAbundance), brayCurtis)
	);

	/**
	 * Stage 2 sorts by the first principal coordinate. It is the cheapest way to
	 * show that the matrix has structure, and it is a preview of Act 6: the
	 * ordering that makes the blocks visible is the ordination itself.
	 */
	const order = $derived.by(() => {
		const indices = shops.map((_, i) => i);
		if (stage < 2) return indices;
		const axis = pcoa(distances).coordinates.map((row) => row[0]);
		return indices.sort((i, j) => axis[i] - axis[j]);
	});

	const cell = $derived(Math.min(52, 330 / Math.max(shops.length, 1)));
	const gridLeft = $derived((WIDTH - shops.length * cell) / 2 + 60);
	const gridTop = 44;

	const pairCount = $derived((shops.length * (shops.length - 1)) / 2);

	const stylesPresent = $derived([...new Set(shops.map((s) => s.style))]);
</script>

<figure>
	<svg
		viewBox="0 0 {WIDTH} {HEIGHT}"
		role="img"
		aria-label="Bray-Curtis distance matrix for {shops.length} pizzerias, holding {pairCount} distinct pairwise distances"
	>
		{#each order as rowIndex, row (shops[rowIndex].id)}
			{#each order as colIndex, col (shops[colIndex].id)}
				<rect
					x={gridLeft + col * cell}
					y={gridTop + row * cell}
					width={Math.max(cell - 1, 1)}
					height={Math.max(cell - 1, 1)}
					fill={row === col ? 'var(--grid)' : binOf(distances[rowIndex][colIndex]).token}
				/>
				{#if stage === 0 && row !== col}
					<text
						class="cell-value"
						x={gridLeft + col * cell + cell / 2}
						y={gridTop + row * cell + cell / 2 + 4}
						text-anchor="middle"
						fill={distances[rowIndex][colIndex] > 0.55 ? 'var(--surface)' : 'var(--ink)'}
					>
						{formatNumber(distances[rowIndex][colIndex])}
					</text>
				{/if}
			{/each}

			{#if stage === 0}
				<text class="row-label" x={gridLeft - 8} y={gridTop + row * cell + cell / 2 + 4} text-anchor="end">
					{shops[rowIndex].name}
				</text>
			{:else}
				<rect
					x={gridLeft - 10}
					y={gridTop + row * cell}
					width="5"
					height={Math.max(cell - 1, 1)}
					fill={STYLE_COLOR[shops[rowIndex].style]}
				/>
			{/if}
		{/each}

		<text class="note" x={gridLeft} y={gridTop + shops.length * cell + 26}>
			{shops.length} shops, {pairCount} distinct pairwise distances
		</text>

		{#if stage >= 1}
			<g transform="translate({gridLeft}, {gridTop + shops.length * cell + 48})">
				{#each stylesPresent as style, i (style)}
					<g transform="translate({i * 118}, 0)">
						<rect width="8" height="8" y="-7" rx="1.5" fill={STYLE_COLOR[style]} />
						<text class="legend-label" x="13">{STYLE_LABELS[style]}</text>
					</g>
				{/each}
			</g>
		{/if}

		<g transform="translate({gridLeft}, {gridTop - 22})">
			{#each BINS as bin, i (bin.label)}
				<g transform="translate({i * 76}, 0)">
					<rect width="14" height="10" y="-9" fill={bin.token} />
					<text class="legend-label" x="19">{bin.label}</text>
				</g>
			{/each}
			<text class="legend-label" x={BINS.length * 76 + 6}>Bray-Curtis</text>
		</g>
	</svg>
</figure>

<style>
	figure {
		margin: 0;
		width: 100%;
		max-width: 44rem;
	}

	svg {
		width: 100%;
		height: auto;
		display: block;
		overflow: visible;
	}

	.cell-value {
		font-family: var(--font-ui);
		font-size: 0.66rem;
		font-variant-numeric: tabular-nums;
	}

	.row-label {
		font-family: var(--font-ui);
		font-size: 0.68rem;
		fill: var(--ink);
	}

	.note {
		font-family: var(--font-ui);
		font-size: 0.72rem;
		fill: var(--ink-secondary);
	}

	.legend-label {
		font-family: var(--font-ui);
		font-size: 0.66rem;
		fill: var(--ink-muted);
	}
</style>
