/**
 * Ordination — turning a distance matrix back into a map.
 *
 * A distance matrix for 30 pizzerias holds 435 numbers. Nobody can read that.
 * Ordination asks the reverse of the usual question: given only the distances
 * between places, where must the places have been?
 *
 * PCoA answers it by preserving the distances themselves. NMDS answers it by
 * preserving only their rank order. Both hand back coordinates whose units mean
 * nothing on their own.
 */

/** One symmetric eigendecomposition, eigenvalues descending. */
interface Eigen {
	values: number[];
	/** Column k is the eigenvector for values[k]. */
	vectors: number[][];
}

/**
 * Cyclic Jacobi rotation. Slow for large matrices and exact enough for the
 * dozens-of-samples case, where an n x n eigendecomposition is nothing.
 */
function jacobiEigen(matrix: number[][], maxSweeps = 100, tolerance = 1e-14): Eigen {
	const n = matrix.length;
	const a = matrix.map((row) => [...row]);
	const v: number[][] = Array.from({ length: n }, (_, i) =>
		Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
	);

	for (let sweep = 0; sweep < maxSweeps; sweep++) {
		let offDiagonal = 0;
		for (let p = 0; p < n; p++) {
			for (let q = p + 1; q < n; q++) offDiagonal += a[p][q] * a[p][q];
		}
		if (Math.sqrt(offDiagonal) < tolerance) break;

		for (let p = 0; p < n; p++) {
			for (let q = p + 1; q < n; q++) {
				if (Math.abs(a[p][q]) < 1e-300) continue;

				const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
				const sign = theta >= 0 ? 1 : -1;
				const t = sign / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
				const c = 1 / Math.sqrt(t * t + 1);
				const s = t * c;

				for (let k = 0; k < n; k++) {
					const akp = a[k][p];
					const akq = a[k][q];
					a[k][p] = c * akp - s * akq;
					a[k][q] = s * akp + c * akq;
				}
				for (let k = 0; k < n; k++) {
					const apk = a[p][k];
					const aqk = a[q][k];
					a[p][k] = c * apk - s * aqk;
					a[q][k] = s * apk + c * aqk;
				}
				for (let k = 0; k < n; k++) {
					const vkp = v[k][p];
					const vkq = v[k][q];
					v[k][p] = c * vkp - s * vkq;
					v[k][q] = s * vkp + c * vkq;
				}
			}
		}
	}

	const order = Array.from({ length: n }, (_, i) => i).sort((i, j) => a[j][j] - a[i][i]);
	return {
		values: order.map((i) => a[i][i]),
		vectors: v.map((row) => order.map((i) => row[i]))
	};
}

export interface PcoaResult {
	/** Row i is sample i; column k is axis k, already scaled by sqrt(eigenvalue). */
	coordinates: number[][];
	eigenvalues: number[];
	/** Share of the positive eigenvalue total held by each axis. */
	varianceExplained: number[];
	/**
	 * Share of the total absolute eigenvalue mass carried by negative
	 * eigenvalues. Above roughly 0.1 the axis percentages are worth distrusting.
	 */
	negativeFraction: number;
}

/**
 * Principal coordinates analysis, also called classical multidimensional
 * scaling. Given driving distances between towns, it reconstructs the road map.
 *
 * Gower's double-centring turns the squared distances into a cross-product
 * matrix; its eigenvectors, scaled by the square roots of the eigenvalues, are
 * the coordinates. Axes come out ordered by how much of the original distance
 * structure they carry, and their signs are arbitrary, so a plot flipped
 * left-to-right carries the same information.
 *
 * A distance that violates the triangle inequality, which includes Bray-Curtis,
 * yields negative eigenvalues. Those axes are real in the algebra and imaginary
 * in the geometry; `negativeFraction` reports how much of the structure sits
 * there.
 */
