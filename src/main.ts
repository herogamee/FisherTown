import Phaser from 'phaser';
import './style.css';
import { FishingScene } from './game/FishingScene';
import { mountFishdex } from './atlas/fishdex';

type Phase = 'idle' | 'charging' | 'cast' | 'bite' | 'fight' | 'result';
type Action = 'castDown' | 'castUp' | 'hook' | 'reelDown' | 'reelUp' | 'release' | 'bait';
type CatchPreview = {
  speciesId: string; nameTh: string; nameEn: string; scientific: string;
  lengthCm: number; weightKg: number; isNew: boolean; isRecord: boolean;
};
type Quality = 'auto' | 'low' | 'balanced' | 'high';

type FishState = {
 phase: Phase; title: string; hint: string;
 totalCatches: number; discovered: number; speciesTotal: number;
 selectedBait: string; charge: number; tension: number;
 quality: Quality; activeQuality: Exclude<Quality, 'auto'>;
 fps: number; catch: CatchPreview | null; portrait: boolean;
};
function element<T extends HTMLElement>(id: string): T {
 const found = document.getElementById(id);
 if (!found) throw new Error('FisherTown: missing #' + id);
 return found as T;
}

const frame = element<HTMLElement>('game-frame');
const fullscreen = element<HTMLButtonElement>('fullscreen-button');
const fullscreenActive = (): boolean =>
 Boolean(document.fullscreenElement) || document.documentElement.classList.contains('fill-screen');
const syncFullscreen = (): void => {
 const isActive = fullscreenActive();
 fullscreen.textContent = isActive ? '↙' : '⛶';
 fullscreen.title = isActive ? 'ออกจากโหมดเต็มจอ' : 'ขยายเต็มจอ';
 fullscreen.setAttribute('aria-label', fullscreen.title);
};
fullscreen.addEventListener('click', async (event) => {
 event.preventDefault();
 event.stopPropagation();
 if (document.fullscreenElement) {
  await document.exitFullscreen().catch(() => undefined);
  syncFullscreen();
  return;
 }
 if (document.documentElement.classList.contains('fill-screen')) {
  document.documentElement.classList.remove('fill-screen');
  syncFullscreen();
  return;
 }
 try {
  if (frame.requestFullscreen) {
   await frame.requestFullscreen();
   syncFullscreen();
   return;
  }
 } catch {
  // iOS Safari has historically not supported Fullscreen API on ordinary elements.
 }
 document.documentElement.classList.add('fill-screen');
 syncFullscreen();
});
document.addEventListener('fullscreenchange', syncFullscreen);

function command(action: Action, bait?: string): void {
 window.dispatchEvent(new CustomEvent('fishertown:control', { detail: { action, bait } }));
}
const cast = element<HTMLButtonElement>('mobile-cast');
const hook = element<HTMLButtonElement>('mobile-hook');
const reel = element<HTMLButtonElement>('mobile-reel');
const release = element<HTMLButtonElement>('mobile-release');
const baitButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-bait]'));

baitButtons.forEach((button) => {
 button.addEventListener('click', () => {
  if (button.dataset.bait) command('bait', button.dataset.bait);
 });
});
hook.addEventListener('click', () => command('hook'));
release.addEventListener('click', () => command('release'));

// Hold/release works with touch, mouse, pen and keyboard. Pointer capture prevents a
// stuck reel when the finger slides off the button.
function hold(button: HTMLButtonElement, down: Action, up: Action): void {
 let pressed = false;
 const finish = (): void => {
  if (!pressed) return;
  pressed = false;
  command(up);
 };
 button.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || button.disabled) return;
  event.preventDefault();
  pressed = true;
  try { button.setPointerCapture(event.pointerId); } catch { /* Safari fallback */ }
  command(down);
 });
 button.addEventListener('pointerup', finish);
 button.addEventListener('pointercancel', finish);
 button.addEventListener('lostpointercapture', finish);
 button.addEventListener('keydown', (event) => {
  if ((event.key !== ' ' && event.key !== 'Enter') || event.repeat || button.disabled) return;
  event.preventDefault();
  pressed = true;
  command(down);
 });
 button.addEventListener('keyup', (event) => {
  if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); finish(); }
 });
 window.addEventListener('blur', finish);
}
hold(cast, 'castDown', 'castUp');
hold(reel, 'reelDown', 'reelUp');

const title = element<HTMLElement>('mobile-title');
const hint = element<HTMLElement>('mobile-hint');
const catches = element<HTMLElement>('mobile-catches');
const discovered = element<HTMLElement>('mobile-discovered');
const meter = element<HTMLElement>('mobile-meter');
const meterLabel = element<HTMLElement>('mobile-meter-label');
const meterNumber = element<HTMLElement>('mobile-meter-number');
const meterTrack = document.querySelector<HTMLElement>('.mobile-meter-track');
const meterFill = element<HTMLElement>('mobile-meter-value');
const catchCard = element<HTMLElement>('mobile-catch');
const catchSpecies = element<HTMLElement>('mobile-catch-species');
const catchScience = element<HTMLElement>('mobile-catch-scientific');
const catchMeasures = element<HTMLElement>('mobile-catch-measures');
const catchBadges = element<HTMLElement>('mobile-catch-badges');
const catchFish = element<HTMLImageElement>('mobile-catch-art');
const qualitySelect = element<HTMLSelectElement>('quality-select');
const qualityInfo = element<HTMLElement>('quality-info');
const gameHost = element<HTMLElement>('game');
const mobilePanel = element<HTMLElement>('mobile-panel');
let previousPhase: Phase = 'idle';

