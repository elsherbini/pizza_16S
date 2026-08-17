<script lang="ts">
	/**
	 * Every chart at every stage on one static page. Not linked from the piece;
	 * it exists so the visualisations can be reviewed without scrolling through
	 * eight acts to reach one of them.
	 */
	import DiversityProfile from '$lib/charts/DiversityProfile.svelte';
	import DistanceHeatmap from '$lib/charts/DistanceHeatmap.svelte';
	import OrdinationPlot from '$lib/charts/OrdinationPlot.svelte';
	import PairCompare from '$lib/charts/PairCompare.svelte';
	import RankAbundance from '$lib/charts/RankAbundance.svelte';
	import RarefactionChart from '$lib/charts/RarefactionChart.svelte';
	import RichnessCompare from '$lib/charts/RichnessCompare.svelte';
	import ShepardPlot from '$lib/charts/ShepardPlot.svelte';
	import TicketWall from '$lib/charts/TicketWall.svelte';
	import { hero, heroShops } from '$lib/data/index';

	const vinnies = hero('vinnies');
	const three = [hero('vinnies'), hero('sono'), hero('ginos')];
</script>

<svelte:head><title>Chart gallery</title></svelte:head>

<main>
	<h1>Chart gallery</h1>

	{#each [0, 1, 2, 3] as stage (stage)}
		<section><h2>TicketWall stage {stage}</h2><TicketWall shop={vinnies} {stage} /></section>
	{/each}

	{#each [0, 1, 2] as stage (stage)}
		<section><h2>RichnessCompare stage {stage}</h2><RichnessCompare shops={three} {stage} /></section>
	{/each}

	{#each [0, 1, 2] as stage (stage)}
		<section><h2>RankAbundance stage {stage}</h2><RankAbundance shops={three} {stage} /></section>
	{/each}

	<section><h2>DiversityProfile</h2><DiversityProfile shops={three} /></section>

	{#each [0, 1, 2, 3] as stage (stage)}
		<section>
			<h2>RarefactionChart stage {stage}</h2>
			<RarefactionChart shops={heroShops} {stage} />
		</section>
	{/each}

	{#each [0, 1, 2] as stage (stage)}
		<section>
			<h2>PairCompare stage {stage}</h2>
			<PairCompare a={hero('vinnies')} b={hero('vinnies_uptown')} {stage} />
		</section>
	{/each}

	<section>
		<h2>PairCompare, partial overlap</h2>
		<PairCompare a={hero('sono')} b={hero('forno')} stage={2} />
	</section>

	{#each [0, 1, 2] as stage (stage)}
		<section><h2>DistanceHeatmap stage {stage}</h2><DistanceHeatmap {stage} /></section>
	{/each}

	{#each [0, 1, 2, 3] as stage (stage)}
		<section>
			<h2>OrdinationPlot PCoA stage {stage}</h2>
			<OrdinationPlot method="pcoa" metric="bray" {stage} />
		</section>
	{/each}

	<section><h2>OrdinationPlot NMDS</h2><OrdinationPlot method="nmds" metric="bray" stage={3} /></section>
	<section>
		<h2>OrdinationPlot Jaccard, with controls</h2>
		<OrdinationPlot method="pcoa" metric="jaccard" stage={3} showControls />
	</section>

	{#each [0, 1, 2] as stage (stage)}
		<section><h2>ShepardPlot stage {stage}</h2><ShepardPlot {stage} /></section>
	{/each}
</main>

<style>
	main {
		padding: 2rem;
		background: var(--plane);
	}

	h1 {
		font-family: var(--font-ui);
		font-size: 1.2rem;
	}

	section {
		margin: 2rem 0 3rem;
		padding: 1.25rem;
		background: var(--surface);
		border: 1px solid var(--hairline);
		border-radius: 0.5rem;
	}

	h2 {
		font-family: var(--font-ui);
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--ink-muted);
		margin: 0 0 1rem;
	}
</style>
