<script lang="ts">
	/**
	 * Acts 6 to 8. The distance matrix as a map.
	 *
	 * Both axes are drawn on one scale. An ordination stretched to fill its
	 * frame misreports every distance in it, which is the most common way these
	 * plots are quietly wrong.
	 */
	import { brayCurtis, distanceMatrix, jaccard, relativeAbundance } from '$lib/diversity/beta';
	import {
		configurationDistances,
		kruskalStress,
		nmds,
		pcoa,
		rotateToPrincipalAxes
	} from '$lib/diversity/ordination';
	import {
		allShops,
		countMatrix,
		heroShops,
		STYLE_LABELS,
		type ShopStyle
	} from '$lib/data/index';
	import { STYLE_COLOR, STYLE_SHAPE, formatNumber, formatPercent, markerPath } from '$lib/viz/theme';

	interface Props {
		method?: 'pcoa' | 'nmds';
		metric?: 'bray' | 'jaccard';
		/** 0 points only · 1 style colour · 2 hero labels · 3 cluster labels */
		stage?: number;
		showControls?: boolean;
	}

	let {
		method = $bindable('pcoa'),
		metric = $bindable('bray'),
		stage = 3,
		showControls = false
	}: Props = $props();

	const WIDTH = 640;
	const HEIGHT = 440;
	const MARGIN = { top: 30, right: 24, bottom: 58, left: 46 };
	const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
	const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

	const counts = countMatrix(allShops);
	const heroIds = new Set(heroShops.map((s) => s.id));

	const distances = $derived(
		metric === 'jaccard'
			? distanceMatrix(counts, jaccard)
			: distanceMatrix(counts.map(relativeAbundance), brayCurtis)
	);

	const pcoaResult = $derived(pcoa(distances));
	const nmdsResult = $derived(nmds(distances, { dimensions: 2 }));

	const coordinates = $derived(
		rotateToPrincipalAxes(
			method === 'pcoa' ? pcoaResult.coordinates : nmdsResult.coordinates,
			2
		)
	);

	/** One scale for both axes, so the picture preserves the distances it claims to. */
	const projection = $derived.by(() => {
		const xs = coordinates.map((c) => c[0]);
		const ys = coordinates.map((c) => c[1]);
		const xMin = Math.min(...xs);
		const xMax = Math.max(...xs);
		const yMin = Math.min(...ys);
		const yMax = Math.max(...ys);
		const spanX = xMax - xMin || 1;
		const spanY = yMax - yMin || 1;
		const k = Math.min(PLOT_W / spanX, PLOT_H / spanY) * 0.9;
		const cx = MARGIN.left + PLOT_W / 2;
		const cy = MARGIN.top + PLOT_H / 2;
		const midX = (xMin + xMax) / 2;
		const midY = (yMin + yMax) / 2;
		return {
			x: (value: number) => cx + (value - midX) * k,
			// Screen y grows downward; ordination sign is arbitrary either way.
			y: (value: number) => cy - (value - midY) * k
		};
	});

	const points = $derived(
		allShops.map((shop, i) => ({
			shop,
			isHero: heroIds.has(shop.id),
			color: STYLE_COLOR[shop.style],
			shape: STYLE_SHAPE[shop.style],
			cx: projection.x(coordinates[i][0]),
			cy: projection.y(coordinates[i][1]),
			raw: coordinates[i]
		}))
	);

	/**
	 * Direct cluster labels, parked clear of their own points rather than on top
	 * of them. Light-mode aqua and yellow sit under 3:1 against the surface, so
	 * these labels and the table view below are the required relief.
	 */
	const clusters = $derived.by(() => {
		const groups = new Map<ShopStyle, { x: number; top: number; bottom: number; n: number }>();
		for (const point of points) {
			if (point.isHero) continue;
			const entry = groups.get(point.shop.style) ?? {
				x: 0,
				top: Infinity,
				bottom: -Infinity,
				n: 0
			};
			entry.x += point.cx;
			entry.top = Math.min(entry.top, point.cy);
			entry.bottom = Math.max(entry.bottom, point.cy);
			entry.n += 1;
			groups.set(point.shop.style, entry);
		}

		return [...groups.entries()]
			.filter(([, g]) => g.n >= 3)
			.map(([style, g]) => {
				const below = g.bottom + 24;
				const fitsBelow = below < HEIGHT - MARGIN.bottom;
				return {
					style,
					x: g.x / g.n,
					y: fitsBelow ? below : g.top - 14,
					n: g.n
				};
			});
	});

	/** Only styles actually drawn as a coloured mark; the heroes are hollow. */
	const stylesPresent = $derived([
		...new Set(points.filter((p) => !p.isHero).map((p) => p.shop.style))
	]);

	const stress = $derived(
		kruskalStress(distances, configurationDistances(coordinates, 2))
	);

	const stressVerdict = $derived(
		stress < 0.05 ? 'excellent' : stress < 0.1 ? 'good' : stress < 0.2 ? 'usable' : 'suspect'
	);

	const axisLabels = $derived(
		method === 'pcoa'
			? {
					x: `Axis 1 · ${formatPercent(pcoaResult.varianceExplained[0])} of the positive eigenvalue total`,
					y: `Axis 2 · ${formatPercent(pcoaResult.varianceExplained[1])}`
				}
			: {
					x: 'NMDS 1 · no units, freely rotatable',
					y: 'NMDS 2'
				}
	);
