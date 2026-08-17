import { describe, expect, test } from 'vitest';
import { brayCurtis, distanceMatrix } from './beta';
import { configurationDistances, kruskalStress, nmds, pcoa, shepard } from './ordination';

/** Six points in a plane, so the true answer is known before we start. */
const PLANE_POINTS = [
	[0, 0],
	[3, 0],
	[0, 4],
	[3, 4],
	[1.5, 2],
	[6, 0]
];

function euclideanMatrix(points: number[][]): number[][] {
	return points.map((p) =>
		points.map((q) => Math.hypot(...p.map((value, axis) => value - q[axis])))
	);
}

const PLANE_DISTANCES = euclideanMatrix(PLANE_POINTS);

/**
 * Ten samples along a species-turnover gradient with two off-gradient
 * stragglers. Bray-Curtis on this table genuinely violates the triangle
 * inequality, which many tidier tables do not.
 */
const COUNT_TABLE = [
	[60, 25, 10, 3, 1, 0, 0, 0],
	[45, 40, 8, 0, 0, 2, 0, 0],
	[20, 10, 50, 15, 3, 0, 1, 0],
	[5, 2, 45, 30, 10, 4, 0, 1],
	[0, 1, 10, 20, 40, 20, 5, 2],
	[1, 0, 3, 8, 35, 35, 10, 5],
	[0, 0, 0, 2, 10, 25, 45, 15],
	[0, 0, 1, 0, 4, 12, 30, 50],
	[30, 5, 2, 0, 0, 5, 20, 30],
	[2, 30, 25, 5, 5, 2, 2, 20]
];

function spearman(a: number[], b: number[]): number {
	const rank = (xs: number[]) => {
		const order = xs.map((v, i) => [v, i] as const).sort((p, q) => p[0] - q[0]);
		const r = new Array<number>(xs.length);
		order.forEach(([, i], k) => (r[i] = k));
		return r;
	};
	const ra = rank(a);
	const rb = rank(b);
	const meanA = ra.reduce((s, v) => s + v, 0) / ra.length;
	const meanB = rb.reduce((s, v) => s + v, 0) / rb.length;
	let numerator = 0;
	let sumA = 0;
	let sumB = 0;
	for (let i = 0; i < ra.length; i++) {
		numerator += (ra[i] - meanA) * (rb[i] - meanB);
		sumA += (ra[i] - meanA) ** 2;
		sumB += (rb[i] - meanB) ** 2;
	}
	return numerator / Math.sqrt(sumA * sumB);
}

describe('pcoa', () => {
	test('recovers the original geometry from a Euclidean distance matrix', () => {
		const result = pcoa(PLANE_DISTANCES);
		const recovered = configurationDistances(result.coordinates, 2);
		for (let i = 0; i < PLANE_POINTS.length; i++) {
			for (let j = 0; j < PLANE_POINTS.length; j++) {
				expect(recovered[i][j]).toBeCloseTo(PLANE_DISTANCES[i][j], 8);
			}
		}
	});

	test('finds exactly as many real axes as the data has dimensions', () => {
		const { eigenvalues } = pcoa(PLANE_DISTANCES);
		expect(eigenvalues[0]).toBeGreaterThan(1);
		expect(eigenvalues[1]).toBeGreaterThan(1);
		expect(Math.abs(eigenvalues[2])).toBeLessThan(1e-8);
	});

	test('returns eigenvalues in descending order', () => {
		const { eigenvalues } = pcoa(distanceMatrix(COUNT_TABLE, brayCurtis));
		for (let i = 1; i < eigenvalues.length; i++) {
			expect(eigenvalues[i]).toBeLessThanOrEqual(eigenvalues[i - 1] + 1e-12);
		}
	});

	test('centres the configuration on the origin', () => {
		const { coordinates } = pcoa(PLANE_DISTANCES);
		for (let axis = 0; axis < 2; axis++) {
			const mean = coordinates.reduce((s, row) => s + row[axis], 0) / coordinates.length;
			expect(mean).toBeCloseTo(0, 10);
		}
	});

	test('reports variance explained as a descending share summing to 1', () => {
		const { varianceExplained } = pcoa(PLANE_DISTANCES);
		const total = varianceExplained.reduce((s, v) => s + v, 0);
		expect(total).toBeCloseTo(1, 10);
		expect(varianceExplained[0]).toBeGreaterThanOrEqual(varianceExplained[1]);
	});

	test('exposes the negative eigenvalues Bray-Curtis produces', () => {
		// Bray-Curtis breaks the triangle inequality, so the Gower-centred matrix
		// is not positive semi-definite. Hiding this would misstate the axis
		// percentages, so PCoA reports how much of the signal is imaginary.
		const result = pcoa(distanceMatrix(COUNT_TABLE, brayCurtis));
		expect(result.eigenvalues.some((v) => v < -1e-10)).toBe(true);
		expect(result.negativeFraction).toBeGreaterThan(0);
		expect(result.negativeFraction).toBeLessThan(0.2);
	});

	test('collapses to the origin when every sample is identical', () => {
		const zero = [
			[0, 0, 0],
			[0, 0, 0],
			[0, 0, 0]
		];
		const { coordinates } = pcoa(zero);
		for (const row of coordinates) {
			for (const value of row) expect(value).toBeCloseTo(0, 12);
		}
	});

	test('is deterministic', () => {
		const a = pcoa(distanceMatrix(COUNT_TABLE, brayCurtis));
		const b = pcoa(distanceMatrix(COUNT_TABLE, brayCurtis));
		expect(a.coordinates).toEqual(b.coordinates);
	});
});

