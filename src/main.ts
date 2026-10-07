import Phaser from 'phaser';
import './style.css';
import { FishingScene } from './game/FishingScene';

const frame = document.getElementById('game-frame');
if (!frame) throw new Error('Missing #game-frame');

const fullscreenButton = document.createElement('button');
fullscreenButton.id = 'fullscreen-button';
fullscreenButton.type = 'button';
fullscreenButton.textContent = '⛶';
fullscreenButton.setAttribute('aria-label', 'ขยายเกมเต็มหน้าจอ');
fullscreenButton.title = 'เต็มหน้าจอ';
document.body.appendChild(fullscreenButton);

const syncViewport = (): void => {
  const vv = window.visualViewport;
  if (vv) {
    document.documentElement.style.setProperty('--visual-height', `${vv.height}px`);
  }
};

const isFullscreen = (): boolean => Boolean(document.fullscreenElement);

const updateFullscreenButton = (): void => {
  fullscreenButton.textContent = isFullscreen() || document.documentElement.classList.contains('fill-screen') ? '×' : '⛶';
  fullscreenButton.setAttribute(
    'aria-label',
    isFullscreen() || document.documentElement.classList.contains('fill-screen')
      ? 'ออกจากโหมดเต็มจอ'
      : 'ขยายเกมเต็มหน้าจอ'
  );
};

fullscreenButton.addEventListener('click', async () => {
  if (isFullscreen()) {
    await document.exitFullscreen().catch(() => undefined);
    document.documentElement.classList.remove('fill-screen');
    updateFullscreenButton();
    return;
  }

  if (document.documentElement.classList.contains('fill-screen')) {
    document.documentElement.classList.remove('fill-screen');
    updateFullscreenButton();
    return;
  }

  try {
    if (frame.requestFullscreen) {
      await frame.requestFullscreen();
      return;
    }
  } catch {
    // iPhone Safari may not expose element fullscreen. Fall through to viewport-fill mode.
  }

  document.documentElement.classList.add('fill-screen');
  window.scrollTo(0, 1);
  updateFullscreenButton();
});

document.addEventListener('fullscreenchange', updateFullscreenButton);
window.visualViewport?.addEventListener('resize', syncViewport);
window.visualViewport?.addEventListener('scroll', syncViewport);
window.addEventListener('orientationchange', () => setTimeout(syncViewport, 120));
syncViewport();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#071d21',
  scene: [FishingScene],
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  input: {
    activePointers: 3
  }
};

new Phaser.Game(config);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // PWA installability is optional; never block gameplay on service worker failure.
    });
  });
}
