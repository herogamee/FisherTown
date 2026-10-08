import Phaser from 'phaser';
import { BAITS, FISH_SPECIES, type BaitId, type FishSpecies } from './data/fish';
import { FishActor, type HookPoint } from './systems/FishActor';
import { loadSave, persistSave, recordCatch, type FisherSave } from './save';

type GamePhase = 'idle' | 'charging' | 'cast' | 'bite' | 'fight' | 'result';

type CanvasItem = Phaser.GameObjects.Graphics | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text;

type CatchPreview = {
  speciesId: string;
  nameTh: string;
  nameEn: string;
  scientific: string;
  lengthCm: number;
  weightKg: number;
  isNew: boolean;
  isRecord: boolean;
};

type Quality = 'auto' | 'low' | 'balanced' | 'high';

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
  private mobileStateClock = 0;
  private mobileTitle = '';
  private mobileHint = '';
  private portraitView = false;
  private portraitFocusX = 1000;
  private canvasItems: CanvasItem[] = [];
  private lastCatch: CatchPreview | null = null;
  private selectedQuality: Quality = 'auto';
  private effectiveQuality: Exclude<Quality, 'auto'> = 'balanced';
  private fishAccumulator = 0;
  private fpsRolling = 60;
  private fpsClock = 0;
  private qualityClock = 0;
  private qualityCooldown = 0;
  private fpsDisplay = 60;

  constructor() {
    super('FishingScene');
  }

  preload(): void {
    this.load.image('bg-thailand-sunset', 'assets/generated/bg_thailand_sunset.webp');
    for (const species of FISH_SPECIES) {
      this.load.svg(`fish:${species.id}`, `assets/fish/${species.id}.svg`, { width: 560, height: 280 });
    }
  }

  create(): void {
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
    this.attachMobileControls();
    this.attachViewportAndQuality();

    this.status('บึงน้ำหลากเจ้าพระยา — พร้อมตกปลา', 'เลือกเหยื่อ แล้วแตะค้าง “เหวี่ยงเบ็ด” เพื่อกำหนดระยะ');
    this.refreshHud();
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.waterTick += dt;
    this.animateWater();
    if (this.phase === 'charging') this.updateCharge(dt);

    // Fish AI ticks are fixed and bounded, independent of browser paint rate.
    // This keeps bite probabilities and movement stable under slow frames.
    const fishStep = this.effectiveQuality === 'low' ? 1 / 24 :
      this.effectiveQuality === 'high' ? 1 / 60 : 1 / 40;
    if (this.phase !== 'fight' && this.phase !== 'result') {
      this.fishAccumulator = Math.min(this.fishAccumulator + dt, fishStep * 2);
      let passes = 0;
      while (this.fishAccumulator >= fishStep && passes < 2) {
        for (const fish of this.fish) fish.update(fishStep, this.hook, WORLD);
        this.fishAccumulator -= fishStep;
        passes += 1;
      }
    } else {
      this.fishAccumulator = 0;
    }

    if (this.phase === 'cast') this.detectBites(dt);
    if (this.phase === 'bite') this.updateBiteWindow(dt);
    if (this.phase === 'fight') this.updateFight(dt);

    this.updateViewport(dt);
    this.updatePerformance(dt, deltaMs);
    this.drawLine();
    if (!this.portraitView) {
      this.drawBars();
      this.syncButtons();
    }
    this.mobileStateClock += dt;
    if (this.mobileStateClock >= 0.14) {
      this.mobileStateClock = 0;
      this.emitMobileState();
    }
  }

  private drawEnvironment(): void {
    // Keep all simulation / controls intact; the generated artwork replaces only the scenery.
    this.add.image(640, 360, 'bg-thailand-sunset')
      .setDisplaySize(1280, 720)
      .setDepth(-20);

    const shading = this.add.graphics().setDepth(-12);
    shading.fillStyle(0x041f25, 0.09).fillRect(0, 346, 1280, 374);
    shading.fillStyle(0x021417, 0.40).fillRoundedRect(18, 16, 320, 62, 15);
    shading.fillStyle(0x021417, 0.42).fillRoundedRect(920, 16, 340, 56, 15);

    this.waterFx = this.add.graphics().setDepth(8);
    const labelLeft = this.add.text(33, 24, 'FisherTown', {
      fontFamily: 'Arial, sans-serif', fontSize: '29px', fontStyle: 'bold',
      color: '#fff3d9', stroke: '#123a39', strokeThickness: 5
    }).setDepth(30);
    const labelRight = this.add.text(944, 31, 'Thailand Freshwater · Golden Hour', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px',
      color: '#fff2dc', stroke: '#193a36', strokeThickness: 2
    }).setDepth(30);
    this.canvasItems.push(labelLeft, labelRight);
  }

  private createFishPopulation(): void {
    const picks = [...FISH_SPECIES];
    picks.push(FISH_SPECIES[0], FISH_SPECIES[1]);
    picks.forEach((species, index) => {
      const x = Phaser.Math.FloatBetween(110, 980);
      const y = Phaser.Math.FloatBetween(402, 610);
      const dir = index % 2 === 0 ? 1 : -1;
      this.fish.push(new FishActor(this, species, x, y, dir));
    });
  }

  private createFishingGear(): void {
    // The generated scenery supplies the fisherman. Do not redraw a blocky figure.
    const rod = this.add.graphics().setDepth(6);
    rod.lineStyle(3.4, 0x273b35, 0.92).lineBetween(ROD_TIP.x, ROD_TIP.y, 1004, 318);
    rod.lineStyle(1.3, 0xd4c595, 0.76).lineBetween(1004, 318, 1032, 312);

    this.lineGraphics = this.add.graphics().setDepth(19);
    const bobberBody = this.add.graphics();
    bobberBody.fillStyle(0xf2ede0, 1).fillCircle(0, 5, 7);
    bobberBody.fillStyle(0xcf593f, 1).fillRect(-3, -10, 6, 12);
    bobberBody.lineStyle(1, 0x173c42, 0.8).lineBetween(0, 12, 0, 24);
    this.bobber = this.add.container(this.hook.x, this.hook.y, [bobberBody])
      .setDepth(20).setVisible(false);
  }

  private createHud(): void {
    const panel = this.add.graphics();
    panel.fillStyle(0x082f34, 0.9).fillRoundedRect(22, 78, 360, 96, 18);
    panel.fillStyle(0x0e4950, 0.78).fillRoundedRect(400, 78, 392, 96, 18);

    this.statusText = this.add.text(42, 94, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '19px', fontStyle: 'bold', color: '#f1f7ec', wordWrap: { width: 320 }
    });
    this.hintText = this.add.text(42, 125, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#b7dbd8', wordWrap: { width: 320 }
    });

    this.catchCountText = this.add.text(420, 96, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '17px', color: '#eef5e8'
    });
    this.discoveredText = this.add.text(420, 128, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#c7e0da'
    });

    this.chargeBar = this.add.graphics();
    this.tensionBar = this.add.graphics();
    this.debugText = this.add.text(812, 92, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#254b50', align: 'right'
    }).setOrigin(0, 0);
    this.canvasItems.push(panel, this.statusText, this.hintText,
      this.catchCountText, this.discoveredText, this.chargeBar,
      this.tensionBar, this.debugText);
  }

  private createControls(): void {
    let baitX = 24;
    for (const bait of BAITS) {
      const pack = this.makeButton(baitX, 650, 156, 54, `${bait.icon} ${bait.label}`, 0x123e43, 16);
      pack.bg.on('pointerup', () => this.selectBait(bait.id));
      this.baitButtons.set(bait.id, pack);
      baitX += 164;
    }

    this.castButton = this.makeButton(765, 649, 206, 56, 'เหวี่ยงเบ็ด', 0x1e6f6c, 19);
    this.castButton.bg.on('pointerdown', () => {
      if (this.phase === 'idle') this.beginCharge();
      else if (this.phase === 'cast' || this.phase === 'bite') this.retrieveLine();
    });
    this.castButton.bg.on('pointerup', () => this.releaseCast());
    this.castButton.bg.on('pointerout', () => {
      if (this.phase === 'charging') this.releaseCast();
    });

    this.hookButton = this.makeButton(979, 649, 132, 56, 'HOOK!', 0x9f5c32, 20);
    this.hookButton.bg.on('pointerup', () => this.tryHook());

    this.reelButton = this.makeButton(1118, 649, 140, 56, 'ดึงสาย', 0x275c75, 19);
    this.reelButton.bg.on('pointerdown', () => { if (this.phase === 'fight') this.reelHeld = true; });
    this.reelButton.bg.on('pointerup', () => { this.reelHeld = false; });
    this.reelButton.bg.on('pointerout', () => { this.reelHeld = false; });
    for (const pack of this.baitButtons.values()) {
      this.canvasItems.push(pack.bg, pack.label);
    }
    for (const pack of [this.castButton, this.hookButton, this.reelButton]) {
      this.canvasItems.push(pack.bg, pack.label);
    }
  }

  private createResultOverlay(): void {
    const shade = this.add.rectangle(640, 360, 1280, 720, 0x061b1f, 0.72).setInteractive();
    const card = this.add.rectangle(640, 360, 620, 350, 0xf0eee2, 1).setStrokeStyle(4, 0x244f51, 1);
    this.overlay = this.add.container(0, 0, [shade, card]).setDepth(50).setVisible(false);
  }

  private createPauseSafety(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.game.loop.sleep();
        this.reelHeld = false;
        this.lastSavedPhase = this.phase;
        persistSave(this.save);
      } else {
        this.game.loop.wake();
        if (this.lastSavedPhase === 'fight' && this.phase === 'fight') {
          this.status('กลับมาแล้ว — Fight ถูกพักไว้ให้', 'กดค้าง “ดึงสาย” เมื่อแรงตึงอยู่ในช่วงปลอดภัย');
        }
      }
    });
  }

  private makeButton(x: number, y: number, width: number, height: number, text: string, color: number, fontSize: number): ButtonPack {
    const bg = this.add.rectangle(x, y, width, height, color, 0.96)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xffffff, 0.16)
      .setInteractive({ useHandCursor: true });
    const label = this.add.text(x + width / 2, y + height / 2, text, {
      fontFamily: 'Arial, sans-serif', fontSize: `${fontSize}px`, fontStyle: 'bold', color: '#f5f5e8', align: 'center'
    }).setOrigin(0.5);
    return { bg, label };
  }

  private selectBait(id: BaitId): void {
    if (this.phase !== 'idle') return;
    this.selectedBait = id;
    this.hook.bait = id;
    this.save.selectedBait = id;
    persistSave(this.save);
    const bait = BAITS.find((item) => item.id === id)!;
    this.status(`เลือก ${bait.icon} ${bait.label}`, bait.note);
  }

  private beginCharge(): void {
    if (this.phase !== 'idle') return;
    this.phase = 'charging';
    this.charge = 0.18;
    this.chargeDirection = 1;
    this.status('กำลังเล็งระยะ...', 'ปล่อยนิ้วเมื่อแถบกำลังอยู่ในตำแหน่งที่ต้องการ');
  }

  private updateCharge(dt: number): void {
    this.charge += dt * 0.78 * this.chargeDirection;
    if (this.charge >= 1) { this.charge = 1; this.chargeDirection = -1; }
    if (this.charge <= 0.12) { this.charge = 0.12; this.chargeDirection = 1; }
  }

  private releaseCast(): void {
    if (this.phase !== 'charging') return;
    const distance = Phaser.Math.Linear(180, 830, this.charge);
    this.hook.x = Phaser.Math.Clamp(ROD_TIP.x - distance, 120, 930);
    this.hook.y = Phaser.Math.FloatBetween(395, 480);
    this.hook.active = true;
    this.hook.bait = this.selectedBait;
    this.phase = 'cast';
    this.bobber.setPosition(this.hook.x, this.hook.y).setVisible(true);
    this.charge = 0;
    this.status('เหยื่อลงน้ำแล้ว', 'สังเกตทุ่นและปลา — บางตัวจะเข้ามาดูแต่ยังไม่กัด');

    this.tweens.killTweensOf(this.bobber);
    this.tweens.add({
      targets: this.bobber,
      y: this.hook.y + 7,
      duration: 780,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private detectBites(dt: number): void {
    const biting = this.fish.find((fish) => fish.state === 'bite');
    if (!biting) return;
    this.biteFish = biting;
    this.phase = 'bite';
    this.biteWindow = Phaser.Math.Linear(1.65, 0.85, biting.species.wariness);
    this.status('มีปลาแตะเหยื่อ!', 'แตะ HOOK! ก่อนปลาคายเหยื่อ');
    this.tweens.add({ targets: this.bobber, y: this.hook.y + 24, duration: 110, yoyo: true, repeat: 2 });
    void dt;
  }

  private updateBiteWindow(dt: number): void {
    this.biteWindow -= dt;
    if (this.biteWindow > 0) return;
    if (this.biteFish) this.biteFish.escape();
    this.biteFish = null;
    this.phase = 'cast';
    this.status('ช้าไป — ปลาคายเหยื่อ', 'รออีกตัว หรือแตะ “เก็บสาย” เพื่อเหวี่ยงใหม่');
  }

  private tryHook(): void {
    if (this.phase !== 'bite' || !this.biteFish) return;
    this.hookedFish = this.biteFish;
    this.biteFish = null;
    this.hookedFish.beginHooked();
    this.phase = 'fight';
    this.tension = 46;
    this.slackClock = 0;
    this.reelHeld = false;
    this.tweens.killTweensOf(this.bobber);
    this.status(`ติดเบ็ด! ${this.hookedFish.species.nameTh}`, 'กดค้าง “ดึงสาย” ให้แรงตึงอยู่ช่วงกลาง ปล่อยเมื่อปลากระชากแรง');
  }

  private retrieveLine(): void {
    if (this.phase !== 'cast' && this.phase !== 'bite') return;
    if (this.biteFish) {
      this.biteFish.escape();
      this.biteFish = null;
    }
    this.tweens.killTweensOf(this.bobber);
    this.hook.active = false;
    this.bobber.setVisible(false);
    this.phase = 'idle';
    this.status('เก็บสายแล้ว', 'เปลี่ยนเหยื่อหรือเหวี่ยงไปยังตำแหน่งใหม่ได้ทันที');
  }

  private updateFight(dt: number): void {
    const fish = this.hookedFish;
    if (!fish) return;

    fish.update(dt, this.hook, WORLD);
    this.hook.x = fish.x + (fish.direction > 0 ? 22 : -22);
    this.hook.y = fish.y;
    this.bobber.setPosition(this.hook.x, this.hook.y);

    const distanceFromRod = Phaser.Math.Distance.Between(ROD_TIP.x, ROD_TIP.y, fish.x, fish.y);
    const pull = fish.species.power * (0.22 + Math.abs(Math.sin(this.time.now * 0.0027 + fish.lengthCm)) * 0.78);
    const distanceLoad = Phaser.Math.Clamp((distanceFromRod - 420) / 620, 0, 0.32);

    if (this.reelHeld) {
      this.tension += dt * (25 + pull * 36 + distanceLoad * 20);
      if (this.tension >= 20 && this.tension <= 82) {
        fish.hookedStamina -= dt * Phaser.Math.Linear(0.075, 0.16, 1 - fish.species.stamina) * (0.75 + this.tension / 100);
        const reelStep = dt * Phaser.Math.Linear(38, 22, fish.species.power);
        fish.setPosition(Math.min(fish.x + reelStep, WORLD.right - 15), fish.y);
      }
    } else {
      this.tension -= dt * (18 - pull * 4);
      fish.hookedStamina = Math.min(fish.species.stamina * 1.08, fish.hookedStamina + dt * 0.012);
    }

    this.tension += dt * pull * 17;
    this.tension = Phaser.Math.Clamp(this.tension, 0, 112);

    if (this.tension > 100) {
      this.endFight(false, 'สายขาด! ปลากระชากแรงเกินไป');
      return;
    }

    if (this.tension < 7) this.slackClock += dt;
    else this.slackClock = Math.max(0, this.slackClock - dt * 1.8);

    if (this.slackClock > 1.35) {
      this.endFight(false, 'สายหย่อนนานเกินไป — ปลาสะบัดเบ็ดหลุด');
      return;
    }

    if (fish.hookedStamina <= 0) {
      this.completeCatch(fish);
    }
  }

  private endFight(success: boolean, message: string): void {
    const fish = this.hookedFish;
    if (fish && !success) fish.escape();
    this.hookedFish = null;
    this.hook.active = false;
    this.bobber.setVisible(false);
    this.reelHeld = false;
    this.phase = 'idle';
    this.status(message, 'เลือกเหยื่อแล้วลองใหม่ได้ทันที — ไม่มีพลังงานหรือเวลารอ');
  }

  private completeCatch(fish: FishActor): void {
    this.phase = 'result';
    this.reelHeld = false;
    this.hook.active = false;
    this.bobber.setVisible(false);
    this.sessionCatches += 1;
    const record = recordCatch(this.save, fish.species.id, fish.lengthCm, fish.weightKg);
    this.refreshHud();
    this.status(`ตกได้แล้ว! ${fish.species.nameTh}`,
      `${fish.lengthCm.toFixed(1)} ซม. · ${fish.weightKg.toFixed(2)} กก. — กด “ปล่อยคืนสู่ธรรมชาติ” เพื่อเล่นต่อ`);
    this.showCatchCard(fish.species, fish.lengthCm, fish.weightKg, record.isNewSpecies, record.isLengthRecord);
    fish.escape();
    this.hookedFish = null;
  }

  private showCatchCard(species: FishSpecies, length: number, weight: number, isNew: boolean, isRecord: boolean): void {
    this.overlay.removeAll(true);
    const shade = this.add.rectangle(640, 360, 1280, 720, 0x04191d, 0.81).setInteractive();
    const card = this.add.rectangle(640, 355, 686, 488, 0xf3f0e3, 1).setStrokeStyle(3, 0x426962, 1);
    const title = this.add.text(640, 151, species.nameTh, {
      fontFamily: 'Arial, sans-serif', fontSize: '32px', fontStyle: 'bold', color: '#173d3e'
    }).setOrigin(0.5);
    const scientific = this.add.text(640, 189, `${species.nameEn} · ${species.scientific}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', fontStyle: 'italic', color: '#526463'
    }).setOrigin(0.5);
    const textureKey = `fish:${species.id}`;
    const picture = this.textures.exists(textureKey)
      ? this.add.image(640, 280, textureKey).setDisplaySize(310, 155)
      : this.add.text(640, 280, species.nameEn, { fontFamily: 'Arial', fontSize: '20px', color: '#52716b' }).setOrigin(0.5);
    const measure = this.add.text(640, 362, `${length.toFixed(1)} cm   ·   ${weight.toFixed(2)} kg`, {
      fontFamily: 'Arial, sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#235b55'
    }).setOrigin(0.5);
    const badges: string[] = [];
    if (isNew) badges.push('NEW SPECIES');
    if (isRecord) badges.push('PERSONAL RECORD');
    if (species.conservationMode === 'research-only') badges.push('RESEARCH & RELEASE');
    else if (species.conservationMode === 'release-preferred') badges.push('RELEASE PREFERRED');
    const badge = this.add.text(640, 395, badges.join('  •  ') || 'CATCH RECORDED', {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#9b6630'
    }).setOrigin(0.5);
    const habitat = this.add.text(640, 437,
      `ถิ่นอาศัย: ${species.habitatNote}\n${species.distributionNote}`, {
        fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#3e5655',
        align: 'center', wordWrap: { width: 590 }
      }).setOrigin(0.5);
    const releaseBg = this.add.rectangle(640, 513, 300, 54, 0x246c66, 1)
      .setInteractive({ useHandCursor: true });
    const releaseText = this.add.text(640, 513, 'ปล่อยคืนสู่ธรรมชาติ', {
      fontFamily: 'Arial, sans-serif', fontSize: '19px', fontStyle: 'bold', color: '#f4f3e9'
    }).setOrigin(0.5);
    releaseBg.on('pointerup', () => this.closeCatchCard());
    const note = this.add.text(640, 574,
      'ภาพประกอบชนิดปลาเป็น naturalist study — ยังไม่ใช่ภาพอ้างอิงทางชีววิทยาที่อนุมัติขั้นสุดท้าย', {
        fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#6d7772',
        align: 'center', wordWrap: { width: 610 }
      }).setOrigin(0.5);
    this.overlay.add([shade, card, title, scientific, picture, measure, badge,
      habitat, releaseBg, releaseText, note]);
    this.lastCatch = {
      speciesId: species.id, nameTh: species.nameTh,
      nameEn: species.nameEn, scientific: species.scientific,
      lengthCm: length, weightKg: weight, isNew, isRecord
    };
    this.overlay.setVisible(!this.portraitView);
    this.emitMobileState();
  }

  private closeCatchCard(): void {
    this.overlay.setVisible(false);
    this.lastCatch = null;
    this.phase = 'idle';
    this.status('บันทึกแล้ว และปล่อยคืนเรียบร้อย', 'เล่นต่อได้ทันที หรือพักแล้วกลับมาใหม่ได้ — สถิติถูกเก็บไว้ในเครื่อง');
  }

  private animateWater(): void {
    // Calm highlights plus a localized bobber ripple. Adaptive detail and tick rate.
    const interval = this.effectiveQuality === 'low' ? 0.18 :
      this.effectiveQuality === 'high' ? 0.045 : 0.09;
    if (!this.waterFx || this.waterTick < interval) return;
    this.waterTick = 0;
    this.waterFx.clear();
    const lineCount = this.effectiveQuality === 'low' ? 2 :
      this.effectiveQuality === 'high' ? 8 : 4;
    const spacing = this.effectiveQuality === 'high' ? 96 : 160;
    this.waterFx.lineStyle(1.4, 0xe7e4c4, this.effectiveQuality === 'high' ? 0.18 : 0.11);
    const shift = (this.time.now * 0.010) % spacing;
    for (let row = 0; row < lineCount; row += 1) {
      const y = 403 + row * (212 / Math.max(1, lineCount - 1));
      for (let x = -80 + shift; x < 1045; x += spacing) {
        this.waterFx.lineBetween(x, y, x + 31, y + Math.sin(x * 0.02) * 1.2);
      }
    }
    if (this.hook.active) {
      const pulse = (this.time.now * 0.0011) % 1;
      const activeBite = this.phase === 'bite';
      const radius = 10 + pulse * (activeBite ? 32 : 17);
      this.waterFx.lineStyle(activeBite ? 2.4 : 1.5,
        activeBite ? 0xffe6a1 : 0xd1e3de, (activeBite ? 0.68 : 0.3) * (1 - pulse));
      this.waterFx.strokeEllipse(this.hook.x, this.hook.y + 5, radius * 2, radius * 0.64);
    }
  }

  private drawLine(): void {
    this.lineGraphics.clear();
    if (!this.hook.active) return;
    this.lineGraphics.lineStyle(1.6, 0xe4eee6, 0.84);
    this.lineGraphics.lineBetween(1004, 318, this.hook.x, this.hook.y);
    if (this.phase === 'fight') {
      this.lineGraphics.lineStyle(4, this.tension > 82 ? 0xe28a5a : this.tension < 16 ? 0x7fc0d1 : 0xcbd89a, 0.32);
      this.lineGraphics.lineBetween(1004, 318, this.hook.x, this.hook.y);
    }
  }

  private drawBars(): void {
    this.chargeBar.clear();
    if (this.phase === 'charging') {
      this.chargeBar.fillStyle(0x102f34, 0.9).fillRoundedRect(812, 182, 300, 26, 12);
      const color = this.charge > 0.55 && this.charge < 0.82 ? 0xbfd16e : 0x56a9a4;
      this.chargeBar.fillStyle(color, 1).fillRoundedRect(816, 186, 292 * this.charge, 18, 9);
      this.chargeBar.lineStyle(2, 0xf4e6a6, 0.8).strokeRoundedRect(812 + 300 * 0.55, 181, 82, 28, 8);
    }

    this.tensionBar.clear();
    if (this.phase === 'fight' && this.hookedFish) {
      this.tensionBar.fillStyle(0x102f34, 0.92).fillRoundedRect(812, 180, 330, 62, 14);
      this.tensionBar.fillStyle(0xf0efe5, 0.18).fillRoundedRect(828, 209, 298, 16, 8);
      this.tensionBar.fillStyle(0xa2c47c, 0.28).fillRoundedRect(828 + 298 * 0.2, 207, 298 * 0.62, 20, 8);
      const color = this.tension > 88 ? 0xe17858 : this.tension < 14 ? 0x65a9c5 : 0xc1d67a;
      this.tensionBar.fillStyle(color, 1).fillCircle(828 + 298 * Phaser.Math.Clamp(this.tension / 100, 0, 1), 217, 8);
      this.tensionBar.fillStyle(0xd7e8e4, 0.72).fillRoundedRect(828, 232, 298 * Phaser.Math.Clamp(this.hookedFish.hookedStamina / Math.max(0.01, this.hookedFish.species.stamina), 0, 1), 5, 3);
      this.debugText.setText(`แรงตึง ${Math.round(this.tension)}%\nแรงปลา ${Math.round(this.hookedFish.hookedStamina * 100)}%`);
    } else {
      this.debugText.setText('');
    }
  }

  private syncButtons(): void {
    for (const [id, button] of this.baitButtons) {
      const selected = id === this.selectedBait;
      button.bg.setFillStyle(selected ? 0x2b7770 : 0x123e43, selected ? 1 : 0.9);
      button.bg.setAlpha(this.phase === 'idle' ? 1 : 0.56);
    }

    const setPack = (pack: ButtonPack, active: boolean, color: number) => {
      pack.bg.setFillStyle(active ? color : 0x46595a, active ? 1 : 0.72);
      pack.label.setAlpha(active ? 1 : 0.58);
    };

    setPack(this.castButton, ['idle', 'charging', 'cast', 'bite'].includes(this.phase), 0x1e6f6c);
    this.castButton.label.setText(this.phase === 'charging' ? 'ปล่อยเพื่อเหวี่ยง' : this.phase === 'cast' || this.phase === 'bite' ? 'เก็บสาย' : 'เหวี่ยงเบ็ด');
    setPack(this.hookButton, this.phase === 'bite', 0x9f5c32);
    setPack(this.reelButton, this.phase === 'fight', this.reelHeld ? 0x3a8294 : 0x275c75);
  }

  private refreshHud(): void {
    this.catchCountText.setText(`🎣 รอบนี้ ${this.sessionCatches} ตัว   ·   ทั้งหมด ${this.save.totalCatches} ตัว`);
    this.discoveredText.setText(`📖 Fishdex ${this.save.discovered.length}/${FISH_SPECIES.length} ชนิด   ·   เซฟอัตโนมัติ`);
  }

  private attachMobileControls(): void {
    // Native portrait controls reach the same existing fishing state machine.
    const handler = (event: Event): void => {
      const { action, bait } = (event as CustomEvent<{ action: string; bait?: string }>).detail;
      if (action === 'bait' && BAITS.some(item => item.id === bait)) {
        this.selectBait(bait as BaitId);
      } else if (action === 'castDown') {
        if (this.phase === 'idle') this.beginCharge();
        else if (this.phase === 'cast' || this.phase === 'bite') this.retrieveLine();
      } else if (action === 'castUp') {
        this.releaseCast();
      } else if (action === 'hook') {
        this.tryHook();
      } else if (action === 'reelDown') {
        if (this.phase === 'fight') this.reelHeld = true;
      } else if (action === 'reelUp') {
        this.reelHeld = false;
      } else if (action === 'release' && this.phase === 'result') {
        this.closeCatchCard();
      }
      this.emitMobileState();
    };
    window.addEventListener('fishertown:control', handler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('fishertown:control', handler);
    });
  }

  private emitMobileState(): void {
    if (!this.save) return;
    window.dispatchEvent(new CustomEvent('fishertown:state', {
      detail: {
        phase: this.phase, title: this.mobileTitle, hint: this.mobileHint,
        totalCatches: this.save.totalCatches,
        discovered: this.save.discovered.length,
        speciesTotal: FISH_SPECIES.length,
        selectedBait: this.selectedBait,
        charge: this.charge, tension: this.tension,
        quality: this.selectedQuality,
        activeQuality: this.effectiveQuality,
        fps: this.fpsDisplay,
        catch: this.lastCatch,
        portrait: this.portraitView
      }
    }));
  }

  private attachViewportAndQuality(): void {
    // Phaser RESIZE controls canvas size; camera keeps an independent 1280x720 world.
    const apply = (): void => this.configureViewport();
    this.scale.on(Phaser.Scale.Events.RESIZE, apply);
    window.addEventListener('orientationchange', apply);
    const onQuality = (event: Event): void => {
      const selected = (event as CustomEvent<{ quality: Quality }>).detail.quality;
      if (selected !== 'auto' && selected !== 'low' &&
          selected !== 'balanced' && selected !== 'high') return;
      this.selectedQuality = selected;
      this.effectiveQuality = selected === 'auto' ? 'balanced' : selected;
      this.qualityClock = 0;
      this.qualityCooldown = 5;
      this.emitMobileState();
    };
    window.addEventListener('fishertown:quality', onQuality);
    try {
      const preference = localStorage.getItem('fishertown:quality');
      if (preference === 'low' || preference === 'balanced' || preference === 'high') {
        this.selectedQuality = preference;
        this.effectiveQuality = preference;
      }
    } catch { /* Storage denied; default Auto remains playable */ }
    this.configureViewport();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, apply);
      window.removeEventListener('orientationchange', apply);
      window.removeEventListener('fishertown:quality', onQuality);
    });
  }

  private configureViewport(): void {
    const width = Math.max(1, this.scale.width);
    const height = Math.max(1, this.scale.height);
    this.portraitView = width < height && window.matchMedia('(orientation: portrait)').matches;
    const zoom = this.portraitView ? height / 720 : Math.min(width / 1280, height / 720);
    const camera = this.cameras.main;
    camera.setViewport(0, 0, width, height);
    camera.setZoom(Math.max(0.1, zoom));
    camera.setBackgroundColor('#082a2e');
    for (const item of this.canvasItems) {
      item.setVisible(!this.portraitView);
      if (item instanceof Phaser.GameObjects.Rectangle) {
        if (this.portraitView) item.disableInteractive();
        else item.setInteractive({ useHandCursor: true });
      }
    }
    if (this.portraitView && this.phase === 'result') this.overlay.setVisible(false);
    if (!this.portraitView && this.phase === 'result') this.overlay.setVisible(true);
    this.portraitFocusX = this.portraitView ? 985 : 640;
    camera.centerOn(this.portraitFocusX, 360);
    this.emitMobileState();
  }

  private updateViewport(dt: number): void {
    if (!this.portraitView) return;
    const camera = this.cameras.main;
    const visibleWidth = camera.width / Math.max(0.1, camera.zoom);
    let targetX = 950;
    if (this.phase === 'cast' || this.phase === 'bite') targetX = this.hook.x + 145;
    else if (this.phase === 'fight' && this.hookedFish) targetX = this.hookedFish.x + 125;
    else if (this.phase === 'result') targetX = this.hook.x + 125;
    targetX = Phaser.Math.Clamp(targetX,
      Math.min(640, visibleWidth / 2), Math.max(640, 1280 - visibleWidth / 2));
    const alpha = 1 - Math.exp(-dt * 3.5);
    this.portraitFocusX = Phaser.Math.Linear(this.portraitFocusX, targetX, alpha);
    camera.centerOn(this.portraitFocusX, 360);
  }

  private updatePerformance(dt: number, deltaMs: number): void {
    const sample = Math.min(90, 1000 / Math.max(1, deltaMs));
    this.fpsRolling = this.fpsRolling * 0.94 + sample * 0.06;
    this.fpsClock += dt;
    if (this.fpsClock >= 0.7) {
      this.fpsClock = 0;
      this.fpsDisplay = Math.round(this.fpsRolling);
    }
    this.qualityCooldown = Math.max(0, this.qualityCooldown - dt);
    if (this.selectedQuality !== 'auto' || this.qualityCooldown > 0 ||
        document.hidden) return;
    this.qualityClock += dt;
    if (this.qualityClock < 5) return;
    this.qualityClock = 0;
    if (this.fpsRolling < 39 && this.effectiveQuality !== 'low') {
      this.effectiveQuality = 'low';
      this.qualityCooldown = 8;
    } else if (this.fpsRolling > 55 && this.effectiveQuality === 'low') {
      this.effectiveQuality = 'balanced';
      this.qualityCooldown = 10;
    }
  }

  private status(title: string, hint: string): void {
    this.mobileTitle = title;
    this.mobileHint = hint;
    this.statusText.setText(title);
    this.hintText.setText(hint);
  }
}
