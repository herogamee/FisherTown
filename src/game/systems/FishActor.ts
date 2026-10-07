import Phaser from 'phaser';
import type { BaitId, FishSpecies } from '../data/fish';

export type FishState = 'cruise' | 'investigate' | 'bite' | 'hooked' | 'recover';

export interface HookPoint {
  x: number;
  y: number;
  active: boolean;
  bait: BaitId;
}

export class FishActor {
  readonly species: FishSpecies;
  readonly node: Phaser.GameObjects.Container;
  readonly lengthCm: number;
  readonly weightKg: number;

  state: FishState = 'cruise';
  direction: 1 | -1;
  energy = 1;
  hunger: number;
  confidence: number;
  targetX = 0;
  targetY = 0;
  biteClock = 0;
  investigateClock = 0;
  cooldown = 0;
  hookedStamina = 1;
  burstClock = 0;
  burstDirection: 1 | -1 = 1;

  private readonly scene: Phaser.Scene;
  private readonly body: Phaser.GameObjects.Graphics;
  private readonly baseScale: number;
  private wanderClock = 0;

  constructor(scene: Phaser.Scene, species: FishSpecies, x: number, y: number, direction: 1 | -1) {
    this.scene = scene;
    this.species = species;
    this.direction = direction;
    this.lengthCm = Phaser.Math.FloatBetween(species.localLengthCm[0], species.localLengthCm[1]);
    this.weightKg = Math.max(0.05, species.weightFactor * Math.pow(this.lengthCm, 3));
    this.hunger = Phaser.Math.FloatBetween(0.38, 0.95);
    this.confidence = Phaser.Math.FloatBetween(0.45, 0.95) * (1 - species.wariness * 0.3);
    this.hookedStamina = Phaser.Math.FloatBetween(0.82, 1.08) * species.stamina;

    this.node = scene.add.container(x, y);
    this.body = scene.add.graphics();
    this.node.add(this.body);
    this.baseScale = Phaser.Math.Clamp(0.62 + this.lengthCm / 120, 0.72, 1.32);
    this.node.setScale(this.baseScale * this.direction, this.baseScale);
    this.node.setAlpha(0.84);
    this.drawBody();
    this.pickWanderTarget();
  }

  get x(): number { return this.node.x; }
  get y(): number { return this.node.y; }

  setPosition(x: number, y: number): void {
    this.node.setPosition(x, y);
  }

