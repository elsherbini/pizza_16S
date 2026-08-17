<script lang="ts">
	/**
	 * A sticky graphic with text steps scrolling past it.
	 *
	 * The graphic snippet receives the index of the step currently in the
	 * reading band, so a visualisation transitions between states rather than
	 * being swapped out. With reduced motion the layout still works: the
	 * graphic stays pinned, it simply stops animating between states.
	 */
	import { setContext, type Snippet } from 'svelte';
	import { SCROLLER_KEY, type ScrollerContext } from './context';

	interface Props {
		/** Rendered inside the sticky panel, given the active step index. */
		graphic: Snippet<[number]>;
		/** The `<Step>` elements. */
		children: Snippet;
		active?: number;
		/** Put the graphic on the left instead of the right. */
		graphicFirst?: boolean;
	}

	let { graphic, children, active = $bindable(0), graphicFirst = true }: Props = $props();

	const context: ScrollerContext = {
		activate: (index: number) => {
			active = index;
		}
	};
	setContext(SCROLLER_KEY, context);
</script>

<div class="scroller" class:graphic-first={graphicFirst}>
	<div class="graphic-track">
		<div class="graphic-pane">
			{@render graphic(active)}
		</div>
	</div>
	<div class="steps">
		{@render children()}
	</div>
</div>

<style>
	.scroller {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0;
		align-items: start;
	}

	/*
	 * On narrow screens the pane takes its height from the graphic rather than a
	 * fixed slice of the viewport, so a short chart does not leave a band of
	 * empty page above the text. `max-height` still keeps a tall one from
	 * swallowing the screen.
	 */
	.graphic-track {
		position: sticky;
		top: 0;
		z-index: 1;
		max-height: 62vh;
		background: var(--plane);
		border-bottom: 1px solid var(--hairline);
	}

	.graphic-pane {
		max-height: 62vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 1rem;
		overflow: hidden;
	}

	.steps {
		position: relative;
		z-index: 0;
		padding: 2rem 1.25rem 0;
	}

	@media (min-width: 60rem) {
		.scroller {
			grid-template-columns: minmax(0, 1.35fr) minmax(22rem, 0.85fr);
			column-gap: 3rem;
		}

		.scroller.graphic-first .graphic-track {
			order: 0;
		}

		.graphic-track {
			height: 100vh;
			max-height: none;
			border-bottom: none;
		}

		.graphic-pane {
			height: 100%;
			max-height: none;
			padding: 3rem 1rem 3rem 2rem;
		}

		.steps {
			padding: 0 2rem 0 0;
		}
	}
</style>
