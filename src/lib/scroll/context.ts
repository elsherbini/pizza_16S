export const SCROLLER_KEY = Symbol('scroller');

export interface ScrollerContext {
	activate: (index: number) => void;
}
