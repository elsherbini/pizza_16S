import { describe, expect, test } from 'vitest';
import { brayCurtis, distanceMatrix, jaccard, relativeAbundance } from './beta';

describe('relativeAbundance', () => {
	test('converts counts to proportions summing to 1', () => {
		expect(relativeAbundance([2, 3, 5])).toEqual([0.2, 0.3, 0.5]);
	});

	test('returns all zeros for an empty sample rather than NaN', () => {
		expect(relativeAbundance([0, 0])).toEqual([0, 0]);
	});
});

describe('jaccard', () => {
	test('is 0 for shops with the same menu', () => {
		expect(jaccard([5, 3, 1], [5, 3, 1])).toBe(0);
	});

	test('is 1 for shops with no pizza type in common', () => {
		expect(jaccard([5, 3, 0, 0], [0, 0, 2, 7])).toBe(1);
	});

	test('is blind to how much of each type sold', () => {
		// Same three types present, wildly different sales mixes.
		expect(jaccard([100, 1, 1], [1, 1, 100])).toBe(0);
	});

	test('matches the hand-computed value for partial overlap', () => {
		// Present in a: {0,1,2}. Present in b: {1,2,3}. Shared 2, union 4.
		expect(jaccard([1, 1, 1, 0], [0, 1, 1, 1])).toBeCloseTo(0.5, 12);
	});

	test('is symmetric', () => {
		const a = [3, 0, 7, 1];
		const b = [0, 4, 7, 0];
		expect(jaccard(a, b)).toBeCloseTo(jaccard(b, a), 12);
	});

	test('is 0 when both shops sold nothing', () => {
		// An empty union is degenerate; treat two empty samples as identical.
		expect(jaccard([0, 0], [0, 0])).toBe(0);
	});
});

describe('brayCurtis', () => {
	test('is 0 for identical count vectors', () => {
		expect(brayCurtis([5, 3, 1], [5, 3, 1])).toBe(0);
	});

	test('is 1 for shops with no pizza type in common', () => {
		expect(brayCurtis([5, 3, 0, 0], [0, 0, 2, 7])).toBe(1);
	});

	test('matches the hand-computed value', () => {
		// sum|a-b| = 10 + 10 = 20; sum(a+b) = 30 + 10 = 40
		expect(brayCurtis([10, 10], [20, 0])).toBeCloseTo(0.5, 12);
	});

	test('separates shops that Jaccard calls identical', () => {
		// This pair is the whole presence-vs-abundance lesson.
		const a = [100, 1, 1];
		const b = [1, 1, 100];
		expect(jaccard(a, b)).toBe(0);
		expect(brayCurtis(a, b)).toBeGreaterThan(0.9);
	});

	test('is sensitive to raw sampling depth, which is why depth must be handled', () => {
		// Same composition, one shop simply ten times busier.
		expect(brayCurtis([1, 1], [10, 10])).toBeCloseTo(18 / 22, 12);
	});

	test('is 0 for the same composition once relativized', () => {
		const a = relativeAbundance([1, 1]);
		const b = relativeAbundance([10, 10]);
		expect(brayCurtis(a, b)).toBeCloseTo(0, 12);
	});

	test('is symmetric', () => {
		const a = [3, 0, 7, 1];
		const b = [0, 4, 7, 0];
		expect(brayCurtis(a, b)).toBeCloseTo(brayCurtis(b, a), 12);
	});

	test('is 0 when both shops sold nothing', () => {
		expect(brayCurtis([0, 0], [0, 0])).toBe(0);
	});
});

describe('distanceMatrix', () => {
	const samples = [
		[10, 0, 0],
		[0, 10, 0],
		[5, 5, 0]
	];

	test('is square with one row per sample', () => {
		const d = distanceMatrix(samples, brayCurtis);
		expect(d).toHaveLength(3);
		for (const row of d) expect(row).toHaveLength(3);
	});

	test('has a zero diagonal', () => {
		const d = distanceMatrix(samples, brayCurtis);
		for (let i = 0; i < 3; i++) expect(d[i][i]).toBe(0);
	});

	test('is symmetric', () => {
		const d = distanceMatrix(samples, brayCurtis);
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				expect(d[i][j]).toBeCloseTo(d[j][i], 12);
			}
		}
	});

	test('holds the same values the pairwise metric returns', () => {
		const d = distanceMatrix(samples, brayCurtis);
		expect(d[0][1]).toBeCloseTo(1, 12);
		expect(d[0][2]).toBeCloseTo(brayCurtis(samples[0], samples[2]), 12);
	});

	test('works with Jaccard as well', () => {
		const d = distanceMatrix(samples, jaccard);
		expect(d[0][1]).toBe(1);
		expect(d[0][2]).toBeCloseTo(0.5, 12);
	});
});
