<script lang="ts">
	import ActSnapshot from '$lib/acts/ActSnapshot.svelte';
	import ActRichness from '$lib/acts/ActRichness.svelte';
	import ActEvenness from '$lib/acts/ActEvenness.svelte';
	import ActRarefaction from '$lib/acts/ActRarefaction.svelte';
	import ActBeta from '$lib/acts/ActBeta.svelte';
</script>

<svelte:head>
	<title>Pizza, alpha and beta</title>
	<meta
		name="description"
		content="Alpha diversity, beta diversity, and ordination in microbial ecology, explained with pizzerias."
	/>
</svelte:head>

<main>
	<section class="hero">
		<div class="inner">
			<h1>Pizza, alpha and beta</h1>
			<p class="deck">
				Every diversity metric in microbial ecology is a way of comparing restaurants you are not
				allowed to walk into. You get one night of receipts and nothing else.
			</p>
			<p class="byline ui">A scrolling explainer. Scroll to begin.</p>
		</div>
	</section>

	<ActSnapshot />
	<ActRichness />
	<ActEvenness />
	<ActRarefaction />
	<ActBeta />
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
