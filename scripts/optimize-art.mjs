import sharp from 'sharp';
import { stat, mkdir } from 'node:fs/promises';

const source = new URL('../public/assets/generated/bg_thailand_sunset.png', import.meta.url);
const output = new URL('../public/assets/generated/bg_thailand_sunset.webp', import.meta.url);
const original = await stat(source).catch(() => null);
if (!original || original.size < 100_000) {
  throw new Error('Cannot optimize: generated sunset PNG is missing or truncated');
}
await mkdir(new URL('../public/assets/generated/', import.meta.url), { recursive: true });
const asset = sharp(source, { failOn: 'error' }).rotate();
const { width, height } = await asset.metadata();
if (!width || !height || width < 900 || height < 500) {
  throw new Error('Invalid sunset illustration geometry: ' + width + 'x' + height);
}
await asset
  .resize({ width: 1280, height: 720, fit: 'cover', position: 'centre', withoutEnlargement: false })
  .webp({ quality: 83, effort: 5 })
  .toFile(output);
const compressed = await stat(output);
if (compressed.size < 12_000) throw new Error('Compressed background is suspiciously small');
console.log('[FisherTown art] Original PNG ' + original.size +
  ' bytes, optimized WebP ' + compressed.size + ' bytes. ' +
  Math.round((1 - compressed.size / original.size) * 100) + '% reduction.');
