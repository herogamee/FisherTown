import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';

const outRoot = new URL('../public/assets/generated/', import.meta.url);
const assets = {
  bg_thailand_sunset: 'bg_thailand_sunset.webp',
  fish_snakehead: 'fish_snakehead.webp',
  fish_silver_barb: 'fish_silver_barb.webp'
};

await mkdir(outRoot, { recursive: true });

for (const [folder, outputName] of Object.entries(assets)) {
  const sourceDir = new URL(`../asset-source/generated/${folder}/`, import.meta.url);
  const chunks = (await readdir(sourceDir))
    .filter((name) => name.endsWith('.txt'))
    .sort();

  if (chunks.length === 0) {
    throw new Error(`No generated-art chunks found for ${folder}`);
  }

  const encoded = [];
  for (const chunk of chunks) {
    encoded.push((await readFile(new URL(chunk, sourceDir), 'utf8')).trim());
  }

  const bytes = Buffer.from(encoded.join(''), 'base64');
  if (bytes.length < 1024) {
    throw new Error(`Decoded asset ${folder} is unexpectedly small`);
  }

  await writeFile(new URL(outputName, outRoot), bytes);
  console.log(`[assets] ${outputName}: ${bytes.length} bytes from ${chunks.length} chunks`);
}
