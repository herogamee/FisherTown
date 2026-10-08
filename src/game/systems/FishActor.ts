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
    g.clear();

    // v0.3: non-final species remain subtle underwater silhouettes instead of bright cartoon fish.
    const length = this.species.morphology === 'snakehead' || this.species.morphology === 'featherback' ? 82 : 64;
    const height = this.species.morphology === 'gourami' ? 30 : 22;
    g.fillStyle(0x162f30, 0.72).fillEllipse(0, 0, length, height);
    g.fillStyle(0x102526, 0.68).fillTriangle(-length * 0.43, 0, -length * 0.7, -height * 0.72, -length * 0.7, height * 0.72);

    if (this.species.morphology === 'catfish') {
      g.lineStyle(1.2, 0x9bb4aa, 0.34);
      g.lineBetween(length * 0.4, 1, length * 0.62, 9);
      g.lineBetween(length * 0.4, -1, length * 0.62, -8);
    }

    g.fillStyle(0xc7d6c8, 0.42).fillCircle(length * 0.34, -3, 2.2);
    g.fillStyle(0x071313, 0.8).fillCircle(length * 0.35, -3, 1.1);
  }\n}