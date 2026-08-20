<script lang="ts">
	import OrdinationPlot from '$lib/charts/OrdinationPlot.svelte';
	import ShepardPlot from '$lib/charts/ShepardPlot.svelte';
	import Scroller from '$lib/scroll/Scroller.svelte';
	import Step from '$lib/scroll/Step.svelte';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	let step = $state(0);
</script>

<ActHeader
	act="Act 7"
	title="When you only trust the ranking"
	standfirst="NMDS, the Shepard diagram, and what stress is actually measuring."
/>

<Scroller bind:active={step}>
	{#snippet graphic(active)}
		{#if active === 0}
			<OrdinationPlot method="nmds" metric="bray" stage={3} />
		{:else}
			<ShepardPlot stage={active - 1} />
		{/if}
	{/snippet}

	<Step index={0}>
		<p>
			How much of a Bray-Curtis value would you defend: its magnitude, or only its ordering? For most
			ecological dissimilarities the honest answer is the ordering.
		</p>
		<p>
			<strong>NMDS</strong> takes that answer seriously. It gives up on reproducing the distances and
			keeps only their rank order: if shop A is further from B than from C, the picture must show
			that, and by how much is not its problem. This is <code>metaMDS()</code> in vegan, and it is
			the plot most microbial ecology papers print.
		</p>
	</Step>

	<Step index={1}>
		<p>
			To see what the fit is doing, plot every pair twice. Horizontal is what Bray-Curtis said;
			vertical is what the picture drew. All 595 pairs, one dot each. This is a
			<strong>Shepard diagram</strong>.
		</p>
	</Step>

	<Step index={2}>
		<p>
			What NMDS fits to that cloud is the best non-decreasing step function it can manage, by isotonic
			regression, after which it moves the points to close the gap between the dots and the steps.
		</p>
		<p>
			Any monotone relationship at all is a perfect fit. That freedom is the whole method, and it is
			why an NMDS plot has no units on either axis.
		</p>
	</Step>

	<Step index={3}>
		<p>The vertical ticks are the residuals. Stress is their size relative to the distances drawn.</p>
		<p class="formula">stress = &radic;( &sum;(d - d&#770;)&sup2; / &sum; d&sup2; )</p>
		<p>
			Kruskal's rules of thumb: under 0.05 excellent, under 0.1 good, under 0.2 usable, over 0.2 not
			worth reading. This fit reaches 0.077 after 115 accepted steps, starting from the PCoA solution
			the way <code>metaMDS</code> does.
		</p>
		<p>
			That PCoA starting configuration scores 0.147 on the same criterion. NMDS wins because it spent
			the whole run optimising precisely this quantity and PCoA never looked at it. What you give up
			is real: NMDS axes carry no variance explained, can be rotated or reflected without changing
			anything, and cannot be compared between studies.
		</p>
	</Step>
</Scroller>
