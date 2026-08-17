/**
 * Alpha diversity — how varied is the inside of one sample?
 *
 * Every function here takes a count vector: one pizzeria's Friday-night ticket
 * spike, with one slot per pizza type in the shared taxonomy. Zeros mean "on the
 * menu, but nobody ordered it tonight" — which, crucially, looks identical to
 * "not on the menu at all". You only ever see the orders.
 *
 * All logarithms are natural logs, matching `vegan::diversity(x, "shannon")`
 * and `skbio.diversity.alpha.shannon(x, base=np.e)`.
 */

export type Counts = readonly number[];

/** Total tickets — the sequencing depth of this sample. */
export function totalCount(counts: Counts): number {
	let total = 0;
	for (const c of counts) total += c;
	return total;
}

/** Proportions of the non-zero types, i.e. the observed relative abundances. */
function proportions(counts: Counts): number[] {
	const n = totalCount(counts);
	if (n === 0) return [];
	const p: number[] = [];
	for (const c of counts) {
		if (c > 0) p.push(c / n);
	}
	return p;
}

/**
 * Observed richness (Hill q=0): how many distinct pizza types appear on the
 * spike. Counts every type equally, whether it sold once or a thousand times.
 */
export function observedRichness(counts: Counts): number {
	let s = 0;
	for (const c of counts) {
		if (c > 0) s++;
	}
	return s;
}

/**
 * Shannon entropy, H' = -sum(p_i * ln p_i).
 *
 * The uncertainty in guessing the next ticket. Rises with more types and with
 * more even ordering; zero when everyone orders the same pizza.
 */
export function shannon(counts: Counts): number {
	let h = 0;
	for (const p of proportions(counts)) h -= p * Math.log(p);
	return h;
}

/**
 * Simpson's index, D = sum(p_i^2).
 *
 * The probability that two tickets drawn at random are the same pizza type.
 * High D means a dominated community. Note this is the *dominance* form; the
 * "Simpson diversity" reported by some tools is 1 - D (see `giniSimpson`).
 */
export function simpson(counts: Counts): number {
	let d = 0;
	for (const p of proportions(counts)) d += p * p;
	return d;
}

/** Gini-Simpson, 1 - D: probability two random tickets differ. */
export function giniSimpson(counts: Counts): number {
	return 1 - simpson(counts);
}

/** Inverse Simpson, 1/D (Hill q=2): the effective number of common types. */
export function invSimpson(counts: Counts): number {
	return 1 / simpson(counts);
}

/**
 * Pielou's evenness, J' = H' / ln(S).
 *
 * How close this shop is to selling every type it stocks at the same rate.
 * Undefined (NaN) for a single-type community, where H' and ln(S) are both 0 —
 * the same thing `vegan` reports.
 */
export function pielou(counts: Counts): number {
	const s = observedRichness(counts);
	if (s <= 1) return NaN;
	return shannon(counts) / Math.log(s);
}

/**
 * Hill number of order q — the effective number of pizza types.
 *
 *   D_q = (sum p_i^q)^(1/(1-q))
 *
 * One dial that unifies the metrics above. q=0 counts every type equally
 * (richness), q=1 weights each by its frequency (exp of Shannon), q=2 is
 * dominated by the common types (inverse Simpson). The answer is always in the
 * same unit — "how many types would an evenly-selling shop need to feel this
 * diverse" — which is why Hill numbers are comparable and raw indices are not.
 */
export function hill(counts: Counts, q: number): number {
	const p = proportions(counts);
	if (p.length === 0) return 0;

	// D_q has a removable singularity at q=1; the limit is exp(H').
	if (Math.abs(q - 1) < 1e-10) return Math.exp(shannon(counts));

	let sum = 0;
	for (const pi of p) sum += Math.pow(pi, q);
	return Math.pow(sum, 1 / (1 - q));
}

/**
 * Good's coverage, C = 1 - F1/N, where F1 is the number of types ordered
 * exactly once.
 *
 * The estimated share of tickets belonging to types you have already seen. A
 * pile of pizzas ordered exactly once is the signature of a pile of pizzas you
 * did not see at all.
 */
export function goodsCoverage(counts: Counts): number {
	const n = totalCount(counts);
	if (n === 0) return 0;
	let singletons = 0;
	for (const c of counts) {
		if (c === 1) singletons++;
	}
	return 1 - singletons / n;
}

/** Cumulative ln(k!), grown on demand. Exact enough for integer count data. */
const logFactorials: number[] = [0];
function logFactorial(k: number): number {
	for (let i = logFactorials.length; i <= k; i++) {
		logFactorials.push(logFactorials[i - 1] + Math.log(i));
	}
	return logFactorials[k];
}

export interface RarefactionPoint {
	depth: number;
	expectedRichness: number;
}

/**
 * Hurlbert's expected richness at one sampling depth:
 *
 *   E[S_n] = sum_i [ 1 - C(N - x_i, n) / C(N, n) ]
 *
 * Each term is one minus the probability of missing type i entirely. Exposed
 * separately from the curve because anything reading a value at an arbitrary
 * depth, a slider for instance, must evaluate it there rather than snap to
 * whichever depths the curve happened to be sampled at.
 */
export function rarefiedRichness(counts: Counts, depth: number): number {
	const n = totalCount(counts);
	if (n === 0 || depth <= 0) return 0;
	if (depth > n) return NaN;

	const logChooseN = logFactorial(n) - logFactorial(depth) - logFactorial(n - depth);

	let expected = 0;
	for (const x of counts) {
		if (x <= 0) continue;
		const remaining = n - x;
		// Fewer tickets left than we plan to read, so type x cannot be missed.
		if (remaining < depth) {
			expected += 1;
			continue;
		}
		const logMissing =
			logFactorial(remaining) -
			logFactorial(depth) -
			logFactorial(remaining - depth) -
			logChooseN;
		expected += 1 - Math.exp(logMissing);
	}
	return expected;
}

/**
 * Analytic rarefaction (Hurlbert 1971): the expected number of types you would
 * have seen had you only read `n` of the tickets.
 *
 *   E[S_n] = sum_i [ 1 - C(N - x_i, n) / C(N, n) ]
 *
 * Each term is one minus the probability of missing type i entirely. This is
 * what `vegan::rarefy` computes — no random subsampling, so no seed and no
 * simulation noise. It is the honest answer to "is this shop really less
 * diverse, or did I just read fewer tickets?"
 */
export function rarefactionCurve(
	counts: Counts,
	options: { step?: number } = {}
): RarefactionPoint[] {
	const n = totalCount(counts);
	if (n === 0) return [];

	const step = options.step ?? Math.max(1, Math.round(n / 100));
	const depths = new Set<number>([1]);
	for (let d = step; d <= n; d += step) depths.add(d);
	depths.add(n);

	return [...depths]
		.sort((a, b) => a - b)
		.map((depth) => ({ depth, expectedRichness: rarefiedRichness(counts, depth) }));
}
