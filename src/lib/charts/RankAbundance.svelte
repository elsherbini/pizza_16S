<script lang="ts">
	/**
	 * Act 2. The same three shops as rank-abundance profiles on one shared
	 * scale, so the shape of each community is directly comparable.
	 *
	 * Stages
	 *  0  bars only
	 *  1  Shannon
	 *  2  Shannon, Simpson, and Pielou together
	 */
	import { pielou, shannon, simpson } from '$lib/diversity/alpha';
	import { countVector, soldPizzas, ticketsSold, type Shop } from '$lib/data/index';
	import { CATEGORY_COLOR, formatNumber } from '$lib/viz/theme';

	interface Props {
		shops: Shop[];
		stage: number;
	}

	let { shops, stage }: Props = $props();

	const WIDTH = 720;
	const HEIGHT = 430;
	const PANEL_W = 224;
	const BAR_MAX = 168;
	const BAR_H = 9;
	const BAR_GAP = 4;
	const BAR_TOP = 74;

	const panelX = (index: number) => 24 + index * (PANEL_W + 8);

	const profiles = $derived(
		shops.map((shop, index) => {
			const total = ticketsSold(shop);
			const counts = countVector(shop);
			return {
				shop,
				total,
				left: panelX(index),
				bars: soldPizzas(shop).map((entry) => ({
					id: entry.pizza.id,
					name: entry.pizza.name,
					share: entry.count / total,
					count: entry.count,
					color: CATEGORY_COLOR[entry.pizza.category]
				})),
				shannon: shannon(counts),
				simpson: simpson(counts),
				pielou: pielou(counts)
			};
		})
	);

	/** One scale across all three panels; otherwise the comparison is a lie. */
	const maxShare = $derived(Math.max(...profiles.flatMap((p) => p.bars.map((b) => b.share))));

	const ticks = $derived.by(() => {
		const step = maxShare > 0.6 ? 0.25 : 0.1;
		const out: number[] = [];
		for (let v = 0; v <= maxShare + 1e-9; v += step) out.push(v);
		return out;
	});

	const metricsTop = 292;
</script>

<figure>
	<svg viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-label={ariaLabel(profiles)}>
		{#each profiles as profile (profile.shop.id)}
			<text class="shop-name" x={profile.left} y="20">{profile.shop.name}</text>
			<text class="shop-meta" x={profile.left} y="37">{profile.total} tickets</text>

			{#each ticks as tick (tick)}
				<line
					class="grid"
					x1={profile.left + (tick / maxShare) * BAR_MAX}
					x2={profile.left + (tick / maxShare) * BAR_MAX}
					y1={BAR_TOP - 10}
					y2={BAR_TOP + 14 * (BAR_H + BAR_GAP)}
				/>
				<text class="tick-label" x={profile.left + (tick / maxShare) * BAR_MAX} y={BAR_TOP - 16} text-anchor="middle">
					{Math.round(tick * 100)}%
				</text>
			{/each}

			{#each profile.bars as bar, i (bar.id)}
				<rect
					class="bar"
					x={profile.left}
					y={BAR_TOP + i * (BAR_H + BAR_GAP)}
					width={Math.max((bar.share / maxShare) * BAR_MAX, 1.2)}
					height={BAR_H}
					rx="2"
					fill={bar.color}
				/>
				{#if i === 0}
					{@const barWidth = (bar.share / maxShare) * BAR_MAX}
					{@const inside = barWidth > BAR_MAX * 0.55}
					<text
						class="bar-label"
						class:inside
						x={inside ? profile.left + barWidth - 5 : profile.left + barWidth + 6}
						y={BAR_TOP + BAR_H - 1}
						text-anchor={inside ? 'end' : 'start'}
					>
						{bar.name}
					</text>
				{/if}
			{/each}

			<g transform="translate({profile.left}, {metricsTop})">
				<line class="rule" x1="0" x2={BAR_MAX} y1="0" y2="0" />

				<text class="metric-name" y="20">Richness</text>
				<text class="metric-value" x={BAR_MAX} y="20" text-anchor="end">{profile.bars.length}</text>

				{#if stage >= 1}
					<text class="metric-name" y="44">Shannon H'</text>
					<text class="metric-value strong" x={BAR_MAX} y="44" text-anchor="end">
						{formatNumber(profile.shannon)}
					</text>
				{/if}

				{#if stage >= 2}
					<text class="metric-name" y="68">Simpson D</text>
					<text class="metric-value" x={BAR_MAX} y="68" text-anchor="end">
						{formatNumber(profile.simpson)}
					</text>

					<text class="metric-name" y="92">Pielou J'</text>
					<text class="metric-value" x={BAR_MAX} y="92" text-anchor="end">
						{formatNumber(profile.pielou)}
					</text>
				{/if}
			</g>
		{/each}

		<text class="axis-title" x={24} y={BAR_TOP + 14 * (BAR_H + BAR_GAP) + 22}>
			share of the night's tickets, most popular pizza first
		</text>
	</svg>
</figure>

<script lang="ts" module>
	function ariaLabel(
		profiles: Array<{ shop: { name: string }; shannon: number; bars: unknown[] }>
	): string {
		return `Rank abundance profiles. ${profiles
			.map((p) => `${p.shop.name}: ${p.bars.length} types, Shannon ${p.shannon.toFixed(2)}`)
			.join('. ')}`;
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

	.bar {
		transition: width 600ms cubic-bezier(0.2, 0.7, 0.2, 1);
	}

	.grid {
		stroke: var(--grid);
		stroke-width: 1;
	}

	.rule {
		stroke: var(--axis);
		stroke-width: 1;
	}

	.shop-name {
		font-family: var(--font-ui);
		font-size: 0.8rem;
		font-weight: 600;
		fill: var(--ink);
	}

	.shop-meta,
	.bar-label {
		font-family: var(--font-ui);
		font-size: 0.68rem;
		fill: var(--ink-muted);
	}

	/* A long first bar swallows its own label rather than reaching into the
	   neighbouring panel. */
	.bar-label.inside {
		fill: var(--surface);
		font-weight: 600;
	}

	.metric-name {
		font-family: var(--font-ui);
		font-size: 0.72rem;
		fill: var(--ink-secondary);
	}

	.metric-value {
		font-family: var(--font-ui);
		font-size: 0.78rem;
		font-variant-numeric: tabular-nums;
		fill: var(--ink);
	}

	.metric-value.strong {
		font-weight: 600;
	}

	.axis-title {
		font-family: var(--font-ui);
		font-size: 0.7rem;
		fill: var(--ink-muted);
	}
</style>
