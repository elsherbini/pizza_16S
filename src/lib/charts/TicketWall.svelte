<script lang="ts">
	/**
	 * Act 0. One Friday night at a pizzeria, drawn as the individual order
	 * tickets it actually was, then sorted into the count vector every downstream
	 * metric consumes.
	 *
	 * Stages
	 *  0  tickets in the order they were rung up
	 *  1  the same tickets, coloured by what was on them
	 *  2  sorted into one column per pizza type
	 *  3  the columns labelled with their counts
	 */
	import { pizzaById, soldPizzas, ticketsSold, type Shop } from '$lib/data/index';
	import { CATEGORY_COLOR, CATEGORY_LABEL, CATEGORY_ORDER } from '$lib/viz/theme';

	interface Props {
		shop: Shop;
		stage: number;
	}

	let { shop, stage }: Props = $props();

	const WIDTH = 720;
	const HEIGHT = 470;
	const TICKET_W = 11;
	const TICKET_H = 15;
	const BASELINE = HEIGHT - 96;

	const sold = $derived(soldPizzas(shop));
	const total = $derived(ticketsSold(shop));

	/**
	 * Counts expanded back into the events they summarise, deterministically, so
	 * a ticket keeps its identity from one stage to the next. The stride
	 * interleave makes arrival order look like a night's service instead of a
	 * sorted list, without needing a random number anywhere.
	 */
	const tickets = $derived.by(() => {
		const flat: string[] = [];
		for (const { pizza, count } of sold) {
			for (let i = 0; i < count; i++) flat.push(pizza.id);
		}
		const interleaved: string[] = [];
		const stride = 7;
		for (let offset = 0; offset < stride; offset++) {
			for (let i = offset; i < flat.length; i += stride) interleaved.push(flat[i]);
		}
		return interleaved;
	});

	const columnWidth = $derived(Math.min(48, (WIDTH - 40) / Math.max(sold.length, 1)));
	const columnLeft = $derived((WIDTH - sold.length * columnWidth) / 2);

	interface Placed {
		key: number;
		pizzaId: string;
		x: number;
		y: number;
	}

	const arrivalLayout = $derived.by<Placed[]>(() => {
		const columns = Math.ceil(Math.sqrt(tickets.length * 1.9));
		const gapX = TICKET_W + 3;
		const gapY = TICKET_H + 4;
		const rows = Math.ceil(tickets.length / columns);
		const left = (WIDTH - columns * gapX) / 2;
		const top = (HEIGHT - rows * gapY) / 2;
		return tickets.map((pizzaId, i) => ({
			key: i,
			pizzaId,
			x: left + (i % columns) * gapX,
			y: top + Math.floor(i / columns) * gapY
		}));
	});

	const sortedLayout = $derived.by<Placed[]>(() => {
		const tallest = sold[0]?.count ?? 1;
		// Compress the pile rather than letting a tall column run off the top.
		const step = Math.min(TICKET_H + 2, (BASELINE - 30) / tallest);
		const depths = new Map<string, number>();
		const columnOf = new Map(sold.map((entry, i) => [entry.pizza.id, i]));

		return arrivalLayout.map((ticket) => {
			const column = columnOf.get(ticket.pizzaId) ?? 0;
			const depth = depths.get(ticket.pizzaId) ?? 0;
			depths.set(ticket.pizzaId, depth + 1);
			return {
				...ticket,
				x: columnLeft + column * columnWidth + (columnWidth - TICKET_W) / 2,
				y: BASELINE - (depth + 1) * step
			};
		});
	});

	const layout = $derived(stage >= 2 ? sortedLayout : arrivalLayout);

	const usedCategories = $derived(
		CATEGORY_ORDER.filter((category) => sold.some((s) => s.pizza.category === category))
	);

	function fill(pizzaId: string): string {
		if (stage === 0) return 'var(--axis)';
		return CATEGORY_COLOR[pizzaById.get(pizzaId)!.category];
	}
</script>

<figure>
	<figcaption class="caption">
		<strong>{shop.name}</strong> · {total} tickets · {sold.length} pizza types
	</figcaption>

	<svg
		viewBox="0 0 {WIDTH} {HEIGHT}"
		role="img"
		aria-label="{total} pizza orders from one Friday night at {shop.name}, sorted into a count for each of {sold.length} pizza types"
	>
		{#each layout as ticket (ticket.key)}
			<rect
				class="ticket"
				width={TICKET_W}
				height={TICKET_H}
				rx="2"
				fill={fill(ticket.pizzaId)}
				style:transform="translate({ticket.x}px, {ticket.y}px)"
			/>
		{/each}

		{#if stage >= 2}
			<line
				class="baseline"
				x1={columnLeft - 6}
				x2={columnLeft + sold.length * columnWidth + 6}
				y1={BASELINE}
				y2={BASELINE}
			/>
			{#each sold as entry, i (entry.pizza.id)}
				<g transform="translate({columnLeft + i * columnWidth + columnWidth / 2}, {BASELINE + 6})">
					{#if stage >= 3}
						<text class="count" y="14" text-anchor="middle">{entry.count}</text>
					{/if}
					<text class="pizza-name" y={stage >= 3 ? 28 : 12} transform="rotate(40)">
						{entry.pizza.name}
					</text>
				</g>
			{/each}
		{/if}
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

<style>
	figure {
		margin: 0;
		width: 100%;
		max-width: 46rem;
	}

	figcaption {
		margin-bottom: 0.4rem;
	}

	svg {
		width: 100%;
		height: auto;
		display: block;
		overflow: visible;
	}

	.ticket {
		transition:
			transform 900ms cubic-bezier(0.2, 0.7, 0.2, 1),
			fill 450ms ease;
	}

	.baseline {
		stroke: var(--axis);
		stroke-width: 1;
	}

	.count {
		font-family: var(--font-ui);
		font-size: 0.72rem;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		fill: var(--ink);
	}

	.pizza-name {
		font-family: var(--font-ui);
		font-size: 0.66rem;
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
