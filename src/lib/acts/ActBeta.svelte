<script lang="ts">
	import PairCompare from '$lib/charts/PairCompare.svelte';
	import { hero } from '$lib/data/index';
	import Scroller from '$lib/scroll/Scroller.svelte';
	import Step from '$lib/scroll/Step.svelte';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	const vinnies = hero('vinnies');
	const uptown = hero('vinnies_uptown');
	const sono = hero('sono');
	const forno = hero('forno');

	let step = $state(0);
</script>

<ActHeader
	act="Act 4"
	title="Two shops, one question"
	standfirst="Jaccard asks what is on the board. Bray-Curtis asks what actually sold."
/>

<Scroller bind:active={step}>
	{#snippet graphic(active)}
		{#if active >= 3}
			<PairCompare a={sono} b={forno} stage={2} />
		{:else}
			<PairCompare a={vinnies} b={uptown} stage={active} />
		{/if}
	{/snippet}

	<Step index={0}>
		<p>
			Alpha diversity describes the inside of one shop. <strong>Beta diversity</strong> is the distance
			between two of them.
		</p>
		<p>
			Here are Vinnie's two locations back to back, one row per pizza type, each converted to shares
			of its own night so that the busier shop does not simply come out looking bigger.
		</p>
	</Step>

	<Step index={1}>
		<p>
			First question: do they serve the same kinds of pizza? Ignore the volumes and look only at
			which types appear at all.
		</p>
		<p class="formula">J = 1 - |A &cap; B| / |A &cup; B|</p>
		<p>
			Both locations stock the same twelve types, so the intersection is the union and the distance
			is 0.00. By this measure the two shops are one community.
		</p>
	</Step>

	<Step index={2}>
		<p>Second question: do they serve them in the same proportions?</p>
		<p class="formula">
			BC = &sum; |a<sub>i</sub> - b<sub>i</sub>| / &sum; (a<sub>i</sub> + b<sub>i</sub>)
		</p>
		<p>
			On relative abundances this reduces to something readable straight off the chart. The solid
			blocks are min(a<sub>i</sub>, b<sub>i</sub>), the share of a night the two shops genuinely have
			in common. They total 21%, and Bray-Curtis is one minus that: 0.79.
		</p>
		<p>
			The original Vinnie's sells plain cheese. Uptown sells vodka slices and grandma slices to a
			neighbourhood that wants them. Same board, different restaurant, and only one of the two
			metrics noticed.
		</p>
	</Step>

	<Step index={3}>
		<p>
			Neither metric is the right one, because they answer different questions. Jaccard weights a
			type that sold once the same as one that sold two hundred times, which makes it sensitive to
			sequencing depth: a shallow run misses rare things and reports a smaller intersection.
			Bray-Curtis is driven by the abundant end and barely registers the tail at all.
		</p>
		<p>
			Sono Pizzeria against Forno Sperimentale, now on screen, is the ordinary case: eight types in
			common, four unique to Sono's and six to Forno's, giving Jaccard 0.56 and Bray-Curtis 0.71.
		</p>
		<p>
			The degenerate case is worth knowing too. Vinnie's against Sono's shares not a single pizza
			type, so both metrics return exactly 1.00 and neither can say anything further. Two samples
			with nothing in common are equally distant however differently they have nothing in common.
		</p>
	</Step>
</Scroller>