try {
 const stored = localStorage.getItem('fishertown:quality');
 if (stored === 'low' || stored === 'balanced' || stored === 'high') qualitySelect.value = stored;
} catch { /* Private mode can deny storage */ }

qualitySelect.addEventListener('change', () => {
 const quality = qualitySelect.value as Quality;
 try {
  if (quality === 'auto') localStorage.removeItem('fishertown:quality');
  else localStorage.setItem('fishertown:quality', quality);
 } catch { /* Gameplay never depends on localStorage permissions */ }
 window.dispatchEvent(new CustomEvent('fishertown:quality', { detail: { quality } }));
});

window.addEventListener('fishertown:state', (event: Event) => {
 const state = (event as CustomEvent<FishState>).detail;
 mobilePanel.dataset.phase = state.phase;
 if (state.phase === 'result' && previousPhase !== 'result') {
   mobilePanel.scrollTo({ top: 0, behavior: 'instant' });
 }
 previousPhase = state.phase;
 if (title.textContent !== state.title) title.textContent = state.title;
 if (hint.textContent !== state.hint) hint.textContent = state.hint;
 const total = '🎣 สะสม ' + state.totalCatches + ' ตัว';
 if (catches.textContent !== total) catches.textContent = total;
 const dex = '📖 Fishdex ' + state.discovered + '/' + state.speciesTotal;
 if (discovered.textContent !== dex) discovered.textContent = dex;
 if (qualitySelect.value !== state.quality) qualitySelect.value = state.quality;
 qualityInfo.textContent = state.fps + ' FPS · ' + state.activeQuality.toUpperCase();
 catchCard.hidden = !state.catch;
 if (state.catch) {
  const fish = state.catch;
  if (catchCard.dataset.species !== fish.speciesId) {
   catchCard.dataset.species = fish.speciesId;
   catchFish.src = import.meta.env.BASE_URL + 'assets/fish/' + fish.speciesId + '.svg';
   catchFish.alt = 'ภาพประกอบ ' + fish.nameTh;
   catchSpecies.textContent = fish.nameTh;
   catchScience.textContent = fish.nameEn + ' · ' + fish.scientific;
  }
  catchMeasures.textContent = fish.lengthCm.toFixed(1) + ' ซม.  ·  ' +
    fish.weightKg.toFixed(2) + ' กก.';
  catchBadges.textContent = (fish.isNew ? 'ชนิดปลาใหม่ · ' : '') +
    (fish.isRecord ? 'ทำลายสถิติ! · ' : '') + 'ปล่อยคืนสู่ธรรมชาติ';
 } else {
  delete catchCard.dataset.species;
 }
 const charging = state.phase === 'charging', fighting = state.phase === 'fight';
 meter.hidden = !charging && !fighting;
 if (charging || fighting) {
  const value = Math.max(0, Math.min(100, Math.round(charging ? state.charge * 100 : state.tension)));
  meterLabel.textContent = charging ? 'กำลังเหวี่ยง' : 'แรงตึงสาย (พยายามรักษา 20–82%)';
  meterNumber.textContent = value + '%';
  meterFill.style.width = value + '%';
  meterFill.style.background = fighting && (value > 88 || value < 14) ? '#dc8868' : '';
  meterTrack?.setAttribute('aria-valuenow', String(value));
 }
 const canCast = state.phase === 'idle' || charging || state.phase === 'cast' || state.phase === 'bite';
 cast.disabled = !canCast;
 cast.textContent = charging ? '🎯 ปล่อยนิ้วเพื่อเหวี่ยง' :
  state.phase === 'cast' || state.phase === 'bite' ? '↩ เก็บสาย' : '🎣 กดค้างเพื่อเหวี่ยง';
 hook.disabled = state.phase !== 'bite';
 reel.disabled = !fighting;
 release.hidden = state.phase !== 'result';
 baitButtons.forEach(button => {
  button.disabled = state.phase !== 'idle';
  button.setAttribute('aria-pressed', String(button.dataset.bait === state.selectedBait));
 });
});

// The CSS game viewport determines the real canvas dimensions in both orientations.
const rect = gameHost.getBoundingClientRect();
const config: Phaser.Types.Core.GameConfig = {
 type: Phaser.AUTO, parent: 'game',
 width: Math.max(1, Math.round(rect.width)),
 height: Math.max(1, Math.round(rect.height)),
 backgroundColor: '#082a2e', scene: [FishingScene],
 render: { antialias: true, pixelArt: false, roundPixels: false },
 scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.NO_CENTER },
 input: { activePointers: 3 }
};
const game = new Phaser.Game(config);
let pausedByFishdex = false;
mountFishdex({
 onOpen() {
  if (game.scene.isActive('FishingScene')) {
   game.scene.pause('FishingScene');
   pausedByFishdex = true;
  }
 },
 onClose() {
  if (pausedByFishdex) game.scene.resume('FishingScene');
  pausedByFishdex = false;
 }
});
// React to actual DOM sizes, including mobile URL-bar collapse and iOS orientation.
if (typeof ResizeObserver !== 'undefined') {
 const observer = new ResizeObserver(() => { game.scale.refresh(); });
 observer.observe(gameHost);
}

// Old cache-first worker caused older builds to persist on mobile. Remove legacy
// registrations and game-specific caches rather than registering a new worker.
if ('serviceWorker' in navigator) {
 window.addEventListener('load', async () => {
  const regs = await navigator.serviceWorker.getRegistrations().catch(() => []);
  for (const reg of regs) await reg.unregister().catch(() => undefined);
  if ('caches' in window) {
   const keys = await caches.keys().catch(() => []);
   await Promise.all(keys.filter(key => key.startsWith('fishertown-')).map(key => caches.delete(key)));
  }
 });
}
