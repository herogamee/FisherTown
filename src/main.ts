import Phaser from 'phaser';
import './style.css';
import { FishingScene } from './game/FishingScene';

type Phase = 'idle' | 'charging' | 'cast' | 'bite' | 'fight' | 'result';
type Action = 'castDown' | 'castUp' | 'hook' | 'reelDown' | 'reelUp' | 'release' | 'bait';
type FishState = {
 phase: Phase; title: string; hint: string;
 totalCatches: number; discovered: number; speciesTotal: number;
 selectedBait: string; charge: number; tension: number;
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

window.addEventListener('fishertown:state', (event: Event) => {
 const state = (event as CustomEvent<FishState>).detail;
 title.textContent = state.title;
 hint.textContent = state.hint;
 catches.textContent = '🎣 สะสม ' + state.totalCatches + ' ตัว';
 discovered.textContent = '📖 Fishdex ' + state.discovered + '/' + state.speciesTotal;
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

const config: Phaser.Types.Core.GameConfig = {
 type: Phaser.AUTO, parent: 'game', width: 1280, height: 720,
 backgroundColor: '#071d21', scene: [FishingScene],
 render: { antialias: true, pixelArt: false, roundPixels: false },
 scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 1280, height: 720 },
 input: { activePointers: 3 }
};
new Phaser.Game(config);

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
