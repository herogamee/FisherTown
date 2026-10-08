import { rm, stat } from 'node:fs/promises';
const webp = new URL('../dist/assets/generated/bg_thailand_sunset.webp', import.meta.url);
const original = new URL('../dist/assets/generated/bg_thailand_sunset.png', import.meta.url);
const output = await stat(webp).catch(() => null);
if (!output || output.size < 12_000) {
  throw new Error('Production WebP missing; refusing to remove original');
}
await rm(original, { force: true });
console.log('[FisherTown art] Dist contains optimized background; redundant 2.8MB PNG removed.');