describe('kruskalStress', () => {
	test('is 0 when the configuration reproduces the distances exactly', () => {
		expect(kruskalStress(PLANE_DISTANCES, PLANE_DISTANCES)).toBeCloseTo(0, 12);
	});

	test('stays 0 under any monotone transform, since only rank order is fitted', () => {
		const squared = PLANE_DISTANCES.map((row) => row.map((d) => d * d));
		expect(kruskalStress(PLANE_DISTANCES, squared)).toBeCloseTo(0, 12);
	});

	test('rises when a configuration breaks the rank order', () => {
		// Collapse the plane onto its x axis: points 0 and 2 sit 4 apart but land
		// on top of each other, which inverts pairs that Kruskal cannot repair.
		const collapsed = PLANE_POINTS.map((p) => [p[0]]);
		const fitted = configurationDistances(collapsed, 1);
		expect(kruskalStress(PLANE_DISTANCES, fitted)).toBeGreaterThan(0.05);
	});
});

describe('nmds', () => {
	test('reaches near-zero stress on a configuration that is genuinely 2D', () => {
		const result = nmds(PLANE_DISTANCES, { dimensions: 2 });
		expect(result.stress).toBeLessThan(0.01);
	});

	test('never lets stress increase between iterations', () => {
		const result = nmds(distanceMatrix(COUNT_TABLE, brayCurtis), { dimensions: 2 });
		for (let i = 1; i < result.stressHistory.length; i++) {
			expect(result.stressHistory[i]).toBeLessThanOrEqual(result.stressHistory[i - 1] + 1e-9);
		}
	});

	test('lands below the usable-fit threshold on structured data', () => {
		const result = nmds(distanceMatrix(COUNT_TABLE, brayCurtis), { dimensions: 2 });
		expect(result.stress).toBeLessThan(0.2);
	});

	test('preserves the rank order of the original distances', () => {
		// The whole claim of NMDS, stated as a rank correlation rather than a
		// count of inversions, which fires on numerically meaningless wiggles.
		const d = distanceMatrix(COUNT_TABLE, brayCurtis);
		const result = nmds(d, { dimensions: 2 });
		const fitted = configurationDistances(result.coordinates, 2);

		const observedPairs: number[] = [];
		const fittedPairs: number[] = [];
		for (let i = 0; i < d.length; i++) {
			for (let j = i + 1; j < d.length; j++) {
				observedPairs.push(d[i][j]);
				fittedPairs.push(fitted[i][j]);
			}
		}
		expect(spearman(observedPairs, fittedPairs)).toBeGreaterThan(0.9);
	});

	test('actually iterates on data that does not fit perfectly in two dimensions', () => {
		const result = nmds(distanceMatrix(COUNT_TABLE, brayCurtis), { dimensions: 2 });
		expect(result.stressHistory.length).toBeGreaterThan(5);
		expect(result.stress).toBeLessThan(result.stressHistory[0]);
	});

	test('is deterministic', () => {
		const d = distanceMatrix(COUNT_TABLE, brayCurtis);
		expect(nmds(d, { dimensions: 2 }).coordinates).toEqual(nmds(d, { dimensions: 2 }).coordinates);
	});

	test('stops early once stress stops improving', () => {
		const result = nmds(PLANE_DISTANCES, { dimensions: 2, maxIterations: 500 });
		expect(result.converged).toBe(true);
		expect(result.stressHistory.length).toBeLessThan(500);
	});
});

describe('shepard', () => {
	test('returns one point per sample pair', () => {
		const result = nmds(PLANE_DISTANCES, { dimensions: 2 });
		const points = shepard(PLANE_DISTANCES, result.coordinates, 2);
		expect(points).toHaveLength((6 * 5) / 2);
	});

	test('sorts by observed distance so the monotone fit reads left to right', () => {
		const result = nmds(PLANE_DISTANCES, { dimensions: 2 });
		const points = shepard(PLANE_DISTANCES, result.coordinates, 2);
		for (let i = 1; i < points.length; i++) {
			expect(points[i].observed).toBeGreaterThanOrEqual(points[i - 1].observed);
		}
	});

	test('carries the monotone disparities alongside the fitted distances', () => {
		const result = nmds(PLANE_DISTANCES, { dimensions: 2 });
		const points = shepard(PLANE_DISTANCES, result.coordinates, 2);
		for (let i = 1; i < points.length; i++) {
			expect(points[i].disparity).toBeGreaterThanOrEqual(points[i - 1].disparity - 1e-9);
		}
	});
});
