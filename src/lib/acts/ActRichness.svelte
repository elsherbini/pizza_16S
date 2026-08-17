<script lang="ts">
	import RichnessCompare from '$lib/charts/RichnessCompare.svelte';
	import { hero } from '$lib/data/index';
	import Scroller from '$lib/scroll/Scroller.svelte';
	import Step from '$lib/scroll/Step.svelte';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	const shops = [hero('vinnies'), hero('sono'), hero('ginos')];
	let step = $state(0);
</script>

<ActHeader
	act="Act 1"
	title="Counting the menu"
	standfirst="Observed richness, and the thing it refuses to look at."
/>

<Scroller bind:active={step}>
	{#snippet graphic(active)}
		<RichnessCompare {shops} stage={active} />
	{/snippet}

	<Step index={0}>
		<p>
			Start with the question you can answer by counting. How many different pizzas did each shop
			sell tonight?
		</p>
		<p>
			One square per pizza type that appeared at least once: Vinnie's on the left, Sono Pizzeria
			Napoletana in the middle, Gino's Corner on the right.
		</p>
	</Step>

	<Step index={1}>
		<p>
			Twelve, twelve, and five. That count is <strong>observed richness</strong>, and it treats every
			type identically whether it sold once or a hundred and ninety times.
		</p>
		<p>
			QIIME 2 calls it <code>observed_features</code>; in vegan it falls out of
			<code>specnumber()</code>. It is also the first Hill number, q = 0, which will matter shortly.
		</p>
	</Step>

	<Step index={2}>
		<p>
			By that measure Vinnie's and Sono's are the same community, and Gino's is less than half as
			diverse as either. Now size each square by the share of tickets it actually accounted for.
		</p>
		<p>
			Four out of five tickets at Vinnie's say the same thing: plain cheese. The other eleven types
			divide what is left. Sono's spreads its 180 tickets across all twelve of its.
		</p>
		<p>
			Richness cannot see any of this, because richness never looks at the counts. Worse, it is the
			metric most sensitive to how deeply you sequenced, which is the subject of Act 3.
		</p>
	</Step>
</Scroller>
