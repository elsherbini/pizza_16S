import { describe, expect, test } from 'vitest';
import {
	goodsCoverage,
	hill,
	invSimpson,
	observedRichness,
	pielou,
	rarefactionCurve,
	rarefiedRichness,
	shannon,
	simpson,
	totalCount
} from './alpha';

// Tier 1: closed-form cases. A perfectly even community of S types has known
// values for every metric, which pins down log base, normalization, and sign.
const EVEN_4 = [10, 10, 10, 10];
const SINGLE = [42];
const UNEVEN_2 = [90, 10];

describe('totalCount', () => {
	test('sums the ticket spike', () => {
		expect(totalCount(EVEN_4)).toBe(40);
	});

	test('is zero for an empty community', () => {
		expect(totalCount([])).toBe(0);
	});
});

describe('observedRichness', () => {
	test('counts types actually seen', () => {
		expect(observedRichness(EVEN_4)).toBe(4);
	});

	test('ignores types on the menu that nobody ordered', () => {
		expect(observedRichness([10, 0, 10, 0, 5])).toBe(3);
	});

	test('is zero when nothing was ordered', () => {
		expect(observedRichness([0, 0, 0])).toBe(0);
	});
});

describe('shannon', () => {
	test('equals ln(S) for a perfectly even community', () => {
		expect(shannon(EVEN_4)).toBeCloseTo(Math.log(4), 12);
	});

	test('is zero for a single-type community', () => {
		expect(shannon(SINGLE)).toBeCloseTo(0, 12);
	});

	test('matches the hand-computed value for an uneven community', () => {
		// -(0.9 ln 0.9 + 0.1 ln 0.1)
		expect(shannon(UNEVEN_2)).toBeCloseTo(0.325082973391448, 12);
	});

	test('is unaffected by scaling all counts', () => {
		expect(shannon([90, 10])).toBeCloseTo(shannon([900, 100]), 12);
	});

	test('ignores unordered types rather than producing NaN', () => {
		expect(shannon([10, 0, 10, 0])).toBeCloseTo(Math.log(2), 12);
	});
});

describe('simpson', () => {
	test('is the probability two random tickets share a pizza type', () => {
		// Sum of squared proportions: 4 x 0.25^2
		expect(simpson(EVEN_4)).toBeCloseTo(0.25, 12);
	});

	test('is 1 when every ticket is the same pizza', () => {
		expect(simpson(SINGLE)).toBeCloseTo(1, 12);
	});

	test('matches the hand-computed value for an uneven community', () => {
		expect(simpson(UNEVEN_2)).toBeCloseTo(0.82, 12);
	});
});

describe('invSimpson', () => {
	test('equals the number of types for a perfectly even community', () => {
		expect(invSimpson(EVEN_4)).toBeCloseTo(4, 12);
	});

	test('matches the hand-computed value for an uneven community', () => {
		expect(invSimpson(UNEVEN_2)).toBeCloseTo(1 / 0.82, 12);
	});
});

describe('pielou', () => {
	test('is 1 for a perfectly even community', () => {
		expect(pielou(EVEN_4)).toBeCloseTo(1, 12);
	});

	test('is undefined for a single-type community', () => {
		// H = 0 and ln(S) = 0, so evenness is genuinely 0/0. vegan returns NaN.
		expect(pielou(SINGLE)).toBeNaN();
	});

	test('falls between 0 and 1 for an uneven community', () => {
		const e = pielou(UNEVEN_2);
		expect(e).toBeGreaterThan(0);
		expect(e).toBeLessThan(1);
		expect(e).toBeCloseTo(0.325082973391448 / Math.log(2), 12);
	});
});

describe('hill', () => {
	test('q=0 is observed richness', () => {
		expect(hill(UNEVEN_2, 0)).toBeCloseTo(2, 12);
	});

	test('q=1 is exp(Shannon)', () => {
		expect(hill(UNEVEN_2, 1)).toBeCloseTo(Math.exp(0.325082973391448), 12);
	});

	test('q=2 is inverse Simpson', () => {
		expect(hill(UNEVEN_2, 2)).toBeCloseTo(1 / 0.82, 12);
	});

	test('all orders agree for a perfectly even community', () => {
		for (const q of [0, 0.5, 1, 1.5, 2, 3]) {
			expect(hill(EVEN_4, q)).toBeCloseTo(4, 10);
		}
	});

	test('decreases monotonically as q increases', () => {
		const values = [0, 0.5, 1, 1.5, 2, 3].map((q) => hill(UNEVEN_2, q));
		for (let i = 1; i < values.length; i++) {
			expect(values[i]).toBeLessThanOrEqual(values[i - 1] + 1e-12);
		}
	});

	test('is continuous across the q=1 singularity', () => {
		expect(hill(UNEVEN_2, 0.999999)).toBeCloseTo(hill(UNEVEN_2, 1), 5);
		expect(hill(UNEVEN_2, 1.000001)).toBeCloseTo(hill(UNEVEN_2, 1), 5);
	});
});

