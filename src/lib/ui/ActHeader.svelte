<script lang="ts">
	import type { Act } from '$lib/content/index';

	interface Props {
		act: Act;
	}

	let { act }: Props = $props();
</script>

<header class="act-header">
	<div class="inner">
		<p class="act-number ui">{act.label}</p>
		<h2>{act.title}</h2>
		{#if act.standfirst}
			<p class="standfirst">{act.standfirst}</p>
		{/if}
	</div>
</header>

<style>
	.act-header {
		padding: 5.5rem 1.25rem 2.5rem;
		border-top: 1px solid var(--hairline);
	}

	.inner {
		max-width: 34rem;
		margin: 0 auto;
	}

	.act-number {
		font-size: 0.72rem;
		letter-spacing: 0.11em;
		text-transform: uppercase;
		color: var(--ink-muted);
		margin: 0 0 0.5rem;
	}

	h2 {
		font-size: clamp(1.6rem, 3.4vw, 2.25rem);
		line-height: 1.15;
		letter-spacing: -0.015em;
		margin: 0;
		font-weight: 600;
	}

	.standfirst {
		margin: 0.75rem 0 0;
		font-size: 1.0625rem;
		line-height: 1.6;
		color: var(--ink-secondary);
	}
</style>
