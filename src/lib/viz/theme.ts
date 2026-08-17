import type { PizzaCategory, ShopStyle } from '$lib/data/index';

/**
 * Thirty-two pizza types is far past what any categorical palette can carry, so
 * colour encodes the coarser rank and position carries the type itself. This is
 * the same compromise every microbial bar chart makes: coloured at phylum,
 * labelled at genus.
 */
export const CATEGORY_COLOR: Record<PizzaCategory, string> = {
	classic: 'var(--series-1)',
	meat: 'var(--series-2)',
	vegetable: 'var(--series-3)',
	seafood: 'var(--series-4)'
};

export const CATEGORY_LABEL: Record<PizzaCategory, string> = {
	classic: 'Cheese & classic',
	meat: 'Meat',
	vegetable: 'Vegetable',
	seafood: 'Seafood'
};

export const CATEGORY_ORDER: PizzaCategory[] = ['classic', 'meat', 'vegetable', 'seafood'];

/**
 * Colour is assigned to the entity, never to its rank, so a filtered chart
 * never repaints the survivors. The three pure styles take categorical slots
 * 1-3, which are the slots that clear the all-pairs floors used by scatter
 * plots. Fusion and the hero cast fall back to muted ink plus a different
 * marker shape, which keeps the scatter inside its three-hue budget.
 */
export const STYLE_COLOR: Record<ShopStyle, string> = {
	ny_slice: 'var(--style-ny)',
	neapolitan: 'var(--style-neapolitan)',
	detroit: 'var(--style-detroit)',
	fusion: 'var(--style-fusion)',
	experimental: 'var(--style-experimental)'
};

/**
 * The hero cast keeps one colour each across Acts 1 to 4, where the piece is
 * about these five shops. From Act 5 on the charts are about the field, colour
 * switches to style, and the heroes are identified by an outlined marker and a
 * direct label instead. Both sets were run through the palette validator; in
 * light mode three of these five sit under 3:1, so every line is directly
 * labelled at its end rather than relying on the legend.
 */
export const HERO_COLOR: Record<string, string> = {
	vinnies: 'var(--series-1)',
	sono: 'var(--series-2)',
	ginos: 'var(--series-3)',
	forno: 'var(--series-4)',
	vinnies_uptown: 'var(--series-5)'
};

export type MarkerShape = 'circle' | 'diamond';

export const STYLE_SHAPE: Record<ShopStyle, MarkerShape> = {
	ny_slice: 'circle',
	neapolitan: 'circle',
	detroit: 'circle',
	fusion: 'diamond',
	experimental: 'diamond'
};

/** Red sauce and white pies, for the base-composition strips. */
export const BASE_COLOR = {
	red: 'var(--series-2)',
	white: 'var(--series-4)'
} as const;

export function formatNumber(value: number, digits = 2): string {
	if (!Number.isFinite(value)) return '—';
	return value.toFixed(digits);
}

export function formatPercent(value: number, digits = 1): string {
	if (!Number.isFinite(value)) return '—';
	return `${(value * 100).toFixed(digits)}%`;
}

/** An SVG path for a marker of the given shape, centred on the origin. */
export function markerPath(shape: MarkerShape, radius: number): string {
	if (shape === 'diamond') {
		const r = radius * 1.15;
		return `M0,${-r} L${r},0 L0,${r} L${-r},0 Z`;
	}
	return `M${-radius},0 a${radius},${radius} 0 1,0 ${radius * 2},0 a${radius},${radius} 0 1,0 ${-radius * 2},0`;
}
