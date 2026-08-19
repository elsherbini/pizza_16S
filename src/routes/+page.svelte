<script lang="ts">
	import ActSnapshot from '$lib/acts/ActSnapshot.svelte';
	import ActRichness from '$lib/acts/ActRichness.svelte';
	import ActEvenness from '$lib/acts/ActEvenness.svelte';
	import ActRarefaction from '$lib/acts/ActRarefaction.svelte';
	import ActBeta from '$lib/acts/ActBeta.svelte';
	import ActMatrix from '$lib/acts/ActMatrix.svelte';
	import ActPcoa from '$lib/acts/ActPcoa.svelte';
	import ActNmds from '$lib/acts/ActNmds.svelte';
	import ActReading from '$lib/acts/ActReading.svelte';
	import ActCoda from '$lib/acts/ActCoda.svelte';
	import { story } from '$lib/content/index';
</script>

<svelte:head>
	<title>{story.hero.title}</title>
	<meta name="description" content={story.description} />
</svelte:head>

<main>
	<section class="hero">
		<div class="inner">
			<h1>{story.hero.title}</h1>
			<p class="deck">{story.hero.deck}</p>
			<p class="byline ui">{story.hero.byline}</p>
		</div>
	</section>

	<ActSnapshot />
	<ActRichness />
	<ActEvenness />
	<ActRarefaction />
	<ActBeta />
	<ActMatrix />
	<ActPcoa />
	<ActNmds />
	<ActReading />
	<ActCoda />
</main>

<style>
	main {
		background: var(--plane);
	}

	.hero {
		min-height: 88vh;
		display: flex;
		align-items: center;
		padding: 4rem 1.25rem;
	}

	.inner {
		max-width: 40rem;
		margin: 0 auto;
	}

	h1 {
		font-size: clamp(2.5rem, 7vw, 4.5rem);
		line-height: 1.02;
		letter-spacing: -0.03em;
		margin: 0;
		font-weight: 600;
	}

	.deck {
		margin: 1.5rem 0 0;
		font-size: clamp(1.1rem, 2vw, 1.3rem);
		line-height: 1.5;
		max-width: 32rem;
		color: var(--ink-secondary);
	}

	.byline {
		margin: 2.5rem 0 0;
		font-size: 0.8125rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-muted);
	}
</style>
