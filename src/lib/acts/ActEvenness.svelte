<script lang="ts">
	import DiversityProfile from '$lib/charts/DiversityProfile.svelte';
	import RankAbundance from '$lib/charts/RankAbundance.svelte';
	import { act } from '$lib/content/index';
	import { hero } from '$lib/data/index';
	import Scroller from '$lib/scroll/Scroller.svelte';
	import Step from '$lib/scroll/Step.svelte';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	const content = act('evenness');
	const shops = [hero('vinnies'), hero('sono'), hero('ginos')];
	let step = $state(0);
	let q = $state(1);
</script>

<ActHeader act={content} />

<Scroller bind:active={step}>
	{#snippet graphic(active)}
		{#if active >= 3}
			<DiversityProfile {shops} bind:q />
		{:else}
			<RankAbundance {shops} stage={active} />
		{/if}
	{/snippet}

	{#each content.blocks as html, i (i)}
		<Step index={i}>{@html html}</Step>
	{/each}
</Scroller>
