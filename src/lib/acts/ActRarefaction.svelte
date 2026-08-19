<script lang="ts">
	import RarefactionChart from '$lib/charts/RarefactionChart.svelte';
	import { act } from '$lib/content/index';
	import { heroShops } from '$lib/data/index';
	import Scroller from '$lib/scroll/Scroller.svelte';
	import Step from '$lib/scroll/Step.svelte';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	const content = act('rarefaction');
	let step = $state(0);
	let depth = $state(34);
</script>

<ActHeader act={content} />

<Scroller bind:active={step}>
	{#snippet graphic(active)}
		<RarefactionChart shops={heroShops} stage={active} bind:depth />
	{/snippet}

	{#each content.blocks as html, i (i)}
		<Step index={i}>{@html html}</Step>
	{/each}
</Scroller>
