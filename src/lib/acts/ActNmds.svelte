<script lang="ts">
	import OrdinationPlot from '$lib/charts/OrdinationPlot.svelte';
	import ShepardPlot from '$lib/charts/ShepardPlot.svelte';
	import { act } from '$lib/content/index';
	import Scroller from '$lib/scroll/Scroller.svelte';
	import Step from '$lib/scroll/Step.svelte';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	const content = act('nmds');
	let step = $state(0);
</script>

<ActHeader act={content} />

<Scroller bind:active={step}>
	{#snippet graphic(active)}
		{#if active === 0}
			<OrdinationPlot method="nmds" metric="bray" stage={3} />
		{:else}
			<ShepardPlot stage={active - 1} />
		{/if}
	{/snippet}

	{#each content.blocks as html, i (i)}
		<Step index={i}>{@html html}</Step>
	{/each}
</Scroller>
