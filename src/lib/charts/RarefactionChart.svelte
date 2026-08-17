<script lang="ts">
	/**
	 * Act 3. Rarefaction curves for the hero cast, with a draggable depth.
	 *
	 * Stages
	 *  0  the curves
	 *  1  each curve stops where that shop's night stopped
	 *  2  a common depth, draggable, with the rarefied richness at that depth
	 *  3  Good's coverage alongside
	 */
	import { scaleLinear } from 'd3-scale';
	import { line } from 'd3-shape';
	import { goodsCoverage, observedRichness, rarefactionCurve, totalCount } from '$lib/diversity/alpha';
	import { countVector, type Shop } from '$lib/data/index';
	import { HERO_COLOR, formatNumber, formatPercent } from '$lib/viz/theme';

	interface Props {
		shops: Shop[];
		stage: number;
		depth?: number;
	}

	let { shops, stage, depth = $bindable(34) }: Props = $props();

	const WIDTH = 660;
	const HEIGHT = 410;
	const MARGIN = { top: 22, right: 158, bottom: 54, left: 52 };

	const series = $derived(
		shops.map((shop) => {
			const counts = countVector(shop);
			const total = totalCount(counts);
			const curve = rarefactionCurve(counts, { step: Math.max(1, Math.round(total / 70)) });
			return {
				shop,
				counts,
				total,
				curve,
				observed: observedRichness(counts),
				coverage: goodsCoverage(counts),
				singletons: counts.filter((c) => c === 1).length,
				color: HERO_COLOR[shop.id] ?? 'var(--ink-secondary)'
			};
		})
	);

	const maxDepth = $derived(Math.max(...series.map((s) => s.total)));
	const minDepth = $derived(Math.min(...series.map((s) => s.total)));
	const maxRichness = $derived(Math.max(...series.map((s) => s.observed)));

	const x = $derived(
		scaleLinear()
			.domain([0, maxDepth])
			.range([MARGIN.left, WIDTH - MARGIN.right])
	);
	const y = $derived(
		scaleLinear()
			.domain([0, maxRichness + 1])
			.range([HEIGHT - MARGIN.bottom, MARGIN.top])
	);

	const path = $derived(
		line<{ depth: number; expectedRichness: number }>()
			.x((d) => x(d.depth))
			.y((d) => y(d.expectedRichness))
	);

	/** Where each shop sits if you read only `depth` of its tickets. */
	const atDepth = $derived(
		series.map((s) => {
			const reachable = s.total >= depth;
			const point = reachable
				? s.curve.reduce((best, p) =>
						Math.abs(p.depth - depth) < Math.abs(best.depth - depth) ? p : best
					)
				: null;
			return { ...s, reachable, value: point?.expectedRichness ?? null };
		})
	);

	/** Label rows, nudged apart so the five names never sit on top of each other. */
	const labels = $derived.by(() => {
		const rows = atDepth
			.map((s) => ({
				id: s.shop.id,
				name: s.shop.name,
				color: s.color,
				total: s.total,
				observed: s.observed,
				coverage: s.coverage,
				singletons: s.singletons,
				rarefied: s.value,
				y: y(s.observed)
			}))
			.sort((a, b) => a.y - b.y);

		const minGap = 34;
		for (let i = 1; i < rows.length; i++) {
			if (rows[i].y - rows[i - 1].y < minGap) rows[i].y = rows[i - 1].y + minGap;
		}
		return rows;
	});
</script>

