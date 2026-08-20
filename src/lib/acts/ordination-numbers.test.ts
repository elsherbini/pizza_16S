/**
 * The figures Acts 5 to 8 quote about the whole field, checked against the
 * ordination the page actually runs. These are the numbers most likely to move
 * if the dataset or the fitting code changes, and least likely to be noticed.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { allShops, countMatrix, heroShops } from '../data/index';
import { brayCurtis, distanceMatrix, jaccard, relativeAbundance } from '../diversity/beta';
import {
	configurationDistances,
	kruskalStress,
	nmds,
	pcoa,
	rotateToPrincipalAxes
} from '../diversity/ordination';

const source = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');

const counts = countMatrix(allShops);
const bray = distanceMatrix(counts.map(relativeAbundance), brayCurtis);
const jac = distanceMatrix(counts, jaccard);

const brayPcoa = pcoa(bray);
const jaccardPcoa = pcoa(jac);
const brayNmds = nmds(bray, { dimensions: 2 });
const jaccardNmds = nmds(jac, { dimensions: 2 });

const percent = (value: number, digits = 1) => (value * 100).toFixed(digits);

describe('Act 5: the matrix', () => {
	test('quotes the right number of pairs', () => {
		const pairs = (allShops.length * (allShops.length - 1)) / 2;
		expect(pairs).toBe(595);
		expect(source('ActMatrix.svelte')).toContain('595 distinct distances');
	});

	test('the five hero shops give ten pairs', () => {
		expect((heroShops.length * (heroShops.length - 1)) / 2).toBe(10);
		expect(source('ActMatrix.svelte')).toContain('there are ten of them');
	});

	test("Vinnie's against Sono's really is 1.00", () => {
		const vi = allShops.findIndex((s) => s.id === 'vinnies');
		const si = allShops.findIndex((s) => s.id === 'sono');
		expect(bray[vi][si]).toBeCloseTo(1, 12);
		expect(source('ActMatrix.svelte')).toContain("Vinnie's against Sono's is 1.00");
	});
});

describe('Act 6: PCoA on Bray-Curtis', () => {
	test('axis percentages', () => {
		expect(percent(brayPcoa.varianceExplained[0])).toBe('46.9');
		expect(percent(brayPcoa.varianceExplained[1])).toBe('25.4');
		expect(percent(brayPcoa.varianceExplained[0] + brayPcoa.varianceExplained[1])).toBe('72.4');

		const text = source('ActPcoa.svelte');
		expect(text).toContain('46.9% of the positive eigenvalue total');
		expect(text).toContain('axis 2 carries 25.4%');
		expect(text).toContain('72.4% of the structure');
	});

	test('negative eigenvalue share', () => {
		expect(percent(brayPcoa.negativeFraction)).toBe('2.6');
		expect(source('ActPcoa.svelte')).toContain('they hold 2.6% of the total');
	});

	test("the two Vinnie's sit near the median distance rather than on top of each other", () => {
		const vi = allShops.findIndex((s) => s.id === 'vinnies');
		const ui = allShops.findIndex((s) => s.id === 'vinnies_uptown');
		expect(bray[vi][ui].toFixed(2)).toBe('0.79');

		const pairs: number[] = [];
		for (let i = 0; i < bray.length; i++) {
			for (let j = i + 1; j < bray.length; j++) pairs.push(bray[i][j]);
		}
		pairs.sort((a, b) => a - b);
		const rank = pairs.filter((v) => v < bray[vi][ui]).length / pairs.length;
		expect(rank).toBeGreaterThan(0.4);
		expect(rank).toBeLessThan(0.6);
		expect(source('ActPcoa.svelte')).toContain('close to the median distance in this field');
	});

	test('Forno really is the most isolated shop', () => {
		const meanDistance = (i: number) => bray[i].reduce((a, b) => a + b, 0) / (bray.length - 1);
		const means = allShops.map((_, i) => meanDistance(i));
		const fi = allShops.findIndex((s) => s.id === 'forno');
		expect(Math.max(...means)).toBeCloseTo(means[fi], 12);
		expect(source('ActPcoa.svelte')).toContain('the highest mean distance of any shop');
	});

	test('the plot really is drawn from an unlabelled matrix', () => {
		// Nothing in the pipeline that produces coordinates ever sees `style`.
		const coordinates = rotateToPrincipalAxes(brayPcoa.coordinates, 2);
		expect(coordinates).toHaveLength(allShops.length);
		expect(source('ActPcoa.svelte')).toContain('no labels, no styles, no names');
	});
});

describe('Act 7: NMDS and stress', () => {
	test('stress of the fitted configuration', () => {
		expect(brayNmds.stress.toFixed(3)).toBe('0.077');
		expect(source('ActNmds.svelte')).toContain('reaches 0.077');
	});

	test('number of accepted steps', () => {
		expect(brayNmds.stressHistory.length - 1).toBe(115);
		expect(source('ActNmds.svelte')).toContain('after 115 accepted steps');
	});

	test('the PCoA starting configuration scores worse on the same criterion', () => {
		const startStress = kruskalStress(
			bray,
			configurationDistances(brayPcoa.coordinates, 2)
		);
		expect(startStress.toFixed(3)).toBe('0.147');
		expect(startStress).toBeGreaterThan(brayNmds.stress);
		expect(source('ActNmds.svelte')).toContain('scores 0.147 on the same criterion');
	});
});

describe('Act 8: swapping the distance metric', () => {
	test('Jaccard axis percentages', () => {
		expect(percent(jaccardPcoa.varianceExplained[0] + jaccardPcoa.varianceExplained[1])).toBe(
			'62.6'
		);
		expect(source('ActReading.svelte')).toContain('carry 62.6% instead of 72.4%');
	});

	test('Jaccard produces a bigger negative eigenvalue share', () => {
		expect(percent(jaccardPcoa.negativeFraction)).toBe('6.4');
		expect(jaccardPcoa.negativeFraction).toBeGreaterThan(brayPcoa.negativeFraction);
		expect(source('ActReading.svelte')).toContain('from\n\t\t\t2.6% to 6.4%');
	});

	test('Jaccard is harder to flatten, so stress rises', () => {
		expect(jaccardNmds.stress.toFixed(3)).toBe('0.109');
		expect(jaccardNmds.stress).toBeGreaterThan(brayNmds.stress);
		expect(source('ActReading.svelte')).toContain('rises from 0.077 to 0.109');
	});
});