  update(dt: number, hook: HookPoint, world: { left: number; right: number; top: number; bottom: number }): void {
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (this.state === 'hooked') {
      this.updateHooked(dt, world);
      return;
    }

    const distance = hook.active ? Phaser.Math.Distance.Between(this.x, this.y, hook.x, hook.y) : Infinity;
    const attraction = hook.active ? this.species.attraction[hook.bait] : 0;
    const noticeRadius = 190 + attraction * 120;

    if (hook.active && this.cooldown <= 0 && distance < noticeRadius && attraction > 0.1 && this.state !== 'bite') {
      const interest = attraction * this.hunger * this.confidence;
      if (interest > 0.26) {
        this.state = 'investigate';
        this.targetX = hook.x - this.direction * 24;
        this.targetY = hook.y + Phaser.Math.FloatBetween(-12, 18);
      }
    }

    if (this.state === 'investigate') {
      this.investigateClock += dt;
      this.moveToward(this.targetX, this.targetY, this.species.speed * 0.72, dt);
      const nowDistance = Phaser.Math.Distance.Between(this.x, this.y, hook.x, hook.y);
      if (!hook.active) {
        this.resetCruise();
      } else if (nowDistance < 32) {
        const biteChance = this.species.attraction[hook.bait] * this.hunger * this.confidence;
        if (this.investigateClock > Phaser.Math.Linear(1.5, 0.55, biteChance)) {
          if (Math.random() < Phaser.Math.Clamp(biteChance * 0.94, 0.18, 0.9)) {
            this.state = 'bite';
            this.biteClock = 0;
            this.node.setAlpha(1);
          } else {
            this.cooldown = Phaser.Math.FloatBetween(2.5, 5.5);
            this.resetCruise();
          }
        }
      }
      return;
    }

    if (this.state === 'bite') {
      this.biteClock += dt;
      this.moveToward(hook.x, hook.y, this.species.speed * 0.38, dt);
      return;
    }

    if (this.state === 'recover') {
      this.wanderClock += dt;
      if (this.wanderClock > 1.5) this.resetCruise();
      return;
    }

    this.wanderClock -= dt;
    if (this.wanderClock <= 0 || Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY) < 20) {
      this.pickWanderTarget(world);
    }
    this.moveToward(this.targetX, this.targetY, this.species.speed * 0.33, dt);
  }

  beginHooked(): void {
    this.state = 'hooked';
    this.node.setAlpha(1);
    this.burstClock = 0;
    this.burstDirection = Math.random() < 0.5 ? -1 : 1;
  }

  escape(): void {
    this.state = 'recover';
    this.cooldown = 6;
    this.wanderClock = 0;
    this.node.setAlpha(0.64);
    this.direction = Math.random() < 0.5 ? -1 : 1;
    this.node.setScale(this.baseScale * this.direction, this.baseScale);
  }

  private updateHooked(dt: number, world: { left: number; right: number; top: number; bottom: number }): void {
    this.burstClock -= dt;
    if (this.burstClock <= 0) {
      this.burstClock = Phaser.Math.FloatBetween(0.5, 1.45) * Phaser.Math.Linear(1.2, 0.7, this.species.power);
      this.burstDirection = Math.random() < 0.5 ? -1 : 1;
    }

    const burst = this.species.power * Phaser.Math.FloatBetween(0.7, 1.12);
    const dx = this.burstDirection * (48 + 84 * burst) * dt;
    const wave = Math.sin(this.scene.time.now * 0.004 + this.lengthCm) * (12 + this.species.power * 18) * dt;
    this.node.x = Phaser.Math.Clamp(this.node.x + dx, world.left + 24, world.right - 24);
    this.node.y = Phaser.Math.Clamp(this.node.y + wave, world.top + 30, world.bottom - 22);

    const dir: 1 | -1 = dx >= 0 ? 1 : -1;
    if (dir !== this.direction) {
      this.direction = dir;
      this.node.setScale(this.baseScale * this.direction, this.baseScale);
    }
  }

  private resetCruise(): void {
    this.state = 'cruise';
    this.investigateClock = 0;
    this.biteClock = 0;
    this.node.setAlpha(0.84);
    this.wanderClock = 0;
  }

  private pickWanderTarget(world?: { left: number; right: number; top: number; bottom: number }): void {
    const bounds = world ?? { left: 70, right: 1040, top: 390, bottom: 635 };
    this.targetX = Phaser.Math.FloatBetween(bounds.left + 30, bounds.right - 30);
    this.targetY = Phaser.Math.FloatBetween(bounds.top + 42, bounds.bottom - 36);
    this.wanderClock = Phaser.Math.FloatBetween(2.2, 5.5);
  }

  private moveToward(x: number, y: number, speed: number, dt: number): void {
    const dx = x - this.x;
    const dy = y - this.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const dir: 1 | -1 = dx >= 0 ? 1 : -1;
    if (Math.abs(dx) > 5 && dir !== this.direction) {
      this.direction = dir;
      this.node.setScale(this.baseScale * this.direction, this.baseScale);
    }
    this.node.x += (dx / distance) * speed * dt;
    this.node.y += (dy / distance) * speed * 0.62 * dt;
  }

  private drawBody(): void {
    const g = this.body;
    const c = this.species.bodyColor;
    const a = this.species.accentColor;
    g.clear();

    if (this.species.morphology === 'snakehead') {
      g.fillStyle(c, 1).fillEllipse(0, 0, 76, 24);
      g.fillStyle(a, 0.85).fillEllipse(26, -1, 30, 22);
      g.fillStyle(a, 0.7).fillTriangle(-33, 0, -53, -15, -53, 15);
      g.fillStyle(a, 0.55).fillTriangle(-8, -10, 17, -18, 26, -9);
      g.lineStyle(2, a, 0.8);
      for (let x = -18; x < 26; x += 13) g.lineBetween(x, -8, x + 8, 8);
    } else if (this.species.morphology === 'catfish') {
      g.fillStyle(c, 1).fillEllipse(0, 0, 68, 28);
      g.fillStyle(a, 0.8).fillEllipse(25, 0, 30, 25);
      g.fillStyle(c, 1).fillTriangle(-31, 0, -52, -18, -52, 18);
      g.fillStyle(a, 0.75).fillTriangle(-3, -12, 8, -27, 17, -11);
      g.lineStyle(1.4, a, 0.9);
      g.lineBetween(35, 3, 52, 12);
      g.lineBetween(35, 5, 53, 2);
      g.lineBetween(35, -2, 51, -10);
    } else if (this.species.morphology === 'gourami') {
      g.fillStyle(c, 1).fillEllipse(0, 0, 55, 38);
      g.fillStyle(a, 0.72).fillTriangle(-24, 0, -44, -19, -44, 19);
      g.fillStyle(a, 0.58).fillTriangle(-14, -16, 12, -28, 23, -14);
      g.fillStyle(a, 0.58).fillTriangle(-12, 16, 15, 26, 22, 13);
      g.lineStyle(1.1, a, 0.75);
      g.lineBetween(12, 16, 22, 35);
      g.lineBetween(18, 15, 29, 34);
    } else if (this.species.morphology === 'featherback') {
      g.fillStyle(c, 1).fillEllipse(0, 0, 76, 24);
      g.fillStyle(a, 0.72).fillTriangle(-35, 0, -55, -10, -55, 10);
      g.lineStyle(4, a, 0.78);
      g.lineBetween(-28, 9, 30, 9);
      g.fillStyle(a, 0.5).fillTriangle(5, -10, 22, -21, 26, -9);
    } else {
      g.fillStyle(c, 1).fillEllipse(0, 0, 60, 36);
      g.fillStyle(a, 0.76).fillTriangle(-27, 0, -49, -19, -49, 19);
      g.fillStyle(a, 0.62).fillTriangle(-8, -16, 7, -27, 18, -14);
      g.fillStyle(a, 0.52).fillTriangle(-2, 15, 13, 26, 20, 12);
      g.lineStyle(1.1, a, 0.5);
      g.lineBetween(-10, -14, -10, 14);
      g.lineBetween(4, -16, 4, 16);
    }

    g.fillStyle(0xf5f2df, 1).fillCircle(27, -5, 3.7);
    g.fillStyle(0x161a18, 1).fillCircle(28, -5, 1.7);
  }
}