export function pcoa(distances: number[][]): PcoaResult {
	const n = distances.length;
	if (n === 0) {
		return { coordinates: [], eigenvalues: [], varianceExplained: [], negativeFraction: 0 };
	}

	// Gower centring: B = -1/2 * J D^2 J, applied without building J.
	const a = distances.map((row) => row.map((d) => -0.5 * d * d));
	const rowMeans = a.map((row) => row.reduce((s, x) => s + x, 0) / n);
	const grandMean = rowMeans.reduce((s, x) => s + x, 0) / n;
	const b = a.map((row, i) => row.map((value, j) => value - rowMeans[i] - rowMeans[j] + grandMean));

	const { values, vectors } = jacobiEigen(b);

	const coordinates = Array.from({ length: n }, (_, i) =>
		values.map((lambda, k) => (lambda > 0 ? vectors[i][k] * Math.sqrt(lambda) : 0))
	);

	let positiveTotal = 0;
	let absoluteTotal = 0;
	let negativeTotal = 0;
	for (const lambda of values) {
		absoluteTotal += Math.abs(lambda);
		if (lambda > 0) positiveTotal += lambda;
		else negativeTotal += -lambda;
	}

	return {
		coordinates,
		eigenvalues: values,
		varianceExplained: values.map((lambda) =>
			lambda > 0 && positiveTotal > 0 ? lambda / positiveTotal : 0
		),
		negativeFraction: absoluteTotal > 0 ? negativeTotal / absoluteTotal : 0
	};
}

/** Pairwise Euclidean distances of a configuration, using its first `dimensions` axes. */
export function configurationDistances(coordinates: number[][], dimensions: number): number[][] {
	const n = coordinates.length;
	const d: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
	for (let i = 0; i < n; i++) {
		for (let j = i + 1; j < n; j++) {
			let sum = 0;
			for (let k = 0; k < dimensions; k++) {
				const delta = (coordinates[i][k] ?? 0) - (coordinates[j][k] ?? 0);
				sum += delta * delta;
			}
			const value = Math.sqrt(sum);
			d[i][j] = value;
			d[j][i] = value;
		}
	}
	return d;
}

/**
 * Pool adjacent violators. Returns the closest non-decreasing sequence to
 * `values` in the least-squares sense, which is the monotone fit NMDS uses to
 * turn observed dissimilarities into target disparities.
 */
function poolAdjacentViolators(values: number[]): number[] {
	const sums: number[] = [];
	const counts: number[] = [];
	for (const value of values) {
		sums.push(value);
		counts.push(1);
		while (
			sums.length > 1 &&
			sums[sums.length - 2] / counts[counts.length - 2] > sums[sums.length - 1] / counts[counts.length - 1]
		) {
			const sum = sums.pop()!;
			const count = counts.pop()!;
			sums[sums.length - 1] += sum;
			counts[counts.length - 1] += count;
		}
	}

	const fitted: number[] = [];
	for (let block = 0; block < sums.length; block++) {
		const mean = sums[block] / counts[block];
		for (let i = 0; i < counts[block]; i++) fitted.push(mean);
	}
	return fitted;
}

interface PairIndex {
	i: number;
	j: number;
	observed: number;
}

/** Upper-triangle pairs, sorted by observed dissimilarity. */
function sortedPairs(observed: number[][]): PairIndex[] {
	const pairs: PairIndex[] = [];
	for (let i = 0; i < observed.length; i++) {
		for (let j = i + 1; j < observed.length; j++) {
			pairs.push({ i, j, observed: observed[i][j] });
		}
	}
	pairs.sort((a, b) => a.observed - b.observed);
	return pairs;
}

/**
 * Kruskal's stress-1:
 *
 *   sqrt( sum(d - dhat)^2 / sum(d^2) )
 *
 * where dhat is the monotone regression of the configuration distances on the
 * observed dissimilarities. Because only the ranking is fitted, any monotone
 * rescaling of the configuration leaves stress untouched.
 *
 * Kruskal's rules of thumb: below 0.05 excellent, below 0.1 good, below 0.2
 * usable, above 0.2 treat the picture with suspicion.
 */
export function kruskalStress(observed: number[][], fitted: number[][]): number {
	const pairs = sortedPairs(observed);
	if (pairs.length === 0) return 0;

	const d = pairs.map((p) => fitted[p.i][p.j]);
	const disparities = poolAdjacentViolators(d);

	let residual = 0;
	let total = 0;
	for (let k = 0; k < d.length; k++) {
		residual += (d[k] - disparities[k]) ** 2;
		total += d[k] * d[k];
	}
	if (total === 0) return 0;
	return Math.sqrt(residual / total);
}

