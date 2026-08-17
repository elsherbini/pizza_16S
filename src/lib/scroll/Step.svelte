<script lang="ts">
	import { getContext, type Snippet } from 'svelte';
	import { SCROLLER_KEY, type ScrollerContext } from './context';

	interface Props {
		index: number;
		children: Snippet;
	}

	let { index, children }: Props = $props();

	const scroller = getContext<ScrollerContext>(SCROLLER_KEY);
	let element = $state<HTMLElement>();

	$effect(() => {
		const node = element;
		if (!node) return;

		// A narrow band across the middle of the viewport: a step becomes active
		// when its text is where the reader is actually looking.
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) scroller.activate(index);
				}
			},
			{ rootMargin: '-48% 0px -48% 0px', threshold: 0 }
		);

		observer.observe(node);
		return () => observer.disconnect();
	});
</script>

<div bind:this={element} class="step prose-column">
	{@render children()}
</div>

<style>
	.step {
		min-height: 78vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 2rem 0;
	}

	/*
	 * The final step keeps the same height as the rest. The breathing room after
	 * it lives on the track itself, so the last transition has time to settle
	 * before the next act scrolls into view.
	 */
</style>
