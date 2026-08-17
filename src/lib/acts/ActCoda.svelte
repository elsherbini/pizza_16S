<script lang="ts">
	import ActHeader from '$lib/ui/ActHeader.svelte';

	const GLOSSARY = [
		['One pizzeria', 'A sample', 'one row of the count table'],
		['One order ticket', 'One read', 'a record in a FASTQ file'],
		['A pizza type, "Margherita"', 'An ASV or OTU', 'DADA2 output, a taxonomy assignment'],
		['The exact ingredients', 'Gene content and function', 'shotgun metagenomics, not 16S'],
		['Red base or white', 'A coarser rank, roughly phylum', 'what you colour a bar chart by'],
		['The full menu', 'The true community', 'never observed'],
		["Tonight's tickets", 'The observed community', 'the count table'],
		['Tickets read', 'Sequencing depth', 'reads per sample'],
		['Distinct types tonight', 'Observed richness', 'observed_features, specnumber()'],
		['How level the sales are', 'Evenness', "Pielou's J'"],
		['Guessing the next ticket', 'Shannon entropy', 'diversity(x, "shannon")'],
		['Two customers ordering alike', 'Simpson index', 'dominance() or simpson()'],
		['Reading only 34 tickets', 'Rarefaction', 'rarefy(), after Hurlbert 1971'],
		['Types sold exactly once', 'Singletons', "Good's coverage"],
		['Do two shops stock the same pizzas?', 'Jaccard distance', 'vegdist(x, "jaccard", binary = TRUE)'],
		['Do two shops sell the same pizzas?', 'Bray-Curtis distance', 'vegdist(x, "bray")'],
		['Every pair at once', 'Distance matrix', 'a dist object, a DistanceMatrix'],
		['The map', 'Ordination', 'cmdscale(), metaMDS()'],
		['How bent the map is', "Kruskal's stress", 'reported by metaMDS']
	];
</script>

<ActHeader
	act="Act 9"
	title="The limits of the analogy"
	standfirst="Every analogy has a boundary. Knowing this one's is the last useful thing it can do."
/>

<section class="coda">
	<div class="prose-column">
		<p>
			The count table you have been reading all the way through records what the counting process
			reported, which comes apart from what the pizzeria actually sold in ways the analogy has been
			hiding.
		</p>

		<h3>Some tickets get printed twice</h3>
		<p>
			PCR does not amplify every template equally, and 16S copy number varies several-fold between
			taxa, so a pizza can appear on the spike more often than it left the kitchen. A count table is
			a biased sample of a biased amplification of a biased extraction. Relative abundances are
			comparable across samples far more safely than they are comparable across taxa within one.
		</p>

		<h3>Some tickets came from next door</h3>
		<p>
			Reagent and kit contamination puts organisms in your data that were never in your sample, and
			it dominates when biomass is low. A shop with 34 tickets is far more distorted by three
			stray ones than a shop with 240. Chimeras are the stranger version: two real sequences fused
			into a pizza nobody ever ordered.
		</p>

		<h3>The pizzas do not compete for the oven</h3>
		<p>
			This is where the analogy fails worst. Pizza types are independent labels on a menu, while
			microbial taxa consume each other's outputs, inhibit each other, and cross-feed. A community
			is not a menu, and no diversity metric in this piece models an interaction of any kind. They
			are all descriptions of a list.
		</p>

		<h3>One Friday night</h3>
		<p>
			Every number here comes from a single evening. Communities move, on timescales from hours to
			seasons, and a single snapshot cannot tell a stable community from one caught mid-swing.
		</p>

		<h3>The spike holds a fixed number of slots</h3>
		<p>
			A sequencing run returns a roughly fixed number of reads regardless of how much was in the
			sample, so the data are compositional: one taxon rising forces the others to fall, whether or
			not anything happened to them. Aitchison's critique and the centred log-ratio transform are
			the response, and they are a genuinely different way of doing all of this. That, along with
			the phylogenetic metrics and hypothesis testing, is what comes after this piece.
		</p>

		<h2 class="table-heading">The whole analogy on one page</h2>
	</div>

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th scope="col">Pizza</th>
					<th scope="col">Microbial ecology</th>
					<th scope="col">Where you meet it</th>
				</tr>
			</thead>
			<tbody>
				{#each GLOSSARY as [pizza, ecology, tool] (pizza)}
					<tr>
						<th scope="row">{pizza}</th>
						<td>{ecology}</td>
						<td class="tool">{tool}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="prose-column colophon">
		<h2>Colophon</h2>
		<p>
			Every metric on these pages is computed in the browser from the count table, not read from a
			precomputed file. The implementations are checked against scikit-bio 0.7.3 and scipy 1.18 on
			this same dataset, to ten decimal places for the alpha and beta metrics and eight for the PCoA
			eigenvalues. Logarithms are natural throughout, matching <code>vegan</code>.
		</p>
		<p>
			The five hero pizzerias are hand-built so that each one breaks a metric the previous one
			survived. The other thirty are drawn from style archetypes with a seeded generator, so the
			dataset is the same on every machine.
		</p>
	</div>
</section>

<style>
	.coda {
		padding: 0 1.25rem 7rem;
	}

	.prose-column {
		margin: 0 auto;
	}

	h2 {
		font-size: 1.35rem;
		letter-spacing: -0.01em;
		margin: 2.75rem 0 0.75rem;
		font-weight: 600;
	}

	h3 {
		font-family: var(--font-ui);
		font-size: 0.78rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-muted);
		margin: 2.25rem 0 0.5rem;
		font-weight: 600;
	}

	.table-heading {
		margin-bottom: 1rem;
	}

	.table-wrap {
		max-width: 52rem;
		margin: 0 auto 1rem;
		overflow-x: auto;
		border: 1px solid var(--hairline);
		border-radius: 0.5rem;
		background: var(--surface);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-ui);
		font-size: 0.8rem;
	}

	th,
	td {
		text-align: left;
		padding: 0.5rem 0.85rem;
		border-bottom: 1px solid var(--hairline);
		font-weight: 400;
		vertical-align: top;
	}

	thead th {
		font-weight: 600;
		color: var(--ink);
		white-space: nowrap;
	}

	tbody th {
		color: var(--ink);
		font-weight: 500;
	}

	tbody td {
		color: var(--ink-secondary);
	}

	tbody tr:last-child th,
	tbody tr:last-child td {
		border-bottom: none;
	}

	.tool {
		font-family: var(--font-mono);
		font-size: 0.74rem;
		color: var(--ink-muted);
	}

	.colophon {
		margin-top: 3rem;
	}
</style>
