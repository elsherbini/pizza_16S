<script lang="ts">
	/**
	 * Act 4. Two shops back to back, one row per pizza type in the union of
	 * their menus, both on relative abundance so depth cannot confound it.
	 *
	 * The saturated block next to the centre gutter is min(a, b), the share the
	 * two shops genuinely have in common. Summed across types it is exactly
	 * 1 - Bray-Curtis, which is the most useful thing to know about the metric.
	 *
	 * Stages
	 *  0  the two profiles
	 *  1  Jaccard: which types appear at all
	 *  2  Bray-Curtis: how much of the night the two shops share
	 */
	import { brayCurtis, jaccard, relativeAbundance } from '$lib/diversity/beta';
	import { countVector, pizzaById, pizzaIds, type Shop } from '$lib/data/index';
	import { HERO_COLOR, formatNumber } from '$lib/viz/theme';

	interface Props {
		a: Shop;
		b: Shop;
		stage: number;
	}

	let { a, b, stage }: Props = $props();

	const WIDTH = 680;
	const HEIGHT = 440;
	const GUTTER = 156;
	const CENTER = WIDTH / 2;
	const BAR_MAX = CENTER - GUTTER / 2 - 26;
	const ROW_TOP = 74;

	const shares = $derived({
		a: relativeAbundance(countVector(a)),
		b: relativeAbundance(countVector(b))
	});

	const colorA = $derived(HERO_COLOR[a.id] ?? 'var(--series-1)');
	const colorB = $derived(HERO_COLOR[b.id] ?? 'var(--series-2)');

	const rows = $derived.by(() =>
		pizzaIds
			.map((id, i) => ({
				id,
				name: pizzaById.get(id)!.name,
				a: shares.a[i],
				b: shares.b[i]
			}))
			.filter((row) => row.a > 0 || row.b > 0)
			.sort((p, q) => Math.max(q.a, q.b) - Math.max(p.a, p.b))
	);

	const rowHeight = $derived(Math.min(15, 268 / Math.max(rows.length, 1)));
	const barHeight = $derived(Math.max(rowHeight - 4, 4));
	const maxShare = $derived(Math.max(...rows.map((r) => Math.max(r.a, r.b)), 0.01));

	const jaccardValue = $derived(jaccard(countVector(a), countVector(b)));
	const brayValue = $derived(brayCurtis(shares.a, shares.b));
	const overlap = $derived(rows.reduce((sum, row) => sum + Math.min(row.a, row.b), 0));

	const sharedTypes = $derived(rows.filter((r) => r.a > 0 && r.b > 0).length);
	const onlyA = $derived(rows.filter((r) => r.a > 0 && r.b === 0).length);
	const onlyB = $derived(rows.filter((r) => r.b > 0 && r.a === 0).length);

	const scale = (share: number) => (share / maxShare) * BAR_MAX;
	const truncate = (name: string) => (name.length > 21 ? `${name.slice(0, 20)}…` : name);

	const readoutY = $derived(ROW_TOP + rows.length * rowHeight + 34);
</script>

