/**
 * Beta diversity — how different are two samples from each other?
 *
 * Alpha diversity describes the inside of one pizzeria. Beta diversity is the
 * distance between two of them. Two questions hide inside "how different are
 * these shops", and the metric you pick decides which one you asked:
 *
 *   Do they serve the same kinds of pizza?        -> Jaccard  (presence only)
 *   Do they serve them in the same proportions?   -> Bray-Curtis (abundance)
 *
 * Both are dissimilarities on [0, 1]: 0 means identical, 1 means nothing shared.
 */

import type { Counts } from './alpha';

export type DistanceMetric = (a: Counts, b: Counts) => number;

/**
 * Counts as proportions. Bray-Curtis on raw counts partly measures how busy a
 * shop was rather than what it sold, so relativizing first is usually what you
 * want, and it is what `phyloseq` users do with `transform_sample_counts`.
 */
export function relativeAbundance(counts: Counts): number[] {
	let total = 0;
	for (const c of counts) total += c;
	if (total === 0) return counts.map(() => 0);
	return counts.map((c) => c / total);
}

/**
 * Jaccard dissimilarity, 1 - |A intersect B| / |A union B|.
 *
 * Reads the menus and nothing else. A shop that sells one anchovy pie a week
 * counts exactly as much as its best-selling cheese slice, which makes Jaccard
 * sensitive to rare types and therefore to sequencing depth.
 */
export function jaccard(a: Counts, b: Counts): number {
	let shared = 0;
	let union = 0;
	for (let i = 0; i < a.length; i++) {
		const inA = a[i] > 0;
		const inB = b[i] > 0;
		if (inA && inB) shared++;
		if (inA || inB) union++;
	}
	if (union === 0) return 0;
	return 1 - shared / union;
}

/**
 * Bray-Curtis dissimilarity, sum|a_i - b_i| / sum(a_i + b_i).
 *
 * Reads the order volumes. Two shops stocking identical menus can sit far apart
 * if one of them sells almost nothing but plain cheese. Rare types barely move
 * the number, so Bray-Curtis is dominated by the abundant end of the community.
 *
 * It is not a metric in the strict sense: it violates the triangle inequality,
 * which is why PCoA on a Bray-Curtis matrix produces negative eigenvalues.
 */
export function brayCurtis(a: Counts, b: Counts): number {
	let difference = 0;
	let total = 0;
	for (let i = 0; i < a.length; i++) {
		difference += Math.abs(a[i] - b[i]);
		total += a[i] + b[i];
	}
	if (total === 0) return 0;
	return difference / total;
}

/**
 * All pairwise distances. For n samples this holds n(n-1)/2 distinct numbers,
 * which is everything you know about how the samples relate and far too many to
 * read. Ordination exists to turn this into a picture.
 */
export function distanceMatrix(samples: Counts[], metric: DistanceMetric): number[][] {
	const n = samples.length;
	const d: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
	for (let i = 0; i < n; i++) {
		for (let j = i + 1; j < n; j++) {
			const value = metric(samples[i], samples[j]);
			d[i][j] = value;
			d[j][i] = value;
		}
	}
	return d;
}