describe('goodsCoverage', () => {
	test('is 1 when nothing was ordered exactly once', () => {
		expect(goodsCoverage(EVEN_4)).toBeCloseTo(1, 12);
	});

	test('drops as singletons accumulate', () => {
		// 3 singletons out of 10 tickets
		expect(goodsCoverage([7, 1, 1, 1])).toBeCloseTo(0.7, 12);
	});
});

describe('rarefiedRichness', () => {
	test('at full depth it returns observed richness', () => {
		expect(rarefiedRichness([5, 3, 2], 10)).toBeCloseTo(3, 10);
	});

	test('at depth 1 exactly one type has been seen', () => {
		expect(rarefiedRichness([5, 3, 2], 1)).toBeCloseTo(1, 12);
	});

	test('matches the hand-computed Hurlbert expectation', () => {
		expect(rarefiedRichness([2, 1], 2)).toBeCloseTo(1 + 2 / 3, 12);
	});

	test('is defined at every depth, not only at sampled ones', () => {
		// The chart reads this at an arbitrary slider position, so it cannot be
		// restricted to whatever depths a curve happened to be sampled at.
		const counts = [190, 20, 8, 6, 4, 3, 3, 2, 1, 1, 1, 1];
		// Cross-checked against scipy in the reference fixture; the prose quotes 5.3.
		expect(rarefiedRichness(counts, 34)).toBeCloseTo(5.302236, 5);
		expect(rarefiedRichness(counts, 33)).toBeLessThan(rarefiedRichness(counts, 34));
	});

	test('returns 0 for a depth of 0 or an empty sample', () => {
		expect(rarefiedRichness([5, 3], 0)).toBe(0);
		expect(rarefiedRichness([], 5)).toBe(0);
	});

	test('agrees with the curve at every depth the curve reports', () => {
		const counts = [40, 20, 10, 5, 3, 1, 1, 1];
		for (const point of rarefactionCurve(counts)) {
			expect(point.expectedRichness).toBeCloseTo(rarefiedRichness(counts, point.depth), 12);
		}
	});
});

describe('rarefactionCurve', () => {
	test('at full depth it returns observed richness', () => {
		const curve = rarefactionCurve([5, 3, 2]);
		const last = curve[curve.length - 1];
		expect(last.depth).toBe(10);
		expect(last.expectedRichness).toBeCloseTo(3, 10);
	});

	test('at depth 1 exactly one type has been seen', () => {
		const curve = rarefactionCurve([5, 3, 2]);
		expect(curve[0].depth).toBe(1);
		expect(curve[0].expectedRichness).toBeCloseTo(1, 12);
	});

	test('matches the hand-computed Hurlbert expectation', () => {
		// counts [2,1], N=3, n=2:
		//   (1 - C(1,2)/C(3,2)) + (1 - C(2,2)/C(3,2)) = 1 + 2/3
		const curve = rarefactionCurve([2, 1]);
		const atTwo = curve.find((p) => p.depth === 2)!;
		expect(atTwo.expectedRichness).toBeCloseTo(1 + 2 / 3, 12);
	});

	test('increases monotonically with sampling depth', () => {
		const curve = rarefactionCurve([40, 20, 10, 5, 3, 1, 1, 1]);
		for (let i = 1; i < curve.length; i++) {
			expect(curve[i].expectedRichness).toBeGreaterThanOrEqual(
				curve[i - 1].expectedRichness - 1e-12
			);
		}
	});

	test('stays numerically stable at large depths', () => {
		const curve = rarefactionCurve([5000, 3000, 1500, 400, 100]);
		for (const point of curve) {
			expect(Number.isFinite(point.expectedRichness)).toBe(true);
		}
		expect(curve[curve.length - 1].expectedRichness).toBeCloseTo(5, 8);
	});

	test('honors a requested step size', () => {
		const curve = rarefactionCurve([50, 30, 20], { step: 10 });
		expect(curve.map((p) => p.depth)).toEqual([1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
	});
});
