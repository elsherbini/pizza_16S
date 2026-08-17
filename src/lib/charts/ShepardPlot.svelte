<script lang="ts">
	/**
	 * Act 7. The Shepard diagram: what the metric said against what the picture
	 * drew, with the monotone step function NMDS was actually fitting.
	 *
	 * Stress is the vertical scatter around that staircase, reduced to one
	 * number. Seeing the cloud first makes the number mean something.
	 */
	import { scaleLinear } from 'd3-scale';
	import { line } from 'd3-shape';
	import { brayCurtis, distanceMatrix, relativeAbundance } from '$lib/diversity/beta';
	import { nmds, shepard } from '$lib/diversity/ordination';
	import { allShops, countMatrix } from '$lib/data/index';
	import { formatNumber } from '$lib/viz/theme';

	interface Props {
		/** 0 the cloud · 1 the isotonic fit · 2 the residuals named as stress */
		stage?: number;
	}

	let { stage = 2 }: Props = $props();

	const WIDTH = 620;
	const HEIGHT = 430;
	const MARGIN = { top: 26, right: 26, bottom: 56, left: 56 };

	const distances = distanceMatrix(countMatrix(allShops).map(relativeAbundance), brayCurtis);
	const fit = nmds(distances, { dimensions: 2 });
	const points = shepard(distances, fit.coordinates, 2);

	const x = scaleLinear()
		.domain([0, Math.max(...points.map((p) => p.observed))])
		.nice()
		.range([MARGIN.left, WIDTH - MARGIN.right]);

	const y = scaleLinear()
		.domain([0, Math.max(...points.map((p) => Math.max(p.fitted, p.disparity)))])
		.nice()
		.range([HEIGHT - MARGIN.bottom, MARGIN.top]);

	const stepPath = line<{ observed: number; disparity: number }>()
		.x((d) => x(d.observed))
		.y((d) => y(d.disparity))(points);

	/** Trace of stress over the SMACOF run, drawn as a small inset. */
	const trace = fit.stressHistory;
	const traceX = scaleLinear()
		.domain([0, Math.max(trace.length - 1, 1)])
		.range([0, 96]);
	const traceY = scaleLinear()
		.domain([0, Math.max(...trace)])
		.range([44, 0]);
	const tracePath = line<number>()
		.x((_, i) => traceX(i))
		.y((value) => traceY(value))(trace);
</script>

<figure>
	<svg
		viewBox="0 0 {WIDTH} {HEIGHT}"
		role="img"
		aria-label="Shepard diagram: Bray-Curtis dissimilarity against the distance the NMDS drew, for all {points.length} pairs of pizzerias. Stress {fit.stress.toFixed(
			3
		)}."
	>
		{#each y.ticks(5) as tick (tick)}
			<line class="grid" x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(tick)} y2={y(tick)} />
			<text class="tick-label" x={MARGIN.left - 8} y={y(tick) + 4} text-anchor="end">{tick}</text>
		{/each}
		{#each x.ticks(5) as tick (tick)}
			<text class="tick-label" x={x(tick)} y={HEIGHT - MARGIN.bottom + 18} text-anchor="middle">
				{tick}
			</text>
		{/each}

		{#if stage >= 2}
			{#each points as point (`${point.i}-${point.j}`)}
				<line
					class="residual"
					x1={x(point.observed)}
					x2={x(point.observed)}
					y1={y(point.fitted)}
					y2={y(point.disparity)}
				/>
			{/each}
		{/if}

		{#each points as point (`${point.i}-${point.j}`)}
			<circle class="pair" cx={x(point.observed)} cy={y(point.fitted)} r="2.6" />
		{/each}

		{#if stage >= 1}
			<path class="isotonic" d={stepPath} />
		{/if}

		<line
			class="axis"
			x1={MARGIN.left}
			x2={WIDTH - MARGIN.right}
			y1={HEIGHT - MARGIN.bottom}
			y2={HEIGHT - MARGIN.bottom}
		/>

		<text class="axis-title" x={MARGIN.left} y={HEIGHT - 10}>
			Bray-Curtis dissimilarity the metric reported
		</text>
		<text
			class="axis-title"
			transform="translate(15, {(HEIGHT - MARGIN.bottom + MARGIN.top) / 2}) rotate(-90)"
			text-anchor="middle"
		>
			distance the ordination drew
		</text>

		{#if stage >= 2}
			<g transform="translate({WIDTH - MARGIN.right - 130}, {MARGIN.top + 6})">
				<text class="inset-title">stress over the fit</text>
				<g transform="translate(0, 10)">
					<path class="trace" d={tracePath} />
					<text class="inset-value" x="0" y="60">
						{formatNumber(trace[0], 3)} at the PCoA start
					</text>
					<text class="inset-value" x="0" y="74">
						{formatNumber(fit.stress, 3)} after {trace.length - 1} accepted steps
					</text>
				</g>
			</g>
		{/if}
	</svg>

	<p class="caption">
		Each dot is one of the {points.length} pizzeria pairs. The staircase is the monotone regression NMDS
		fits; the vertical ticks are the residuals that stress summarises.
	</p>
</figure>

<style>
	figure {
		margin: 0;
		width: 100%;
		max-width: 40rem;
	}

	svg {
		width: 100%;
		height: auto;
		display: block;
		overflow: visible;
	}

	.pair {
		fill: var(--series-1);
		opacity: 0.5;
	}

	.isotonic {
		fill: none;
		stroke: var(--ink);
		stroke-width: 2;
	}

	.residual {
		stroke: var(--series-2);
		stroke-width: 1;
		opacity: 0.55;
	}

	.trace {
		fill: none;
		stroke: var(--ink-secondary);
		stroke-width: 1.5;
	}

	.grid {
		stroke: var(--grid);
		stroke-width: 1;
	}

	.axis {
		stroke: var(--axis);
		stroke-width: 1;
	}

	.axis-title,
	.inset-title,
	.inset-value {
		font-family: var(--font-ui);
		font-size: 0.68rem;
		fill: var(--ink-muted);
	}

	.inset-title {
		font-size: 0.64rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}

	.inset-value {
		font-variant-numeric: tabular-nums;
	}

	.caption {
		margin-top: 0.7rem;
	}
</style>
