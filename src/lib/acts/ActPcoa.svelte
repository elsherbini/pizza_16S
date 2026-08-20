<script lang="ts">
	import OrdinationPlot from '$lib/charts/OrdinationPlot.svelte';
	import Scroller from '$lib/scroll/Scroller.svelte';
	import Step from '$lib/scroll/Step.svelte';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	let step = $state(0);
</script>

<ActHeader
	act="Act 6"
	title="Drawing the map"
	standfirst="Principal coordinates analysis, and what its axes are and are not."
/>

<Scroller bind:active={step}>
	{#snippet graphic(active)}
		<OrdinationPlot method="pcoa" metric="bray" stage={active} />
	{/snippet}

	<Step index={0}>
		<p>
			Suppose someone handed you the driving distances between thirty-five towns and asked you to
			draw the map. Could you? For distances that came from real positions, very nearly so: the
			distances pin the arrangement down up to rotation and reflection.
		</p>
		<p>
			<strong>Principal coordinates analysis</strong> does that with samples in place of towns.
			Gower's double-centring turns the squared distances into a cross-product matrix, its
			eigenvectors give the directions, and the eigenvalues say how much of the structure each
			direction carries. It is
			<code>cmdscale()</code> in R, <code>skbio.stats.ordination.pcoa</code> in Python, and
			<code>qiime diversity pcoa</code> at the command line.
		</p>
	</Step>

	<Step index={1}>
		<p>
			Now colour the points by style, which the ordination never saw. It was given the Bray-Curtis
			matrix and nothing else: no labels, no styles, no names.
		</p>
		<p>
			The New York slice shops, the Neapolitan places and the Detroit square places have sorted
			themselves out anyway. Shops with similar sales mixes ended up with similar coordinates because
			they had similar distances, and that is the entire mechanism.
		</p>
	</Step>

	<Step index={2}>
		<p>The five shops from the earlier acts are drawn hollow.</p>
		<p>
			Vinnie's and Vinnie's Uptown, which Jaccard scored at 0.00, are ordinary neighbours here rather
			than the same point: Bray-Curtis puts them at 0.79, close to the median distance in this field.
			Under a Jaccard ordination they would land on top of each other.
		</p>
		<p>
			Forno Sperimentale sits furthest from everything, with the highest mean distance of any shop in
			the study. A forty-item menu sampled 34 times will do that, and it is worth remembering that
			this is partly a statement about Forno and partly a statement about its sample size.
		</p>
	</Step>

	<Step index={3}>
		<p>The axes repay a closer look, because they carry less than their prominence suggests.</p>
		<p>
			Axis 1 carries 46.9% of the positive eigenvalue total and axis 2 carries 25.4%, so this picture
			holds 72.4% of the structure in the matrix and has discarded the rest. The axes have no units.
			Their signs are arbitrary, so a mirror image of this plot is the identical result, and any
			interpretation that depends on left versus right is an interpretation of nothing.
		</p>
		<p>
			Bray-Curtis violates the triangle inequality, so the centred matrix is not positive
			semi-definite and some eigenvalues come out negative. Here they hold 2.6% of the total.
			scikit-bio warns about this and then drops them; the percentages above are computed over the
			positive eigenvalues alone, which is the usual convention and also the one that flatters the
			plot.
		</p>
	</Step>
</Scroller>
