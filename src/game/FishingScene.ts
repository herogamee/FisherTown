import Phaser from 'phaser';
import { BAITS, FISH_SPECIES, type BaitId, type FishSpecies } from './data/fish';
import { FishActor, type HookPoint } from './systems/FishActor';
import { loadSave, persistSave, recordCatch, type FisherSave } from './save';

type GamePhase = 'idle' | 'charging' | 'cast' | 'bite' | 'fight' | 'result';

type ButtonPack = {
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

const WORLD = { left: 38, right: 1042, top: 350, bottom: 642 };
const ROD_TIP = { x: 1120, y: 380 };

export class FishingScene extends Phaser.Scene {
  private fish: FishActor[] = [];
  private save!: FisherSave;
  private phase: GamePhase = 'idle';
  private hook: HookPoint = { x: 760, y: 425, active: false, bait: 'worm' };
  private selectedBait: BaitId = 'worm';
  private hookedFish: FishActor | null = null;
  private biteFish: FishActor | null = null;
  private biteWindow = 0;
  private charge = 0;
  private chargeDirection = 1;
  private tension = 42;
  private slackClock = 0;
  private reelHeld = false;
  private sessionCatches = 0;
  private statusText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private catchCountText!: Phaser.GameObjects.Text;
  private discoveredText!: Phaser.GameObjects.Text;
  private chargeBar!: Phaser.GameObjects.Graphics;
  private tensionBar!: Phaser.GameObjects.Graphics;
  private lineGraphics!: Phaser.GameObjects.Graphics;
  private bobber!: Phaser.GameObjects.Container;
  private hookButton!: ButtonPack;
  private castButton!: ButtonPack;
  private reelButton!: ButtonPack;
  private baitButtons: Map<BaitId, ButtonPack> = new Map();
  private overlay!: Phaser.GameObjects.Container;
  private waterFx!: Phaser.GameObjects.Graphics;
  private waterTick = 0;
  private debugText!: Phaser.GameObjects.Text;
  private lastSavedPhase: GamePhase = 'idle';

  constructor() {
    super('FishingScene');
  }

  preload(): void {\n    this.load.image('bg-thailand-sunset', 'assets/generated/bg_thailand_sunset.png');\n  }\n\n  create(): void {
    this.save = loadSave();
    this.selectedBait = (BAITS.some((bait) => bait.id === this.save.selectedBait) ? this.save.selectedBait : 'worm') as BaitId;
    this.hook.bait = this.selectedBait;

    this.cameras.main.setBackgroundColor('#8fd4da');
    this.drawEnvironment();
    this.createFishPopulation();
    this.createFishingGear();
    this.createHud();
    this.createControls();
    this.createResultOverlay();
    this.createPauseSafety();

    this.status('บึงน้ำหลากเจ้าพระยา — พร้อมตกปลา', 'เลือกเหยื่อ แล้วแตะค้าง “เหวี่ยงเบ็ด” เพื่อกำหนดระยะ');
    this.refreshHud();
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.waterTick += dt;
    this.animateWater();

    if (this.phase === 'charging') this.updateCharge(dt);

    if (this.phase !== 'fight' && this.phase !== 'result') {
      for (const fish of this.fish) fish.update(dt, this.hook, WORLD);
    }

    if (this.phase === 'cast') this.detectBites(dt);
    if (this.phase === 'bite') this.updateBiteWindow(dt);
    if (this.phase === 'fight') this.updateFight(dt);

    this.drawLine();
    this.drawBars();
    this.syncButtons();
  }

  private drawEnvironment(): void {
    this.add.image(640, 360, 'bg-thailand-sunset')
      .setDisplaySize(1280, 720)
      .setDepth(-20);

    const veil = this.add.graphics().setDepth(-10);
    veil.fillStyle(0x031416, 0.08).fillRect(0, 345, 1280, 375);
    veil.fillStyle(0x000000, 0.24).fillRoundedRect(18, 18, 315, 60, 16);
    veil.fillStyle(0x000000, 0.20).fillRoundedRect(900, 18, 300, 54, 16);

    this.waterFx = this.add.graphics().setDepth(18);

    this.add.text(34, 27, 'FisherTown', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#fff3d3',
      stroke: '#173b37',
      strokeThickness: 5
    }).setDepth(30);

    this.add.text(922, 31, '☀ 28°C  ·  17:42  ·  น้ำไหลช้า', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#fff2d5'
    }).setDepth(30);
  }

