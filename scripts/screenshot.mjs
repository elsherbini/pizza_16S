/**
 * Screenshot a page from the running preview server, so charts can be reviewed
 * as rendered rather than as intended.
 *
 *   npm run build && npx vite preview --port 4173 &
 *   node scripts/screenshot.mjs http://localhost:4173/gallery out.png --full
 *
 * Options: --width, --height, --full, --scroll <px>, --dark, --click <sel>, --selector <sel>
 */

import { chromium } from 'playwright';

const args = process.argv.slice(2);
const [url, out] = args;
if (!url || !out) {
	console.error('usage: node scripts/screenshot.mjs <url> <out.png> [options]');
	process.exit(1);
}

const flag = (name, fallback) => {
	const i = args.indexOf(`--${name}`);
	return i === -1 ? fallback : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: Number(flag('width', 1400)), height: Number(flag('height', 1000)) },
	deviceScaleFactor: 2,
	colorScheme: has('dark') ? 'dark' : 'light'
});

const errors = [];
page.on('pageerror', (error) => errors.push(String(error)));
page.on('console', (message) => {
	if (message.type() === 'error') errors.push(message.text());
});

await page.goto(url, { waitUntil: 'networkidle' });

const clickTarget = flag('click', null);
if (clickTarget) await page.click(clickTarget);

const scroll = flag('scroll', null);
if (scroll) {
	await page.evaluate((y) => window.scrollTo(0, Number(y)), scroll);
	await page.waitForTimeout(1400);
}

await page.waitForTimeout(1200);

const selector = flag('selector', null);
if (selector) {
	await page.locator(selector).screenshot({ path: out });
} else {
	await page.screenshot({ path: out, fullPage: has('full') });
}
await browser.close();

if (errors.length) {
	console.error(`page errors:\n  ${errors.join('\n  ')}`);
	process.exit(1);
}
console.log(`wrote ${out}`);