<figure>
	<svg viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-label={ariaLabel(series)}>
		{#each y.ticks(6) as tick (tick)}
			<line class="grid" x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(tick)} y2={y(tick)} />
			<text class="tick-label" x={MARGIN.left - 8} y={y(tick) + 4} text-anchor="end">{tick}</text>
		{/each}

		{#each x.ticks(6) as tick (tick)}
			<text class="tick-label" x={x(tick)} y={HEIGHT - MARGIN.bottom + 18} text-anchor="middle">
				{tick}
			</text>
		{/each}

		<line
			class="axis"
			x1={MARGIN.left}
			x2={WIDTH - MARGIN.right}
			y1={HEIGHT - MARGIN.bottom}
			y2={HEIGHT - MARGIN.bottom}
		/>

		{#if stage >= 2}
			<line class="cursor" x1={x(depth)} x2={x(depth)} y1={MARGIN.top - 4} y2={HEIGHT - MARGIN.bottom} />
			<text class="cursor-label" x={x(depth)} y={MARGIN.top - 8} text-anchor="middle">
				{depth} tickets
			</text>
		{/if}

		{#each series as s (s.shop.id)}
			<path class="curve" d={path(s.curve)} stroke={s.color} />
			{#if stage >= 1}
				<circle class="endpoint" cx={x(s.total)} cy={y(s.observed)} r="4" fill={s.color} />
			{/if}
		{/each}

		{#each atDepth as s (s.shop.id)}
			{#if stage >= 2 && s.reachable && s.value !== null}
				<circle class="dot" cx={x(depth)} cy={y(s.value)} r="5" fill={s.color} />
			{/if}
		{/each}

		{#each labels as row (row.id)}
			<g transform="translate({WIDTH - MARGIN.right + 12}, {row.y})">
				<!-- Identity sits in the swatch; the text keeps its ink token. -->
				<rect x="0" y="-9" width="8" height="8" rx="1.5" fill={row.color} />
				<text class="series-label" x="13">{row.name}</text>
				{#if stage >= 3}
					<text class="series-note" x="13" y="14">
						coverage {formatPercent(row.coverage, 1)}, {row.singletons} singleton{row.singletons ===
						1
							? ''
							: 's'}
					</text>
				{:else if stage >= 2}
					<text class="series-note" x="13" y="14">
						{row.rarefied === null ? 'shallower than this depth' : `${formatNumber(row.rarefied, 1)} types at ${depth}`}
					</text>
				{:else}
					<text class="series-note" x="13" y="14">
						{row.observed} types from {row.total} tickets
					</text>
				{/if}
			</g>
		{/each}

		<text class="axis-title" x={MARGIN.left} y={HEIGHT - 12}>
			tickets read (sequencing depth)
		</text>

		<text
			class="axis-title"
			transform="translate(13, {(HEIGHT - MARGIN.bottom + MARGIN.top) / 2}) rotate(-90)"
			text-anchor="middle"
		>
			expected pizza types seen
		</text>
	</svg>

	{#if stage >= 2}
		<label class="control ui">
			<span>read only</span>
			<input type="range" min="1" max={minDepth} step="1" bind:value={depth} />
			<span class="depth-value">{depth} tickets</span>
		</label>
	{/if}
</figure>

<script lang="ts" module>
	function ariaLabel(series: Array<{ shop: { name: string }; observed: number; total: number }>) {
		return `Rarefaction curves. ${series
			.map((s) => `${s.shop.name} reached ${s.observed} types in ${s.total} tickets`)
			.join('. ')}`;
	}
</script>

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

	.curve {
		fill: none;
		stroke-width: 2;
		stroke-linecap: round;
	}

	.grid {
		stroke: var(--grid);
		stroke-width: 1;
	}

	.axis {
		stroke: var(--axis);
		stroke-width: 1;
	}

	.cursor {
		stroke: var(--ink);
		stroke-width: 1.5;
		opacity: 0.5;
		stroke-dasharray: 3 3;
	}

	.cursor-label {
		font-family: var(--font-ui);
		font-size: 0.66rem;
		fill: var(--ink-secondary);
	}

	.dot,
	.endpoint {
		stroke: var(--surface);
		stroke-width: 2;
	}

	.series-label {
		font-family: var(--font-ui);
		font-size: 0.72rem;
		font-weight: 600;
		fill: var(--ink);
	}

	.series-note {
		font-family: var(--font-ui);
		font-size: 0.66rem;
		fill: var(--ink-muted);
	}

	.axis-title {
		font-family: var(--font-ui);
		font-size: 0.7rem;
		fill: var(--ink-muted);
	}

	.inline-value {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.control {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.9rem;
		font-size: 0.78rem;
		color: var(--ink-secondary);
	}

	.control input {
		flex: 1;
		max-width: 18rem;
		accent-color: var(--series-1);
	}

	.depth-value {
		font-variant-numeric: tabular-nums;
		color: var(--ink);
		min-width: 8ch;
	}
</style>
