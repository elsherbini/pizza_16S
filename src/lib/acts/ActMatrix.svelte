<script lang="ts">
	import DistanceHeatmap from '$lib/charts/DistanceHeatmap.svelte';
	import { act } from '$lib/content/index';
	import Scroller from '$lib/scroll/Scroller.svelte';
	import Step from '$lib/scroll/Step.svelte';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	const content = act('matrix');
	let step = $state(0);
</script>

<ActHeader act={content} />

<Scroller bind:active={step}>
	{#snippet graphic(active)}
		<DistanceHeatmap stage={active} />
	{/snippet}

	{#each content.blocks as html, i (i)}
		<Step index={i}>{@html html}</Step>
	{/each}
</Scroller>
