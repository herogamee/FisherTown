import { cp, rm, stat } from 'node:fs/promises';
const webp = new URL('../dist/assets/generated/bg_thailand_sunset.webp', import.meta.url);
const original = new URL('../dist/assets/generated/bg_thailand_sunset.png', import.meta.url);
const output = await stat(webp).catch(() => null);
if (!output || output.size < 12_000) {
  throw new Error('Production WebP missing; refusing to remove original');
}
await rm(original, { force: true });
console.log('[FisherTown art] Dist contains optimized background; redundant 2.8MB PNG removed.');

const source = new URL('../sunny-bay/', import.meta.url);
const destination = new URL('../dist/sunny-bay/', import.meta.url);
await cp(source, destination, { recursive: true, force: true });
for (const file of ['index.html', 'style.css', 'game.js', 'assets/sunny-bay-scene.webp', 'assets/sunny-logo.webp']) {
  const path = new URL(file, destination);
  const copied = await stat(path).catch(() => null);
  if (!copied || copied.size < 150) throw new Error('Missing Sunny Bay dist asset: ' + file);
}
console.log('[FisherTown Sunny Bay] Playable static scene copied to dist/sunny-bay');
