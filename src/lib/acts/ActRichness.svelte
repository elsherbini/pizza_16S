<script lang="ts">
	import RichnessCompare from '$lib/charts/RichnessCompare.svelte';
	import { act } from '$lib/content/index';
	import { hero } from '$lib/data/index';
	import Scroller from '$lib/scroll/Scroller.svelte';
	import Step from '$lib/scroll/Step.svelte';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	const content = act('richness');
	const shops = [hero('vinnies'), hero('sono'), hero('ginos')];
	let step = $state(0);
</script>

<ActHeader act={content} />

<Scroller bind:active={step}>
	{#snippet graphic(active)}
		<RichnessCompare {shops} stage={active} />
	{/snippet}

	{#each content.blocks as html, i (i)}
		<Step index={i}>{@html html}</Step>
	{/each}
</Scroller>