</script>

<figure>
	{#if showControls}
		<div class="controls ui">
			<fieldset>
				<legend>method</legend>
				<label><input type="radio" bind:group={method} value="pcoa" /> PCoA</label>
				<label><input type="radio" bind:group={method} value="nmds" /> NMDS</label>
			</fieldset>
			<fieldset>
				<legend>distance</legend>
				<label><input type="radio" bind:group={metric} value="bray" /> Bray-Curtis</label>
				<label><input type="radio" bind:group={metric} value="jaccard" /> Jaccard</label>
			</fieldset>
		</div>
	{/if}

	<svg viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-label={ariaLabel(method, metric, stress)}>
		<line class="origin" x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={projection.y(0)} y2={projection.y(0)} />
		<line class="origin" x1={projection.x(0)} x2={projection.x(0)} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} />

		{#if stage >= 3}
			{#each clusters as cluster (cluster.style)}
				<text class="cluster-label" x={cluster.x} y={cluster.y} text-anchor="middle">
					{STYLE_LABELS[cluster.style]}
				</text>
			{/each}
		{/if}

		{#each points as point (point.shop.id)}
			{#if !point.isHero}
				<path
					class="mark"
					d={markerPath(point.shape, 6)}
					transform="translate({point.cx}, {point.cy})"
					fill={stage >= 1 ? point.color : 'var(--ink-muted)'}
				/>
			{/if}
		{/each}

		{#each points as point (point.shop.id)}
			{#if point.isHero}
				<circle class="hero-mark" cx={point.cx} cy={point.cy} r="6" />
				{#if stage >= 2}
					<text class="hero-label" x={point.cx + 10} y={point.cy + 4}>{point.shop.name}</text>
				{/if}
			{/if}
		{/each}

		<text class="axis-title" x={MARGIN.left} y={HEIGHT - 30}>{axisLabels.x}</text>
		<text
			class="axis-title"
			transform="translate(14, {MARGIN.top + PLOT_H / 2}) rotate(-90)"
			text-anchor="middle"
		>
			{axisLabels.y}
		</text>

		<text class="fit-note" x={WIDTH - MARGIN.right} y="18" text-anchor="end">
			{#if method === 'pcoa'}
				negative eigenvalues hold {formatPercent(pcoaResult.negativeFraction)} of the signal
			{:else}
				stress {formatNumber(stress, 3)} ({stressVerdict}) after {nmdsResult.stressHistory.length} steps
			{/if}
		</text>
	</svg>

	<div class="legend caption">
		{#each stylesPresent as style (style)}
			<span class="key">
				<span class="swatch" class:diamond={STYLE_SHAPE[style] === 'diamond'} style:background={STYLE_COLOR[style]}></span>
				{STYLE_LABELS[style]}
			</span>
		{/each}
		<span class="key"><span class="swatch hollow"></span> the five shops from Acts 1 to 4</span>
	</div>

	<details class="table-view">
		<summary class="caption">Coordinates as a table</summary>
		<div class="table-scroll">
			<table>
				<thead>
					<tr>
						<th scope="col">Pizzeria</th>
						<th scope="col">Style</th>
						<th scope="col">Axis 1</th>
						<th scope="col">Axis 2</th>
					</tr>
				</thead>
				<tbody>
					{#each points as point (point.shop.id)}
						<tr>
							<th scope="row">{point.shop.name}</th>
							<td>{STYLE_LABELS[point.shop.style]}</td>
							<td class="num">{formatNumber(point.raw[0], 3)}</td>
							<td class="num">{formatNumber(point.raw[1], 3)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</details>
</figure>

<script lang="ts" module>
	function ariaLabel(method: string, metric: string, stress: number): string {
		const name = method === 'pcoa' ? 'Principal coordinates analysis' : 'Non-metric multidimensional scaling';
		const distance = metric === 'jaccard' ? 'Jaccard' : 'Bray-Curtis';
		return `${name} of 35 pizzerias on ${distance} distance, stress ${stress.toFixed(3)}. Coordinates are available as a table below the chart.`;
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

	.mark {
		stroke: var(--surface);
		stroke-width: 2;
		transition:
			transform 700ms cubic-bezier(0.2, 0.7, 0.2, 1),
			fill 400ms ease;
	}

	.hero-mark {
		fill: var(--surface);
		stroke: var(--ink);
		stroke-width: 2;
		transition: cx 700ms cubic-bezier(0.2, 0.7, 0.2, 1), cy 700ms cubic-bezier(0.2, 0.7, 0.2, 1);
	}

	.origin {
		stroke: var(--grid);
		stroke-width: 1;
	}

	.hero-label {
		font-family: var(--font-ui);
		font-size: 0.68rem;
		font-weight: 600;
		fill: var(--ink);
		paint-order: stroke;
		stroke: var(--surface);
		stroke-width: 3;
	}

	.cluster-label {
		font-family: var(--font-ui);
		font-size: 0.92rem;
		font-weight: 600;
		fill: var(--ink-secondary);
		opacity: 0.55;
		letter-spacing: 0.02em;
		paint-order: stroke;
		stroke: var(--surface);
		stroke-width: 4;
	}

	.axis-title,
	.fit-note {
		font-family: var(--font-ui);
		font-size: 0.7rem;
		fill: var(--ink-muted);
	}

	.controls {
		display: flex;
		gap: 1.25rem;
		margin-bottom: 0.6rem;
		font-size: 0.76rem;
	}

	fieldset {
		border: none;
		padding: 0;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	legend {
		float: left;
		margin-right: 0.6rem;
		color: var(--ink-muted);
		text-transform: uppercase;
		letter-spacing: 0.07em;
		font-size: 0.66rem;
	}

	fieldset label {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--ink-secondary);
		cursor: pointer;
	}

	fieldset input {
		accent-color: var(--series-1);
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 1rem;
		margin-top: 0.7rem;
	}

	.key {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.swatch {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		display: inline-block;
	}

	.swatch.diamond {
		border-radius: 0.1rem;
		transform: rotate(45deg);
	}

	.swatch.hollow {
		background: var(--surface);
		border: 2px solid var(--ink);
	}

	.table-view {
		margin-top: 0.9rem;
	}

	summary {
		cursor: pointer;
	}

	.table-scroll {
		max-height: 14rem;
		overflow: auto;
		margin-top: 0.5rem;
		border: 1px solid var(--hairline);
		border-radius: 0.4rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-ui);
		font-size: 0.72rem;
	}

	th,
	td {
		text-align: left;
		padding: 0.28rem 0.6rem;
		border-bottom: 1px solid var(--hairline);
		font-weight: 400;
		color: var(--ink-secondary);
	}

	thead th {
		position: sticky;
		top: 0;
		background: var(--surface);
		color: var(--ink);
		font-weight: 600;
	}

	tbody th {
		color: var(--ink);
	}

	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
</style>
