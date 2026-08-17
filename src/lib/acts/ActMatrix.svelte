<script lang="ts">
	import DistanceHeatmap from '$lib/charts/DistanceHeatmap.svelte';
	import Scroller from '$lib/scroll/Scroller.svelte';
	import Step from '$lib/scroll/Step.svelte';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	let step = $state(0);
</script>

<ActHeader
	act="Act 5"
	title="Every pair at once"
	standfirst="The distance matrix is the complete answer and the wrong shape for a person."
/>

<Scroller bind:active={step}>
	{#snippet graphic(active)}
		<DistanceHeatmap stage={active} />
	{/snippet}

	<Step index={0}>
		<p>
			Beta diversity gives you one number for one pair. With five shops there are ten of them, and
			you can simply read the table.
		</p>
		<p>
			Rows and columns are the same five shops, so the diagonal is each shop against itself and the
			matrix is symmetric: half of it is redundant. Vinnie's against Sono's is 1.00, the two having
			not one pizza type in common.
		</p>
	</Step>

	<Step index={1}>
		<p>Add the other thirty shops and there are 595 distinct distances in front of you.</p>
		<p>
			Every one of them is still exactly as true as the ten you could read a moment ago. None of them
			is legible. This is the state of any real study: the matrix holds the complete answer in a form
			nobody can use.
		</p>
	</Step>

	<Step index={2}>
		<p>
			Nothing has changed except the order of the rows and columns. Shops that resemble each other
			now sit next to each other, and blocks appear along the diagonal.
		</p>
		<p>
			The reordering used one number per shop, and that number was the first axis of the ordination
			in the next act. Ordination is this idea taken seriously: find the arrangement that makes the
			structure visible, then be honest about how much had to be discarded to get it.
		</p>
	</Step>
</Scroller>
