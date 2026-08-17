<script lang="ts">
	import OrdinationPlot from '$lib/charts/OrdinationPlot.svelte';
	import Scroller from '$lib/scroll/Scroller.svelte';
	import Step from '$lib/scroll/Step.svelte';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	let step = $state(0);
	let method = $state<'pcoa' | 'nmds'>('pcoa');
	let metric = $state<'bray' | 'jaccard'>('bray');

	// The metric switch is the point of this act, so drive it from the scroll
	// and leave the controls live for anyone who wants to poke at it.
	$effect(() => {
		metric = step >= 1 ? 'jaccard' : 'bray';
	});
</script>

<ActHeader
	act="Act 8"
	title="Reading it honestly"
	standfirst="What separation on an ordination does and does not entitle you to say."
/>

<Scroller bind:active={step}>
	{#snippet graphic()}
		<OrdinationPlot bind:method bind:metric stage={3} showControls />
	{/snippet}

	<Step index={0}>
		<p>
			Both controls above the plot are live. Change the method and the picture shifts a little.
			Change the distance metric and it rearranges.
		</p>
	</Step>

	<Step index={1}>
		<p>
			Switching from Bray-Curtis to Jaccard replaces every one of the 595 numbers in the matrix, so
			the ordination is now drawing a different dataset from the same count table.
		</p>
		<p>
			On Jaccard the first two axes carry 62.6% instead of 72.4%, the negative eigenvalues grow from
			2.6% to 6.4%, and NMDS stress rises from 0.077 to 0.109. Presence and absence is a harder thing
			to flatten into two dimensions than abundance is, because the rare types that Jaccard weights
			fully do not lie along any single gradient.
		</p>
		<p>
			The choice of distance metric moves the result further than the choice of ordination method
			does, and it is the choice papers most often make without saying why.
		</p>
	</Step>

	<Step index={2}>
		<p>
			The gap between two nearby points is more trustworthy than the gap between two distant ones,
			because the fit spends its effort where it can. In PCoA the axes are ordered by eigenvalue, so
			vertical spread genuinely matters less than horizontal spread, and a plot stretched to fill its
			frame hides that. Both axes here are drawn on one scale for exactly that reason.
		</p>
		<p>
			Above all: a cluster you can see is not a cluster that is significant. Two groups can separate
			convincingly by eye and fail a test, and two groups can overlap and pass one.
		</p>
	</Step>

	<Step index={3}>
		<p>
			The test is PERMANOVA, <code>adonis2()</code> in vegan or
			<code>qiime diversity beta-group-significance</code>, which permutes the group labels a few
			thousand times and asks how often chance alone produces this much separation.
		</p>
		<p>
			It carries a trap. PERMANOVA can come back significant because the groups sit in different
			places, or because one group is simply more scattered than the other, and those are different
			findings. <code>betadisper()</code> tells them apart. Reporting the first without checking the second
			is among the most common errors in this literature.
		</p>
		<p>
			None of that is in this piece. Neither are the phylogenetic metrics, Faith's PD and UniFrac,
			which ask not merely whether two shops sell different pizzas but how different those pizzas are
			from each other. Nor is the compositional argument, which observes that a ticket spike holds a
			fixed number of slots, so the proportions on it are constrained in ways that ordinary
			statistics do not expect.
		</p>
	</Step>
</Scroller>
