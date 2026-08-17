<script lang="ts">
	import RarefactionChart from '$lib/charts/RarefactionChart.svelte';
	import { heroShops } from '$lib/data/index';
	import Scroller from '$lib/scroll/Scroller.svelte';
	import Step from '$lib/scroll/Step.svelte';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	let step = $state(0);
	let depth = $state(34);
</script>

<ActHeader
	act="Act 3"
	title="A slow Tuesday"
	standfirst="Rarefaction, Good's coverage, and why unequal sequencing depth ruins a comparison."
/>

<Scroller bind:active={step}>
	{#snippet graphic(active)}
		<RarefactionChart shops={heroShops} stage={active} bind:depth />
	{/snippet}

	<Step index={0}>
		<p>
			Richness depends on how long you watched. Read a shop's tickets one at a time and plot how many
			distinct pizza types you have seen after each one, and you get a
			<strong>rarefaction curve</strong>.
		</p>
		<p>
			These are computed analytically, the way <code>vegan::rarefy</code> does it, from Hurlbert's 1971
			expectation rather than by repeated random subsampling. There is no seed and no simulation noise
			in them.
		</p>
	</Step>

	<Step index={1}>
		<p>
			Every curve stops where that shop's night stopped. Vinnie's read 240 tickets and went flat
			somewhere around a hundred, having by then seen everything it sells. Forno Sperimentale closed
			after 34 tickets with its curve still climbing at the moment it was cut off.
		</p>
		<p>
			Forno's observed richness is 14; Vinnie's is 12. Taken at face value those are nearly the same
			shop.
		</p>
	</Step>

	<Step index={2}>
		<p>
			They are not. Pull the depth back to 34 tickets, the most that all five shops can supply, and
			read the curves where that line crosses them.
		</p>
		<p>
			Forno still has 14, because 34 tickets is all it ever had. Vinnie's drops to 5.3, because a
			random 34 of its tickets would be almost nothing but plain cheese.
		</p>
		<p>
			At equal effort Forno is roughly two and a half times as rich. Observed richness hid that, and
			it hid it in the direction that flatters whichever sample was sequenced more deeply.
		</p>
	</Step>

	<Step index={3}>
		<p>Good's coverage estimates how much of a community you have already met.</p>
		<p class="formula">C = 1 - F<sub>1</sub> / N</p>
		<p>
			F<sub>1</sub> is the number of types ordered exactly once. Nine of Forno's fourteen types sold a
			single slice out of 34 tickets, which puts its coverage at 73.5%. Something like a quarter of
			the next customers through that door would order a pizza it has no record of tonight. Vinnie's,
			at 98.3%, has finished discovering itself.
		</p>
		<p>
			What to do about uneven depth is genuinely contested. Rarefying to a common depth, as above,
			discards real observations, and McMurdie and Holmes argued in 2014 that doing so is
			inadmissible. The alternatives, scaling factors and variance-stabilising transformations, carry
			assumptions of their own. The one indefensible option is comparing raw richness across samples
			sequenced to different depths, which is exactly what the 14-versus-12 reading was.
		</p>
	</Step>
</Scroller>
