<script lang="ts">
	import OrdinationPlot from '$lib/charts/OrdinationPlot.svelte';
	import { act } from '$lib/content/index';
	import Scroller from '$lib/scroll/Scroller.svelte';
	import Step from '$lib/scroll/Step.svelte';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	const content = act('reading');
	let step = $state(0);
	let method = $state<'pcoa' | 'nmds'>('pcoa');
	let metric = $state<'bray' | 'jaccard'>('bray');

	// The metric switch is the point of this act, so drive it from the scroll
	// and leave the controls live for anyone who wants to poke at it.
	$effect(() => {
		metric = step >= 1 ? 'jaccard' : 'bray';
	});
</script>

<ActHeader act={content} />

<Scroller bind:active={step}>
	{#snippet graphic()}
		<OrdinationPlot bind:method bind:metric stage={3} showControls />
	{/snippet}

	{#each content.blocks as html, i (i)}
		<Step index={i}>{@html html}</Step>
	{/each}
</Scroller>
