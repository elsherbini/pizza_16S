# Pizza, alpha and beta

A scrolling explainer for the alpha diversity, beta diversity, and ordination methods used
in microbial ecology, taught through pizzerias.

A pizzeria is a sample. A pizza type is a species label. One Friday night of order tickets
is your count table. You never get to see the menu, only what was ordered, and that gap is
why the rest of the field exists.

Aimed at graduate students and new bioinformaticians: the formulas appear on screen and the
tool functions are named, because the point is to make `vegan` and `scikit-bio` output
legible rather than to avoid it.

## Running it

```sh
npm install
npm run dev          # http://localhost:5173
npm run build        # static site in build/
npm test             # 188 tests
npm run check        # svelte-check
```

`/gallery` renders every chart at every stage on one static page, which is the fastest way
to review a visualisation without scrolling through eight acts to reach it.

## Publishing

Live at <https://elsherbini.github.io/pizza_16S/>, served from the `gh-pages` branch.

```sh
npm run deploy
```

That builds with `BASE_PATH=/pizza_16S`, because GitHub Pages serves a project site from a
subdirectory and the assets would otherwise resolve against the domain root. Local `dev` and
`preview` leave the base empty, so they are unaffected.

The deploy itself is `scripts/deploy-pages.sh` rather than the `gh-pages` package. That
package seeds a new deploy branch from the default branch and does not clean up what it
inherits, which put `.gitignore`, `.npmrc`, and `.vscode/` on the deploy branch next to the
site. The script publishes an orphan commit instead, so the branch contains the build output
and nothing else.

`static/.nojekyll` is required: without it Pages runs Jekyll, which ignores directories
beginning with an underscore, and SvelteKit puts everything in `_app`.

## Layout

```
src/lib/data/         the taxonomy, the five hand-built shops, the generated field
src/lib/diversity/    every metric, implemented and tested here
src/lib/charts/       one component per visualisation
src/lib/acts/         one component per act, prose included
src/lib/scroll/       the sticky-graphic scroller
scripts/              field generator, Python reference values, screenshot harness
docs/plans/           the design document
docs/style/           the prose rules this piece is written against
```

## The dataset

Five pizzerias are hand-built so that each one defeats a metric the previous one survived.
Vinnie's Slice Shop and Sono Pizzeria have identical richness and wildly different evenness.
Forno Sperimentale has a forty-item menu and a 34-ticket night. Vinnie's two locations stock
exactly the same twelve types, putting them at Jaccard 0.00 and Bray-Curtis 0.79.

Thirty more shops are drawn from style archetypes by `scripts/generate-field.mjs` using a
seeded generator, so the field is identical on every machine. Regenerate with:

```sh
node scripts/generate-field.mjs
```

`src/lib/data/dataset.test.ts` locks those designed contrasts. If one of them breaks, an act
has stopped making its point.

## Are the numbers right

Every metric is computed in the browser from the count table rather than read from a
precomputed file, and the implementations are checked three ways.

Closed-form cases pin down log base, normalisation, and sign: four types at equal abundance
must give Shannon = ln 4, Simpson = 0.25, Pielou = 1.

Cross-language fixtures compare against scikit-bio 0.7.3 and scipy 1.18 on this exact
dataset, to ten decimal places for alpha and beta and eight for the PCoA eigenvalues.
Regenerate them with:

```sh
python3 -m venv .venv && .venv/bin/pip install scipy scikit-bio
.venv/bin/python scripts/reference.py
```

Ordination invariants cover the rest: PCoA must reproduce a Euclidean configuration up to
rotation, Bray-Curtis must produce the negative eigenvalues it is known to produce, NMDS
stress must never rise, and rotating a configuration must leave every distance unchanged.

Logarithms are natural throughout, matching `vegan::diversity`. Note that scikit-bio calls
the sum of squared proportions `dominance` and reserves `simpson` for 1 minus that; this
project uses the textbook naming and the fixture test crosses them deliberately.

Two further test files pair every figure quoted in the running prose with the value the code
computes, so a reworded sentence fails rather than leaving a stale number on the page.

## Scope

Covered: observed richness, Shannon, Simpson, Pielou, Hill numbers, rarefaction, Good's
coverage, Jaccard, Bray-Curtis, the distance matrix, PCoA, NMDS, stress, and the Shepard
diagram.

Deliberately not covered, and named in the final act as what comes next: Faith's PD and
UniFrac, PERMANOVA and betadisper, and compositional data analysis.
