/**
 * Generates the wider field of pizzerias that Acts 5 through 8 ordinate.
 *
 * Each shop is drawn from a style archetype: a set of relative weights over the
 * pizza taxonomy, jittered per shop and then sampled as a multinomial at that
 * shop's Friday-night volume. The result is a count table with the properties
 * real amplicon data has, namely a long tail of rare types, singletons, and
 * uneven sampling depth between samples.
 *
 * The PRNG is seeded, so the output is identical on every machine. Run with
 * `node scripts/generate-field.mjs` and commit the result.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', 'src', 'lib', 'data');

const { pizzas } = JSON.parse(readFileSync(join(dataDir, 'pizzas.json'), 'utf8'));
const pizzaIds = pizzas.map((p) => p.id);

const SEED = 0x5112244;

/** Mulberry32: small, fast, and reproducible across runtimes. */
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const random = mulberry32(SEED);

/** Box-Muller, one value at a time. */
function normal() {
	const u = Math.max(random(), 1e-12);
	const v = random();
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const ARCHETYPES = {
	ny_slice: {
		plain_cheese: 40,
		pepperoni: 15,
		sicilian_square: 7,
		grandma_slice: 7,
		white_slice: 5,
		sausage_peppers: 5,
		mushroom: 4,
		buffalo_chicken: 4,
		vodka_slice: 3,
		meat_lovers: 3,
		veggie_supreme: 3,
		hawaiian: 2,
		bacon_ranch: 2,
		chicken_parm: 2,
		eggplant_parm: 2
	},
	neapolitan: {
		margherita: 25,
		marinara: 12,
		diavola: 12,
		quattro_formaggi: 10,
		prosciutto_rucola: 9,
		bufala_dop: 9,
		capricciosa: 8,
		ortolana: 7,
		bianca_patate: 6,
		cacio_e_pepe: 4,
		nduja: 4,
		mushroom_truffle: 3
	},
	detroit: {
		detroit_red_top: 28,
		cup_char_pepperoni: 20,
		hot_honey_soppressata: 14,
		sicilian_square: 10,
		plain_cheese: 8,
		grandma_slice: 6,
		mortadella_pistachio: 5,
		nduja: 4,
		white_slice: 3,
		buffalo_chicken: 3,
		mushroom_truffle: 3,
		clam_pie: 2
	}
};

/** Every shop keeps a faint chance of selling anything, which is what puts singletons in the tail. */
const BACKGROUND_WEIGHT = 0.2;

const SHOPS = [
	['angelos', "Angelo's Pizza", 'ny_slice', 'Bensonhurst'],
	['two_brothers', 'Two Brothers', 'ny_slice', 'Bay Ridge'],
	['corner_slice', 'Corner Slice Co.', 'ny_slice', 'Sunnyside'],
	['nunzios', "Nunzio's", 'ny_slice', 'Todt Hill'],
	['carmine_joes', "Joe's on Carmine", 'ny_slice', 'West Village'],
	['pronto', 'Pronto Pizza', 'ny_slice', 'Ridgewood'],
	['sal_carmine', 'Sal & Carmine', 'ny_slice', 'Upper West Side'],
	['roccos', "Rocco's Slice House", 'ny_slice', 'Bath Beach'],
	['lucianos', "Luciano's Pizzeria", 'ny_slice', 'Throgs Neck'],

	['forno_bianco', 'Forno Bianco', 'neapolitan', 'Cobble Hill'],
	['antica_ruota', "L'Antica Ruota", 'neapolitan', 'Greenpoint'],
	['vera_napoli', 'Vera Napoli', 'neapolitan', 'Fort Greene'],
	['il_mulino_rosso', 'Il Mulino Rosso', 'neapolitan', 'Park Slope'],
	['ischia', 'Ischia Wood Fired', 'neapolitan', 'Red Hook'],
	['bricco', 'Bricco Napoletano', 'neapolitan', 'Boerum Hill'],
	['cortile', 'Cortile', 'neapolitan', 'Nolita'],
	['sorbillo_sud', 'Sorbillo Sud', 'neapolitan', 'Carroll Gardens'],
	['pane_e_fuoco', 'Pane e Fuoco', 'neapolitan', 'Long Island City'],

	['motor_city', 'Motor City Pan', 'detroit', 'Gowanus'],
	['buddys_corner', "Buddy's Corner Pan", 'detroit', 'Windsor Terrace'],
	['square_deal', 'Square Deal Pizza', 'detroit', 'Bushwick'],
	['steel_pan', 'Steel Pan Pie Co.', 'detroit', 'Sunset Park'],
	['cadieux', 'Cadieux Square', 'detroit', 'Crown Heights'],
	['blue_line', 'The Blue Line Pan', 'detroit', 'Kensington'],
	['eight_mile', 'Eight Mile Pan', 'detroit', 'East Williamsburg'],
	['rust_belt', 'Rust Belt Pies', 'detroit', 'Bed-Stuy'],

	['hybrid_lab', 'Hybrid Pie Lab', 'fusion', 'Dumbo'],
	['crossover', 'Crossover Pizza', 'fusion', 'Prospect Heights'],
	['third_coast', 'Third Coast Pizza', 'fusion', 'Clinton Hill'],
	['middle_ground', 'The Middle Ground', 'fusion', 'Greenwood']
];

/** Fusion shops are literal blends, so they land between the clusters instead of in one. */
const FUSION_BLENDS = {
	hybrid_lab: { ny_slice: 0.45, neapolitan: 0.35, detroit: 0.2 },
	crossover: { ny_slice: 0.5, detroit: 0.5 },
	third_coast: { neapolitan: 0.55, detroit: 0.45 },
	middle_ground: { ny_slice: 0.34, neapolitan: 0.33, detroit: 0.33 }
};

function blendedWeights(shopId, style) {
	const blend = style === 'fusion' ? FUSION_BLENDS[shopId] : { [style]: 1 };
	const weights = Object.fromEntries(pizzaIds.map((id) => [id, BACKGROUND_WEIGHT]));
	for (const [archetype, share] of Object.entries(blend)) {
		for (const [id, weight] of Object.entries(ARCHETYPES[archetype])) {
			weights[id] += weight * share;
		}
	}
	return weights;
}

function sampleShop(shopId, style) {
	const base = blendedWeights(shopId, style);

	// Per-shop lognormal jitter: two shops of the same style still differ.
	const jittered = pizzaIds.map((id) => base[id] * Math.exp(0.55 * normal()));
	const total = jittered.reduce((s, w) => s + w, 0);
	const cdf = [];
	let running = 0;
	for (const w of jittered) {
		running += w / total;
		cdf.push(running);
	}

	// Friday-night volume varies a lot between shops, which is exactly the
	// uneven sequencing depth that makes rarefaction necessary.
	const depth = Math.round(70 + Math.exp(normal() * 0.5) * 130);

	const counts = Object.fromEntries(pizzaIds.map((id) => [id, 0]));
	for (let ticket = 0; ticket < depth; ticket++) {
		const u = random();
		let index = cdf.findIndex((c) => u <= c);
		if (index < 0) index = pizzaIds.length - 1;
		counts[pizzaIds[index]]++;
	}

	for (const id of pizzaIds) {
		if (counts[id] === 0) delete counts[id];
	}
	return counts;
}

const shops = SHOPS.map(([id, name, style, neighbourhood]) => ({
	id,
	name,
	style,
	neighbourhood,
	counts: sampleShop(id, style)
}));

const output = {
	$comment:
		'Generated by scripts/generate-field.mjs from a seeded PRNG. Edit the script, not this file.',
	seed: SEED,
	shops
};

writeFileSync(join(dataDir, 'field.json'), JSON.stringify(output, null, '\t') + '\n');

const depths = shops.map((s) => Object.values(s.counts).reduce((a, b) => a + b, 0));
const richness = shops.map((s) => Object.keys(s.counts).length);
console.log(`wrote ${shops.length} shops`);
console.log(`depth    min ${Math.min(...depths)}  max ${Math.max(...depths)}`);
console.log(`richness min ${Math.min(...richness)}  max ${Math.max(...richness)}`);
