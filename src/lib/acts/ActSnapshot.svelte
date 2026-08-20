<script lang="ts">
	import TicketWall from '$lib/charts/TicketWall.svelte';
	import { hero } from '$lib/data/index';
	import Scroller from '$lib/scroll/Scroller.svelte';
	import Step from '$lib/scroll/Step.svelte';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	const vinnies = hero('vinnies');
	let step = $state(0);
</script>

<ActHeader
	act="Act 0"
	title="The Friday night snapshot"
	standfirst="Where a count table comes from, and what it leaves out."
/>

<Scroller bind:active={step}>
	{#snippet graphic(active)}
		<TicketWall shop={vinnies} stage={active} />
	{/snippet}

	<Step index={0}>
		<p>
			It is seven o'clock on a Friday at Vinnie's Slice Shop in Bay Ridge, and over the next four
			hours the register prints 240 tickets. Each ticket is one order: one pizza, one customer, one
			moment.
		</p>
		<p>
			In microbial ecology this pile of paper is a <strong>sample</strong>, and the pizzeria it came
			from is the community you are trying to describe.
		</p>
	</Step>

	<Step index={1}>
		<p>
			Read what is printed on each ticket and you learn which pizza it was: Margherita, plain cheese,
			grandma slice.
		</p>
		<p>
			The name is all you get. It says nothing about whether the mozzarella was buffalo or cow, or
			where the tomatoes were grown. A 16S read works the same way, handing you a label from a
			reference database and stopping there. The kitchen inventory, every ingredient in what
			quantity, is shotgun metagenomics, and it costs considerably more.
		</p>
	</Step>

	<Step index={2}>
		<p>
			Sort the tickets into a column for each pizza type. Nothing has been added and nothing thrown
			away; the same 240 tickets are standing in different piles.
		</p>
	</Step>

	<Step index={3}>
		<p>
			Count each column and you have the row that every method here consumes: a <strong
				>count vector</strong
			>, one number per pizza type, summing to the number of tickets you read.
		</p>
		<p>
			Stack a few of those rows and you have a count table, samples down the side and types across
			the top. It is <code>otu_table</code> in phyloseq, a <code>FeatureTable[Frequency]</code> in
			QIIME 2, the object DADA2 hands you at the end of a run.
		</p>
		<p>
			One caution before going further. You are looking at orders, not at the menu. Vinnie's may
			stock a pizza nobody happened to order tonight, and in this table that pizza is
			indistinguishable from one he has never made. Every worry in the rest of this piece grows out
			of that gap.
		</p>
	</Step>
</Scroller>
