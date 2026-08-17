/**
 * The dataset is teaching material, so its contrasts are locked here. If one of
 * these fails, an act of the piece stopped making its point.
 */

import { describe, expect, test } from 'vitest';
import { goodsCoverage, observedRichness, pielou, shannon, totalCount } from '../diversity/alpha';
import { brayCurtis, distanceMatrix, jaccard, relativeAbundance } from '../diversity/beta';
import { pcoa } from '../diversity/ordination';
import {
	allShops,
	countMatrix,
	countVector,
	fieldShops,
	hero,
	heroShops,
	pizzaIds,
	ticketsSold
} from './index';

const vinnies = countVector(hero('vinnies'));
const sono = countVector(hero('sono'));
const ginos = countVector(hero('ginos'));
const forno = countVector(hero('forno'));
const uptown = countVector(hero('vinnies_uptown'));

describe('taxonomy', () => {
	test('every pizza id is unique', () => {
		expect(new Set(pizzaIds).size).toBe(pizzaIds.length);
	});

	test('every shop sells only pizzas that exist in the taxonomy', () => {
		for (const shop of allShops) expect(() => countVector(shop)).not.toThrow();
	});

	test('every shop id is unique', () => {
		const ids = allShops.map((s) => s.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe('act 1 and 2: richness cannot see what evenness can', () => {
	test("Vinnie's and Sono's have exactly the same observed richness", () => {
		expect(observedRichness(vinnies)).toBe(12);
		expect(observedRichness(sono)).toBe(12);
	});

	test("Sono's is far more even despite that tie", () => {
		expect(shannon(sono)).toBeGreaterThan(2.4);
		expect(shannon(vinnies)).toBeLessThan(1.0);
	});

	test("Gino's stocks less than Sono's but sells more evenly than Vinnie's", () => {
		expect(observedRichness(ginos)).toBeLessThan(observedRichness(sono));
		expect(pielou(ginos)).toBeGreaterThan(pielou(vinnies));
		expect(pielou(ginos)).toBeGreaterThan(0.99);
	});
});

describe('act 3: Forno Sperimentale is under-sampled', () => {
	test('it had a quiet night', () => {
		expect(totalCount(forno)).toBe(34);
	});

	test('nine of its fourteen types sold exactly once', () => {
		expect(observedRichness(forno)).toBe(14);
		expect(forno.filter((c) => c === 1)).toHaveLength(9);
	});

	test("Good's coverage lands near three quarters", () => {
		expect(goodsCoverage(forno)).toBeCloseTo(1 - 9 / 34, 12);
	});

	test('it is sampled far more shallowly than the busy shops', () => {
		expect(totalCount(vinnies) / totalCount(forno)).toBeGreaterThan(5);
	});
});

describe('act 4: presence and abundance disagree', () => {
	test("both Vinnie's locations stock exactly the same twelve types", () => {
		expect(jaccard(vinnies, uptown)).toBe(0);
	});

	test('yet they sell almost nothing alike', () => {
		const distance = brayCurtis(relativeAbundance(vinnies), relativeAbundance(uptown));
		expect(distance).toBeGreaterThan(0.7);
	});

	test("Sono's shares no menu at all with either Vinnie's", () => {
		expect(jaccard(vinnies, sono)).toBe(1);
		expect(brayCurtis(vinnies, sono)).toBe(1);
	});
});

describe('the wider field', () => {
	const styles = ['ny_slice', 'neapolitan', 'detroit'] as const;
	const relative = countMatrix(fieldShops).map(relativeAbundance);
	const distances = distanceMatrix(relative, brayCurtis);

	test('holds thirty shops', () => {
		expect(fieldShops).toHaveLength(30);
	});

	test('has genuinely uneven sampling depth', () => {
		const depths = fieldShops.map(ticketsSold);
		expect(Math.max(...depths) / Math.min(...depths)).toBeGreaterThan(2);
	});

	test('has a long tail of rare types, not just the archetype pizzas', () => {
		const singletons = countMatrix(fieldShops).map((v) => v.filter((c) => c === 1).length);
		expect(singletons.reduce((a, b) => a + b, 0)).toBeGreaterThan(20);
	});

	function meanDistance(from: number[], to: number[]): number {
		const values: number[] = [];
		for (const i of from) {
			for (const j of to) {
				if (i !== j) values.push(distances[i][j]);
			}
		}
		return values.reduce((a, b) => a + b, 0) / values.length;
	}

	const indicesByStyle = Object.fromEntries(
		styles.map((style) => [
			style,
			fieldShops.map((s, i) => (s.style === style ? i : -1)).filter((i) => i >= 0)
		])
	) as Record<(typeof styles)[number], number[]>;

	test.each(styles)('%s shops sit closer to each other than to other styles', (style) => {
		const own = indicesByStyle[style];
		const others = styles.filter((s) => s !== style).flatMap((s) => indicesByStyle[s]);
		expect(meanDistance(own, own)).toBeLessThan(meanDistance(own, others));
	});

	test('two PCoA axes carry most of the structure', () => {
		const { varianceExplained } = pcoa(distances);
		expect(varianceExplained[0] + varianceExplained[1]).toBeGreaterThan(0.4);
	});

	test('fusion shops fall between the clusters rather than inside one', () => {
		const fusion = fieldShops.map((s, i) => (s.style === 'fusion' ? i : -1)).filter((i) => i >= 0);
		expect(fusion.length).toBeGreaterThan(0);

		const gapFor = (index: number) => {
			const toEach = styles
				.map((style) => meanDistance([index], indicesByStyle[style]))
				.sort((a, b) => a - b);
			return toEach[1] - toEach[0];
		};

		const fusionGap = fusion.reduce((s, i) => s + gapFor(i), 0) / fusion.length;
		const pure = styles.flatMap((s) => indicesByStyle[s]);
		const pureGap = pure.reduce((s, i) => s + gapFor(i), 0) / pure.length;
		expect(fusionGap).toBeLessThan(pureGap);
	});
});

describe('hero cast', () => {
	test('has five shops, each with a stated role', () => {
		expect(heroShops).toHaveLength(5);
		for (const shop of heroShops) expect(shop.role).toBeTruthy();
	});
});
