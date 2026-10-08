import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';

const read = async (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');
const [scene, actor, fishData, index, css, main, manifestRaw] = await Promise.all([
  'src/game/FishingScene.ts',
  'src/game/systems/FishActor.ts',
  'src/game/data/fish.ts',
  'index.html',
  'src/style.css',
  'src/main.ts',
  'public/manifest.webmanifest'
].map(read));

const expectedUI = ['mobile-catch', 'mobile-catch-art', 'mobile-catch-species',
  'mobile-catch-measures', 'quality-select', 'quality-info'];
for (const id of expectedUI) assert.ok(index.includes('id="' + id + '"'), 'Missing new UI #' + id);
assert.ok(main.includes('Phaser.Scale.RESIZE'), 'Game canvas still locked to 16:9');
assert.ok(css.includes('55dvh'), 'Portrait world is still only a letterboxed thumbnail');

const requiredScene = [
  'preload(): void', 'private createFishPopulation(',
  'private createFishingGear(', 'private createControls(',
  'private detectBites(', 'private tryHook(', 'private updateFight(',
  'private completeCatch(', 'private showCatchCard(',
  'private closeCatchCard(', 'private attachMobileControls(',
  'private emitMobileState(', 'private configureViewport(', 'private updatePerformance(',
  'private updateViewport(', 'this.load.svg(', "bg-thailand-sunset"
];
assert.ok(scene.length > 21000, 'FishingScene appears truncated');
for (const token of requiredScene) {
  assert.ok(scene.includes(token), 'FishingScene missing ' + token);
}
assert.ok(!scene.includes("void {\\n"), 'FishingScene contains literal backslash-n code');
assert.ok(actor.includes('this.art.setDisplaySize('), 'FishActor does not use illustrated fish textures');
assert.ok(actor.includes('private drawBody('), 'Missing fallback when asset fails');
assert.ok(!actor.endsWith('\\n}'), 'FishActor contains invalid literal backslash-n at EOF');

const speciesSection = fishData.split('export const BAITS')[0];
const ids = [...speciesSection.matchAll(/\bid:\s*'([^']+)'/g)].map(match => match[1]);
assert.equal(ids.length, 10, 'Expect ten fish species from the prototype');

const artRoot = new URL('../public/assets/fish/', import.meta.url);
const entries = await readdir(artRoot);
for (const id of ids) {
  const name = id + '.svg';
  assert.ok(entries.includes(name), 'Missing unique artwork for ' + id);
  const svg = await readFile(new URL(name, artRoot), 'utf8');
  assert.ok(svg.includes('<svg ') && svg.includes('</svg>'), 'SVG markup missing for ' + id);
  assert.ok(svg.includes(id), 'Artwork lacks species identification for ' + id);
  assert.ok(!/https?:\/\//.test(svg.replace('http://www.w3.org/2000/svg', '')),
    'External asset dependency in SVG: ' + id);
}

const bg = await stat(new URL('../public/assets/generated/bg_thailand_sunset.png', import.meta.url));
assert.ok(bg.size > 100_000, 'Background appears missing/truncated');
for (const id of [
  'game', 'game-frame', 'fullscreen-button', 'mobile-panel', 'mobile-cast',
  'mobile-hook', 'mobile-reel', 'mobile-release', 'mobile-meter',
  'mobile-title', 'mobile-hint', 'mobile-catches', 'mobile-discovered'
]) assert.ok(index.includes('id="' + id + '"'), 'HTML missing #' + id);
assert.ok(index.includes('data-bait="worm"') && index.includes('data-bait="small-fish"') &&
  index.includes('data-bait="spinner"'), 'Bait controls incomplete');
assert.ok(css.includes('@media(orientation:portrait)') &&
  css.includes('overflow-y:auto'), 'Portrait controls are not scrollable');
assert.ok(main.includes("hold(cast, 'castDown', 'castUp')") &&
  main.includes("hold(reel, 'reelDown', 'reelUp')"), 'Touch hold/release wiring missing');
assert.equal(JSON.parse(manifestRaw).orientation, 'any', 'PWA would force landscape');

console.log('PASS FisherTown integrity: 10 individual SVG species assets, background, full fishing loop, portrait controls, fullscreen, PWA orientation.');

assert.ok(scene.includes('bg_thailand_sunset.webp'), 'Runtime not using optimized WebP');
assert.ok(actor.includes('this.art.setDisplaySize('), 'Species texture art renderer regressed');

const sunnyFiles = [
  'sunny-bay/index.html', 'sunny-bay/style.css', 'sunny-bay/game.js',
  'sunny-bay/assets/sunny-bay-scene.webp',
  'sunny-bay/assets/sunny-logo.webp',
  'sunny-bay/assets/silver-barb.svg',
  'sunny-bay/assets/snakehead.svg',
  'sunny-bay/assets/catfish.svg',
  'sunny-bay/assets/featherback.svg'
];
for (const file of sunnyFiles) {
  const fileInfo = await stat(new URL('../' + file, import.meta.url)).catch(() => null);
  assert.ok(fileInfo && fileInfo.size >= 200, 'Sunny Bay asset missing/empty: ' + file);
}
const sunnyHTML = await read('sunny-bay/index.html');
const sunnyGame = await read('sunny-bay/game.js');
for (const name of ['cast', 'hook', 'reel', 'release', 'bottom-nav', 'modal']) {
  assert.ok(sunnyHTML.includes('id="' + name + '"') || sunnyHTML.includes('class="' + name + '"'),
    'Sunny Bay missing input/UI ' + name);
}
for (const action of ['startCast(', 'finishCast(', 'triggerBite(', 'hook(', 'land(', 'release(', 'recordCatch(']) {
  assert.ok(sunnyGame.includes(action), 'Sunny Bay fishing gameplay regressed: ' + action);
}
assert.ok(index.includes('?classic=1') && index.includes('./sunny-bay/'),
  'Default home must open Sunny Bay, preserving Classic via query');
console.log('PASS Sunny Bay visual release: static art, playable controls, phases and Classic fallback');
