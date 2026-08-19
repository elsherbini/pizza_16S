/**
 * The prose tests all route through `quotes()`, so a bug in it would let every
 * stale sentence in the piece pass unnoticed.
 */

import { describe, expect, test } from 'vitest';
import { quotes } from './quoted';

describe('the prose-quote assertion', () => {
	test('accepts a sentence that is in the story', () => {
		expect(() => quotes('Twelve, twelve, and five')).not.toThrow();
	});

	test('accepts one that the markdown happens to wrap mid-sentence', () => {
		expect(() => quotes('the register\n\t\tprints 240 tickets')).not.toThrow();
	});

	test('rejects one that is not there', () => {
		expect(() => quotes('Thirteen, thirteen, and six')).toThrow(/story\.md/);
	});
});
