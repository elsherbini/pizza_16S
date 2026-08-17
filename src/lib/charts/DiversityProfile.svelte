<script lang="ts">
	/**
	 * Act 2, closing. The Hill number profile: effective number of pizza types
	 * against the order q, with q draggable.
	 *
	 * Reading one curve left to right is the whole argument for Hill numbers.
	 * At q=0 every type on the board counts once. As q rises the rare types stop
	 * mattering and the curve falls to whatever the shop really runs on.
	 */
	import { scaleLinear } from 'd3-scale';
	import { line } from 'd3-shape';
	import { hill } from '$lib/diversity/alpha';
	import { countVector, type Shop } from '$lib/data/index';
	import { HERO_COLOR, formatNumber } from '$lib/viz/theme';

	interface Props {
		shops: Shop[];
		/** Bound to the slider so the surrounding prose can read it. */
		q?: number;
	}

	let { shops, q = $bindable(1) }: Props = $props();

	const WIDTH = 640;
	const HEIGHT = 414;
	const MARGIN = { top: 24, right: 132, bottom: 62, left: 54 };
	const Q_MAX = 4;

	const series = $derived(
		shops.map((shop) => {
			const counts = countVector(shop);
			const points: Array<[number, number]> = [];
			for (let step = 0; step <= 160; step++) {
				const order = (step / 160) * Q_MAX;
				points.push([order, hill(counts, order)]);
			}
			return {
				shop,
				counts,
				points,
				color: HERO_COLOR[shop.id] ?? 'var(--ink-secondary)'
			};
		})
	);

	const yMax = $derived(Math.ceil(Math.max(...series.map((s) => s.points[0][1])) + 0.5));

	const x = $derived(
		scaleLinear()
			.domain([0, Q_MAX])
			.range([MARGIN.left, WIDTH - MARGIN.right])
	);
	const y = $derived(
		scaleLinear()
			.domain([0, yMax])
			.range([HEIGHT - MARGIN.bottom, MARGIN.top])
	);

	const path = $derived(
		line<[number, number]>()
			.x((d) => x(d[0]))
			.y((d) => y(d[1]))
	);

	const atQ = $derived(
		series.map((s) => ({
			shop: s.shop,
			color: s.color,
			value: hill(s.counts, q)
		}))
	);

	const NAMED_ORDERS = [
		{ q: 0, label: 'q = 0', note: 'richness' },
		{ q: 1, label: 'q = 1', note: 'exp(Shannon)' },
		{ q: 2, label: 'q = 2', note: 'inverse Simpson' }
	];
</script>

<figure>
	<svg viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-label={ariaLabel(atQ, q)}>
		{#each y.ticks(5) as tick (tick)}
			<line class="grid" x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(tick)} y2={y(tick)} />
			<text class="tick-label" x={MARGIN.left - 8} y={y(tick) + 4} text-anchor="end">{tick}</text>
		{/each}

		{#each NAMED_ORDERS as order (order.q)}
			<line class="named-order" x1={x(order.q)} x2={x(order.q)} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} />
			<text class="tick-label" x={x(order.q)} y={HEIGHT - MARGIN.bottom + 18} text-anchor="middle">
				{order.label}
			</text>
			<text class="order-note" x={x(order.q)} y={HEIGHT - MARGIN.bottom + 32} text-anchor="middle">
				{order.note}
			</text>
		{/each}

		<line class="cursor" x1={x(q)} x2={x(q)} y1={MARGIN.top - 6} y2={HEIGHT - MARGIN.bottom} />

		{#each series as s (s.shop.id)}
			<path class="curve" d={path(s.points)} stroke={s.color} />
		{/each}

		{#each atQ as entry (entry.shop.id)}
			<circle class="dot" cx={x(q)} cy={y(entry.value)} r="5" fill={entry.color} />
			<text class="series-label" x={WIDTH - MARGIN.right + 10} y={y(entry.value) + 4}>
				{entry.shop.name}
			</text>
			<text class="series-value" x={WIDTH - MARGIN.right + 10} y={y(entry.value) + 19}>
				{formatNumber(entry.value, 2)} effective types
			</text>
		{/each}

		<text class="axis-title" x={MARGIN.left} y={HEIGHT - 6}>
			order q, from counting every type equally to counting only the common ones
		</text>
		<text
			class="axis-title"
			transform="translate(14, {(HEIGHT - MARGIN.bottom + MARGIN.top) / 2}) rotate(-90)"
			text-anchor="middle"
		>
			effective number of pizza types
		</text>
	</svg>

	<label class="control ui">
		<span>order q</span>
		<input type="range" min="0" max={Q_MAX} step="0.05" bind:value={q} />
		<span class="q-value">{formatNumber(q, 2)}</span>
	</label>
</figure>

<script lang="ts" module>
	function ariaLabel(
		entries: Array<{ shop: { name: string }; value: number }>,
		q: number
	): string {
		return `Hill number profiles. At q equals ${q.toFixed(2)}: ${entries
			.map((e) => `${e.shop.name} ${e.value.toFixed(2)} effective types`)
			.join(', ')}`;
	}
</script>

<style>
	figure {
		margin: 0;
		width: 100%;
		max-width: 42rem;
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

	.named-order {
		stroke: var(--grid);
		stroke-width: 1;
		stroke-dasharray: 2 3;
	}

	.cursor {
		stroke: var(--ink);
		stroke-width: 1.5;
		opacity: 0.55;
	}

	.dot {
		stroke: var(--surface);
		stroke-width: 2;
	}

	.series-label {
		font-family: var(--font-ui);
		font-size: 0.72rem;
		font-weight: 600;
		fill: var(--ink);
	}

	.series-value {
		font-family: var(--font-ui);
		font-size: 0.68rem;
		font-variant-numeric: tabular-nums;
		fill: var(--ink-muted);
	}

	.order-note {
		font-family: var(--font-ui);
		font-size: 0.6rem;
		fill: var(--ink-muted);
	}

	.axis-title {
		font-family: var(--font-ui);
		font-size: 0.7rem;
		fill: var(--ink-muted);
	}

	.control {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1rem;
		font-size: 0.78rem;
		color: var(--ink-secondary);
	}

	.control input {
		flex: 1;
		max-width: 20rem;
		accent-color: var(--series-1);
	}

	.q-value {
		font-variant-numeric: tabular-nums;
		color: var(--ink);
		min-width: 3ch;
	}
</style>
