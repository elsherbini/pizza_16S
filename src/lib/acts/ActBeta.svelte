<script lang="ts">
	import PairCompare from '$lib/charts/PairCompare.svelte';
	import { act } from '$lib/content/index';
	import { hero } from '$lib/data/index';
	import Scroller from '$lib/scroll/Scroller.svelte';
	import Step from '$lib/scroll/Step.svelte';
	import ActHeader from '$lib/ui/ActHeader.svelte';

	const content = act('beta');
	const vinnies = hero('vinnies');
	const uptown = hero('vinnies_uptown');
	const sono = hero('sono');
	const forno = hero('forno');

	let step = $state(0);
</script>

<ActHeader act={content} />

<Scroller bind:active={step}>
	{#snippet graphic(active)}
		{#if active >= 3}
			<PairCompare a={sono} b={forno} stage={2} />
		{:else}
			<PairCompare a={vinnies} b={uptown} stage={active} />
		{/if}
	{/snippet}

	{#each content.blocks as html, i (i)}
		<Step index={i}>{@html html}</Step>
	{/each}
</Scroller>
