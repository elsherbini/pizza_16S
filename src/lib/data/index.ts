/**
 * The dataset, and the one place that decides column order.
 *
 * Every count vector in the app is aligned to `pizzaIds`. A shop that never
 * sold a Clam Pie still carries a slot for it holding zero, because a metric
 * comparing two shops has to know that the slot exists.
 */

import fieldJson from './field.json';
import heroesJson from './heroes.json';
import pizzasJson from './pizzas.json';

export type PizzaBase = 'red' | 'white';
export type PizzaCategory = 'classic' | 'meat' | 'vegetable' | 'seafood';
export type ShopStyle = 'ny_slice' | 'neapolitan' | 'detroit' | 'experimental' | 'fusion';

export interface Pizza {
	id: string;
	name: string;
	base: PizzaBase;
	category: PizzaCategory;
}

export interface Shop {
	id: string;
	name: string;
	style: ShopStyle;
	neighbourhood: string;
	/** Present on the hero cast: why this shop is in the piece at all. */
	role?: string;
	counts: Record<string, number>;
}

export const pizzas = pizzasJson.pizzas as Pizza[];

/** The column order for every count vector and distance matrix in the app. */
export const pizzaIds: string[] = pizzas.map((p) => p.id);

const pizzaIndex = new Map(pizzaIds.map((id, i) => [id, i]));

export const pizzaById = new Map(pizzas.map((p) => [p.id, p]));

// The JSON imports narrow to the exact literal keys present in each shop, which
// is not what the app wants; every shop is a sparse Record over the taxonomy.
export const heroShops = heroesJson.shops as unknown as Shop[];
export const fieldShops = fieldJson.shops as unknown as Shop[];

/** Hero cast first, so it keeps a stable position in the ordination legend. */
export const allShops: Shop[] = [...heroShops, ...fieldShops];

export const shopById = new Map(allShops.map((s) => [s.id, s]));

export function hero(id: string): Shop {
	const shop = heroShops.find((s) => s.id === id);
	if (!shop) throw new Error(`no hero shop named ${id}`);
	return shop;
}

/** One shop's sparse counts expanded into a vector aligned to `pizzaIds`. */
export function countVector(shop: Shop): number[] {
	const vector = new Array<number>(pizzaIds.length).fill(0);
	for (const [id, count] of Object.entries(shop.counts)) {
		const index = pizzaIndex.get(id);
		if (index === undefined) throw new Error(`${shop.id} sold an unknown pizza: ${id}`);
		vector[index] = count;
	}
	return vector;
}

export function countMatrix(shops: Shop[]): number[][] {
	return shops.map(countVector);
}

export function ticketsSold(shop: Shop): number {
	return Object.values(shop.counts).reduce((sum, c) => sum + c, 0);
}

export interface SoldPizza {
	pizza: Pizza;
	count: number;
}

/** What a shop actually sold, busiest first. Useful for bar charts and tickets. */
export function soldPizzas(shop: Shop): SoldPizza[] {
	return Object.entries(shop.counts)
		.map(([id, count]) => ({ pizza: pizzaById.get(id)!, count }))
		.sort((a, b) => b.count - a.count || a.pizza.name.localeCompare(b.pizza.name));
}

export const STYLE_LABELS: Record<ShopStyle, string> = {
	ny_slice: 'New York slice',
	neapolitan: 'Neapolitan',
	detroit: 'Detroit square',
	experimental: 'Experimental',
	fusion: 'Fusion'
};