<figure>
	<svg viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-label={ariaLabel(a, b, jaccardValue, brayValue)}>
		<g>
			<text class="shop-name" x={CENTER - GUTTER / 2 - 20} y="30" text-anchor="end">{a.name}</text>
			<rect x={CENTER - GUTTER / 2 - 12} y="22" width="8" height="8" rx="1.5" fill={colorA} />

			<text class="shop-name" x={CENTER + GUTTER / 2} y="30">{b.name}</text>
			<rect x={CENTER + GUTTER / 2 - 12} y="22" width="8" height="8" rx="1.5" fill={colorB} />
		</g>

		<line class="axis" x1={CENTER - GUTTER / 2} x2={CENTER - GUTTER / 2} y1={ROW_TOP - 12} y2={ROW_TOP + rows.length * rowHeight} />
		<line class="axis" x1={CENTER + GUTTER / 2} x2={CENTER + GUTTER / 2} y1={ROW_TOP - 12} y2={ROW_TOP + rows.length * rowHeight} />

		{#each rows as row, i (row.id)}
			{@const y = ROW_TOP + i * rowHeight}
			{@const shared = Math.min(row.a, row.b)}
			{@const isShared = row.a > 0 && row.b > 0}

			{#if row.a > 0}
				<rect
					x={CENTER - GUTTER / 2 - scale(row.a)}
					y={y + 2}
					width={Math.max(scale(row.a), 1)}
					height={barHeight}
					rx="1.5"
					fill={colorA}
					opacity={stage >= 2 ? 0.34 : 1}
				/>
			{/if}
			{#if stage >= 2 && shared > 0}
				<rect
					x={CENTER - GUTTER / 2 - scale(shared)}
					y={y + 2}
					width={Math.max(scale(shared), 1)}
					height={barHeight}
					rx="1.5"
					fill={colorA}
				/>
			{/if}

			{#if row.b > 0}
				<rect
					x={CENTER + GUTTER / 2}
					y={y + 2}
					width={Math.max(scale(row.b), 1)}
					height={barHeight}
					rx="1.5"
					fill={colorB}
					opacity={stage >= 2 ? 0.34 : 1}
				/>
			{/if}
			{#if stage >= 2 && shared > 0}
				<rect
					x={CENTER + GUTTER / 2}
					y={y + 2}
					width={Math.max(scale(shared), 1)}
					height={barHeight}
					rx="1.5"
					fill={colorB}
				/>
			{/if}

			<text
				class="type-name"
				class:absent={stage === 1 && !isShared}
				x={CENTER}
				y={y + barHeight - 0.5}
				text-anchor="middle"
			>
				{truncate(row.name)}
			</text>

			{#if stage === 1}
				<circle
					class="presence"
					cx={CENTER - GUTTER / 2 - 8}
					cy={y + barHeight / 2 + 1}
					r="3"
					fill={row.a > 0 ? colorA : 'none'}
					stroke={row.a > 0 ? 'none' : 'var(--axis)'}
				/>
				<circle
					class="presence"
					cx={CENTER + GUTTER / 2 + 8}
					cy={y + barHeight / 2 + 1}
					r="3"
					fill={row.b > 0 ? colorB : 'none'}
					stroke={row.b > 0 ? 'none' : 'var(--axis)'}
				/>
			{/if}
		{/each}

		<g transform="translate(0, {readoutY})">
			<line class="rule" x1={CENTER - BAR_MAX - GUTTER / 2} x2={CENTER + BAR_MAX + GUTTER / 2} y1="0" y2="0" />

			{#if stage >= 1}
				<text class="metric-name" x={CENTER - BAR_MAX - GUTTER / 2} y="24">
					Jaccard (presence only)
				</text>
				<text class="metric-value" x={CENTER - 8} y="24" text-anchor="end">
					{formatNumber(jaccardValue)}
				</text>
				<text class="metric-note" x={CENTER + 8} y="24">
					{sharedTypes} shared, {onlyA} only at {a.name}, {onlyB} only at {b.name}
				</text>
			{/if}

			{#if stage >= 2}
				<text class="metric-name" x={CENTER - BAR_MAX - GUTTER / 2} y="48">
					Bray-Curtis (abundance)
				</text>
				<text class="metric-value strong" x={CENTER - 8} y="48" text-anchor="end">
					{formatNumber(brayValue)}
				</text>
				<text class="metric-note" x={CENTER + 8} y="48">
					the solid blocks sum to {Math.round(overlap * 100)}% of a night, and 1 - {formatNumber(
						overlap
					)} is the distance
				</text>
			{/if}
		</g>
	</svg>
</figure>

<script lang="ts" module>
	function ariaLabel(a: { name: string }, b: { name: string }, j: number, bc: number): string {
		return `${a.name} compared with ${b.name}: Jaccard distance ${j.toFixed(2)}, Bray-Curtis distance ${bc.toFixed(2)}`;
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

	rect,
	.type-name {
		transition:
			opacity 400ms ease,
			fill 400ms ease;
	}

	.axis,
	.rule {
		stroke: var(--axis);
		stroke-width: 1;
	}

	.shop-name {
		font-family: var(--font-ui);
		font-size: 0.78rem;
		font-weight: 600;
		fill: var(--ink);
	}

	.type-name {
		font-family: var(--font-ui);
		font-size: 0.6rem;
		fill: var(--ink-secondary);
	}

	.type-name.absent {
		fill: var(--ink-muted);
		opacity: 0.55;
	}

	.metric-name {
		font-family: var(--font-ui);
		font-size: 0.74rem;
		fill: var(--ink-secondary);
	}

	.metric-value {
		font-family: var(--font-ui);
		font-size: 0.95rem;
		font-variant-numeric: tabular-nums;
		fill: var(--ink);
	}

	.metric-value.strong {
		font-weight: 600;
	}

	.metric-note {
		font-family: var(--font-ui);
		font-size: 0.66rem;
		fill: var(--ink-muted);
	}
</style>
