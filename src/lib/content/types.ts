/** One act of the piece: a header, and a body split into blocks. */
export interface Act {
	/** The anchor on the act's heading, used by the component that renders it. */
	id: string;
	/** "Act 1". */
	label: string;
	title: string;
	standfirst: string;
	/** Rendered HTML, one entry per `---`-separated block of the act's body. */
	blocks: string[];
}

export interface Story {
	/** The page's meta description. */
	description: string;
	hero: { title: string; deck: string; byline: string };
	acts: Act[];
}
