/**
 * Every figure quoted in the running prose, checked against the value the code
 * actually computes. Prose drifts; this stops it drifting silently.
 *
 * Each case names the exact sentence fragment that appears on the page, so a
 * reworded sentence fails loudly rather than leaving a stale number behind.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
	goodsCoverage,
	hill,
	observedRichness,
	pielou,
	rarefactionCurve,
	shannon,
	simpson
} from '../diversity/alpha';
import { brayCurtis, jaccard, relativeAbundance } from '../diversity/beta';
import { countVector, hero, ticketsSold } from '../data/index';

const vinnies = countVector(hero('vinnies'));
const sono = countVector(hero('sono'));
const ginos = countVector(hero('ginos'));
const forno = countVector(hero('forno'));
const uptown = countVector(hero('vinnies_uptown'));

interface Quote {
	file: string;
	/** The fragment as it appears in the component. */
	fragment: string;
	/** The number inside that fragment. */
	quoted: string;
	compute: () => number;
	decimals: number;
}

const QUOTES: Quote[] = [
	{
		file: 'ActSnapshot.svelte',
		fragment: 'the register prints 240 tickets',
		quoted: '240',
		compute: () => ticketsSold(hero('vinnies')),
		decimals: 0
	},
	{
		file: 'ActRichness.svelte',
		fragment: 'a hundred and ninety times',
		quoted: '190',
		compute: () => hero('vinnies').counts.plain_cheese,
		decimals: 0
	},
	{
		file: 'ActRichness.svelte',
		fragment: "Sono's spreads its 180 tickets",
		quoted: '180',
		compute: () => ticketsSold(hero('sono')),
		decimals: 0
	},
	{
		file: 'ActEvenness.svelte',
		fragment: 'ln 12, about 2.48',
		quoted: '2.48',
		compute: () => Math.log(12),
		decimals: 2
	},
	{
		file: 'ActEvenness.svelte',
		fragment: "Sono's scores 2.45",
		quoted: '2.45',
		compute: () => shannon(sono),
		decimals: 2
	},
	{
		file: 'ActEvenness.svelte',
		fragment: "Vinnie's scores 0.91",
		quoted: '0.91',
		compute: () => shannon(vinnies),
		decimals: 2
	},
	{
		file: 'ActEvenness.svelte',
		fragment: "At Vinnie's, 0.64",
		quoted: '0.64',
		compute: () => simpson(vinnies),
		decimals: 2
	},
	{
		file: 'ActEvenness.svelte',
		fragment: "At Sono's, 0.09",
		quoted: '0.09',
		compute: () => simpson(sono),
		decimals: 2
	},
	{
		file: 'ActEvenness.svelte',
		fragment: "Gino's five types score 1.00",
		quoted: '1.00',
		compute: () => pielou(ginos),
		decimals: 2
	},
	{
		file: 'ActEvenness.svelte',
		fragment: "Vinnie's twelve\n\t\t\tscore 0.36",
		quoted: '0.36',
		compute: () => pielou(vinnies),
		decimals: 2
	},
	{
		file: 'ActEvenness.svelte',
		fragment: 'about 2.5 by q = 1',
		quoted: '2.5',
		compute: () => hill(vinnies, 1),
		decimals: 1
	},
	{
		file: 'ActEvenness.svelte',
		fragment: 'and 1.6 by q = 2',
		quoted: '1.6',
		compute: () => hill(vinnies, 2),
		decimals: 1
	},
	{
		file: 'ActRarefaction.svelte',
		fragment: "Vinnie's drops to 5.3",
		quoted: '5.3',
		compute: () => rarefiedTo(vinnies, 34),
		decimals: 1
	},
	{
		file: 'ActRarefaction.svelte',
		fragment: 'coverage at 73.5%',
		quoted: '73.5',
		compute: () => goodsCoverage(forno) * 100,
		decimals: 1
	},
	{
		file: 'ActRarefaction.svelte',
		fragment: 'at 98.3%',
		quoted: '98.3',
		compute: () => goodsCoverage(vinnies) * 100,
		decimals: 1
	},
	{
		file: 'ActBeta.svelte',
		fragment: 'They total 21%',
		quoted: '21',
		compute: () => overlapShare(vinnies, uptown) * 100,
		decimals: 0
	},
	{
		file: 'ActBeta.svelte',
		fragment: 'one minus that: 0.79',
		quoted: '0.79',
		compute: () => brayCurtis(relativeAbundance(vinnies), relativeAbundance(uptown)),
		decimals: 2
	},
	{
		file: 'ActBeta.svelte',
		fragment: 'giving Jaccard 0.56',
		quoted: '0.56',
		compute: () => jaccard(sono, forno),
		decimals: 2
	},
	{
		file: 'ActBeta.svelte',
		fragment: 'Bray-Curtis 0.71',
		quoted: '0.71',
		compute: () => brayCurtis(relativeAbundance(sono), relativeAbundance(forno)),
		decimals: 2
	}
];

function rarefiedTo(counts: number[], depth: number): number {
	const point = rarefactionCurve(counts, { step: 1 }).find((p) => p.depth === depth);
	if (!point) throw new Error(`no rarefaction point at depth ${depth}`);
	return point.expectedRichness;
}

function overlapShare(a: number[], b: number[]): number {
	const ra = relativeAbundance(a);
	const rb = relativeAbundance(b);
	return ra.reduce((sum, value, i) => sum + Math.min(value, rb[i]), 0);
}

const source = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');

describe('figures quoted in the prose', () => {
	test.each(QUOTES)('$file: "$fragment"', ({ file, fragment, quoted, compute, decimals }) => {
		expect(source(file)).toContain(fragment);
		expect(compute().toFixed(decimals)).toBe(quoted);
	});
});

describe('claims the prose makes without printing a number', () => {
	test("Vinnie's and Sono's tie on richness", () => {
		expect(source('ActRichness.svelte')).toContain('Twelve, twelve, and five');
		expect(observedRichness(vinnies)).toBe(12);
		expect(observedRichness(sono)).toBe(12);
		expect(observedRichness(ginos)).toBe(5);
	});

	test("four out of five tickets at Vinnie's are the same pizza", () => {
		expect(source('ActRichness.svelte')).toContain('Four out of five tickets');
		const share = hero('vinnies').counts.plain_cheese / ticketsSold(hero('vinnies'));
		expect(share).toBeGreaterThan(0.78);
		expect(share).toBeLessThan(0.82);
	});

	test("Sono's Shannon sits close to its ceiling", () => {
		expect(source('ActEvenness.svelte')).toContain('close to that ceiling');
		expect(Math.log(12) - shannon(sono)).toBeLessThan(0.05);
	});

	test('unused hero vectors stay available for later acts', () => {
		// Guards against an act being deleted and its data going stale unnoticed.
		expect(goodsCoverage(forno)).toBeLessThan(0.8);
		expect(jaccard(vinnies, uptown)).toBe(0);
		expect(brayCurtis(relativeAbundance(vinnies), relativeAbundance(uptown))).toBeGreaterThan(0.7);
	});
});