export interface NmdsOptions {
	dimensions?: number;
	maxIterations?: number;
	tolerance?: number;
}

export interface NmdsResult {
	coordinates: number[][];
	stress: number;
	/** Stress after the starting configuration and after every accepted step. */
	stressHistory: number[];
	converged: boolean;
}

/**
 * Non-metric multidimensional scaling.
 *
 * NMDS throws away the distances and keeps only their ordering: if shop A is
 * further from B than from C, the picture must show that, and by how much is
 * not its problem. That makes it robust to a distance measure whose absolute
 * values are hard to trust, which describes most ecological dissimilarities.
 *
 * The cost is that the axes carry no variance explained and can be rotated
 * freely, so an NMDS plot has no meaningful axis labels at all. What it has
 * instead is stress, the single number saying how badly the ranking had to bend
 * to fit in two dimensions.
 *
 * Implementation: SMACOF (Guttman transform) against isotonic disparities,
 * started from the PCoA solution the way `vegan::metaMDS` does. A step is kept
 * only when stress-1 actually improves, so the reported history never rises.
 */
export function nmds(observed: number[][], options: NmdsOptions = {}): NmdsResult {
	const dimensions = options.dimensions ?? 2;
	const maxIterations = options.maxIterations ?? 200;
	const tolerance = options.tolerance ?? 1e-8;
	const n = observed.length;

	if (n === 0) return { coordinates: [], stress: 0, stressHistory: [0], converged: true };

	const start = pcoa(observed).coordinates;
	let x = start.map((row) => Array.from({ length: dimensions }, (_, k) => row[k] ?? 0));

	const pairs = sortedPairs(observed);
	let stress = kruskalStress(observed, configurationDistances(x, dimensions));
	const stressHistory = [stress];
	let converged = false;

	for (let iteration = 0; iteration < maxIterations; iteration++) {
		const d = configurationDistances(x, dimensions);
		const disparities = poolAdjacentViolators(pairs.map((p) => d[p.i][p.j]));

		// Guttman transform: X <- (1/n) B(X) X, with B built from the disparities.
		const b: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
		for (let k = 0; k < pairs.length; k++) {
			const { i, j } = pairs[k];
			const dij = d[i][j];
			const ratio = dij > 1e-12 ? -disparities[k] / dij : 0;
			b[i][j] = ratio;
			b[j][i] = ratio;
		}
		for (let i = 0; i < n; i++) {
			let rowSum = 0;
			for (let j = 0; j < n; j++) {
				if (j !== i) rowSum += b[i][j];
			}
			b[i][i] = -rowSum;
		}

		const candidate = Array.from({ length: n }, (_, i) => {
			const row = new Array<number>(dimensions).fill(0);
			for (let j = 0; j < n; j++) {
				for (let k = 0; k < dimensions; k++) row[k] += b[i][j] * x[j][k];
			}
			return row.map((value) => value / n);
		});

		const candidateStress = kruskalStress(observed, configurationDistances(candidate, dimensions));
		if (!Number.isFinite(candidateStress) || candidateStress >= stress - tolerance) {
			converged = true;
			break;
		}

		x = candidate;
		stress = candidateStress;
		stressHistory.push(stress);
	}

	return { coordinates: x, stress, stressHistory, converged };
}

export interface ShepardPoint {
	i: number;
	j: number;
	/** The dissimilarity the metric reported. */
	observed: number;
	/** The distance the ordination actually drew. */
	fitted: number;
	/** The monotone target the fit was pulled toward. */
	disparity: number;
}

/**
 * The Shepard diagram: observed dissimilarity against drawn distance, with the
 * isotonic step function overlaid. A tight staircase means the picture can be
 * trusted; a cloud means it cannot, and stress is that cloud reduced to one
 * number.
 */
export function shepard(
	observed: number[][],
	coordinates: number[][],
	dimensions = 2
): ShepardPoint[] {
	const pairs = sortedPairs(observed);
	const d = configurationDistances(coordinates, dimensions);
	const fitted = pairs.map((p) => d[p.i][p.j]);
	const disparities = poolAdjacentViolators(fitted);

	return pairs.map((pair, k) => ({
		i: pair.i,
		j: pair.j,
		observed: pair.observed,
		fitted: fitted[k],
		disparity: disparities[k]
	}));
}
