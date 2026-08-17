<script lang="ts">
	import DiversityProfile from '$lib/charts/DiversityProfile.svelte';
	import RankAbundance from '$lib/charts/RankAbundance.svelte';
	import { hero } from '$lib/data/index';
	import Scroller from '$lib/scroll/Scroller.svelte';
	import Step from '$lib/scroll/Step.svelte';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	const shops = [hero('vinnies'), hero('sono'), hero('ginos')];
	let step = $state(0);
	let q = $state(1);
</script>

<ActHeader
	act="Act 2"
	title="Eighty percent plain cheese"
	standfirst="Shannon, Simpson, Pielou, and the one number that reconciles them."
/>

<Scroller bind:active={step}>
	{#snippet graphic(active)}
		{#if active >= 3}
			<DiversityProfile {shops} bind:q />
		{:else}
			<RankAbundance {shops} stage={active} />
		{/if}
	{/snippet}

	<Step index={0}>
		<p>
			The same three shops as rank-abundance profiles: every pizza type is a bar, longest first, all
			three panels on one shared scale.
		</p>
		<p>
			The shapes are what matter. Vinnie's falls off a cliff after its first bar, Sono's steps down
			gently across all twelve, and Gino's is short and flat.
		</p>
	</Step>

	<Step index={1}>
		<p>
			Suppose you stood at the counter and tried to guess what the next ticket would say. At Vinnie's
			you would be right most of the time; at Sono's you would rarely be. Shannon's index measures
			that uncertainty.
		</p>
		<p class="formula">H' = -&sum; p<sub>i</sub> ln p<sub>i</sub></p>
		<p>
			<em>p<sub>i</sub></em> is the share of tickets going to type <em>i</em>. When one pizza takes
			almost everything you will guess right nearly every time, so H' is small. When all twelve types
			sell equally you are guessing among twelve, and H' reaches its ceiling of ln 12, about 2.48.
		</p>
		<p>
			Sono's scores 2.45, close to that ceiling. Vinnie's scores 0.91 with exactly the same twelve
			types on the board.
		</p>
	</Step>

	<Step index={2}>
		<p>
			Imagine two customers walking into the same pizzeria and ordering without consulting each
			other. How often would they order the same pizza?
		</p>
		<p class="formula">D = &sum; p<sub>i</sub><sup>2</sup></p>
		<p>
			That probability is Simpson's index. At Vinnie's, 0.64: nearly two thirds of customer pairs
			match, and almost always on plain cheese. At Sono's, 0.09. Some tools report 1 - D instead and
			call that Simpson diversity, and scikit-bio reserves the name <code>simpson</code> for that
			form while calling the sum of squares <code>dominance</code>. Check which one your pipeline
			means before comparing anything.
		</p>
		<p>
			How level is a shop's profile once richness is set aside? Pielou's evenness answers by dividing
			Shannon by its maximum, J' = H' / ln S, leaving only how evenly the tickets spread across
			whatever types are on the board. Gino's five types score 1.00. Vinnie's twelve
			score 0.36.
		</p>
	</Step>

	<Step index={3}>
		<p>
			Which of those three numbers should you report? Shannon is in nats, Simpson is a probability,
			Pielou is a ratio, and none of them lets you say that one shop is twice as diverse as another.
		</p>
		<p>Hill numbers put all three on one scale, the effective number of types.</p>
		<p class="formula">
			<sup>q</sup>D = ( &sum; p<sub>i</sub><sup>q</sup> )<sup>1/(1-q)</sup>
		</p>
		<p>
			Read it as a question: if this shop sold every pizza at the same rate, how many would it need
			on the board to feel as varied as it does?
		</p>
		<p>
			Drag <em>q</em>. At q = 0 the answer is richness again. At q = 1 the curve passes through
			exp(H'). At q = 2 it lands on 1/D, the inverse Simpson. Vinnie's twelve types are worth 12 at q = 0, about 2.5 by q = 1, and 1.6 by q = 2, because it stocks
			twelve and runs on one.
		</p>
	</Step>
</Scroller>
