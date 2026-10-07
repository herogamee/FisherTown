import Phaser from 'phaser';
import { BAITS, FISH_SPECIES, type BaitId, type FishSpecies } from './data/fish';
import { FishActor, realisticTextureForSpecies, type HookPoint } from './systems/FishActor';
import { loadSave, persistSave, recordCatch, type FisherSave } from './save';

type GamePhase = 'idle' | 'charging' | 'cast' | 'bite' | 'fight' | 'result';

type BaitButton = {
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

type PrimaryButton = {
  container: Phaser.GameObjects.Container;
  hit: Phaser.GameObjects.Arc;
  caption: Phaser.GameObjects.Text;
};

const WORLD = { left: 34, right: 1045, top: 360, bottom: 630 };
const ROD_TIP = { x: 1072, y: 322 };

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
  private hookButton!: PrimaryButton;
  private castButton!: PrimaryButton;
  private reelButton!: PrimaryButton;
  private baitButtons: Map<BaitId, BaitButton> = new Map();
  private overlay!: Phaser.GameObjects.Container;
  private waterFx!: Phaser.GameObjects.Graphics;
  private waterTick = 0;
  private debugText!: Phaser.GameObjects.Text;
  private lastSavedPhase: GamePhase = 'idle';

  constructor() {
    super('FishingScene');
  }

  preload(): void {
    this.load.image('bg-thailand-sunset', 'assets/generated/bg_thailand_sunset.webp');
    this.load.image('fish-channa-striata', 'assets/generated/fish_snakehead.webp');
    this.load.image('fish-barbonymus-gonionotus', 'assets/generated/fish_silver_barb.webp');
  }

  create(): void {
    this.save = loadSave();
    this.selectedBait = (BAITS.some((bait) => bait.id === this.save.selectedBait) ? this.save.selectedBait : 'worm') as BaitId;
    this.hook.bait = this.selectedBait;

    this.cameras.main.setBackgroundColor('#0b2427');
    this.drawEnvironment();
    this.createFishPopulation();
    this.createFishingGear();
    this.createHud();
    this.createControls();
    this.createResultOverlay();
    this.createPauseSafety();

    this.status('หนองลาดใหญ่ · อยุธยา', 'เลือกเหยื่อ แล้วแตะค้าง “เหวี่ยงเบ็ด” เพื่อกำหนดระยะ');
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

    if (this.phase === 'cast') this.detectBites();
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

    const atmosphere = this.add.graphics().setDepth(-10);
    atmosphere.fillStyle(0x07191b, 0.09).fillRect(0, 360, 1280, 360);
    atmosphere.fillStyle(0x000000, 0.14).fillRoundedRect(18, 16, 322, 58, 16);
    atmosphere.fillStyle(0x000000, 0.13).fillRoundedRect(920, 18, 338, 56, 16);

    this.waterFx = this.add.graphics().setDepth(18);

    this.add.text(34, 26, 'FisherTown', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '31px',
      fontStyle: 'bold',
      color: '#fff7df',
      stroke: '#153a38',
      strokeThickness: 5
    }).setDepth(30);

    this.add.text(938, 31, '☀ 28°C   ·   17:42   ·   น้ำไหลช้า', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      color: '#fff7e2'
    }).setDepth(30);
  }

  private createFishPopulation(): void {
    const picks = [...FISH_SPECIES, FISH_SPECIES[0], FISH_SPECIES[1]];
    picks.forEach((species, index) => {
      const x = Phaser.Math.FloatBetween(120, 960);
      const y = Phaser.Math.FloatBetween(404, 603);
      const dir = index % 2 === 0 ? 1 : -1;
      this.fish.push(new FishActor(this, species, x, y, dir));
    });
  }

  private createFishingGear(): void {
    const rod = this.add.graphics().setDepth(24);
    rod.lineStyle(5, 0x1a1712, 0.94);
    rod.lineBetween(1268, 255, 1175, 285);
    rod.lineStyle(3, 0x35271b, 0.96);
    rod.lineBetween(1175, 285, ROD_TIP.x, ROD_TIP.y);

    this.lineGraphics = this.add.graphics().setDepth(26);

    const bobberBody = this.add.graphics();
    bobberBody.fillStyle(0xf6f1e2, 1).fillCircle(0, 5, 8);
    bobberBody.fillStyle(0xd4513e, 1).fillRect(-4, -12, 8, 14);
    bobberBody.lineStyle(1, 0x173c42, 0.9).lineBetween(0, 13, 0, 25);
    this.bobber = this.add.container(this.hook.x, this.hook.y, [bobberBody])
      .setDepth(29)
      .setVisible(false);
  }

  private createHud(): void {
    const panel = this.add.graphics().setDepth(30);
    panel.fillStyle(0x06181b, 0.82).fillRoundedRect(22, 86, 366, 92, 18);
    panel.lineStyle(1.5, 0xb9d8d0, 0.28).strokeRoundedRect(22, 86, 366, 92, 18);
    panel.fillStyle(0x06181b, 0.72).fillRoundedRect(404, 86, 354, 92, 18);
    panel.lineStyle(1.5, 0xb9d8d0, 0.22).strokeRoundedRect(404, 86, 354, 92, 18);

    this.statusText = this.add.text(42, 100, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '19px',
      fontStyle: 'bold',
      color: '#fff6dc',
      wordWrap: { width: 330 }
    }).setDepth(31);

    this.hintText = this.add.text(42, 132, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#cee3dd',
      wordWrap: { width: 330 }
    }).setDepth(31);

    this.catchCountText = this.add.text(424, 104, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#f5f1dc'
    }).setDepth(31);

    this.discoveredText = this.add.text(424, 137, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#c2ddd6'
    }).setDepth(31);

    this.chargeBar = this.add.graphics().setDepth(35);
    this.tensionBar = this.add.graphics().setDepth(35);
    this.debugText = this.add.text(790, 96, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#fff5df',
      align: 'right'
    }).setDepth(36);
  }

  private createControls(): void {
    const baitBackdrop = this.add.graphics().setDepth(30);
    baitBackdrop.fillStyle(0x07191c, 0.75).fillRoundedRect(18, 615, 478, 92, 20);
    baitBackdrop.lineStyle(1.5, 0xffffff, 0.16).strokeRoundedRect(18, 615, 478, 92, 20);

    let baitX = 30;
    for (const bait of BAITS) {
      const pack = this.makeBaitButton(baitX, 630, 142, 62, `${bait.icon}  ${bait.label}`);
      pack.bg.on('pointerup', () => this.selectBait(bait.id));
      this.baitButtons.set(bait.id, pack);
      baitX += 150;
    }

    this.castButton = this.makePrimaryButton(930, 643, 56, 'เหวี่ยงเบ็ด', 0x167dc1, '⌁');
    this.castButton.hit.on('pointerdown', () => {
      if (this.phase === 'idle') this.beginCharge();
      else if (this.phase === 'cast' || this.phase === 'bite') this.retrieveLine();
    });
    this.castButton.hit.on('pointerup', () => this.releaseCast());
    this.castButton.hit.on('pointerout', () => {
      if (this.phase === 'charging') this.releaseCast();
    });

    this.hookButton = this.makePrimaryButton(1064, 643, 56, 'HOOK!', 0xd57d20, 'J');
    this.hookButton.hit.on('pointerup', () => this.tryHook());

    this.reelButton = this.makePrimaryButton(1198, 643, 56, 'ดึงสาย', 0x16844b, '▣');
    this.reelButton.hit.on('pointerdown', () => { if (this.phase === 'fight') this.reelHeld = true; });
    this.reelButton.hit.on('pointerup', () => { this.reelHeld = false; });
    this.reelButton.hit.on('pointerout', () => { this.reelHeld = false; });
  }

  private makeBaitButton(x: number, y: number, width: number, height: number, text: string): BaitButton {
    const bg = this.add.rectangle(x, y, width, height, 0x14292d, 0.94)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xffffff, 0.14)
      .setInteractive({ useHandCursor: true })
      .setDepth(31);

    const label = this.add.text(x + width / 2, y + height / 2, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#f7f1df'
    }).setOrigin(0.5).setDepth(32);

    return { bg, label };
  }

  private makePrimaryButton(x: number, y: number, radius: number, text: string, accent: number, icon: string): PrimaryButton {
    const shadow = this.add.circle(3, 5, radius + 4, 0x000000, 0.5);
    const outer = this.add.circle(0, 0, radius + 3, 0x10191b, 0.98).setStrokeStyle(4, accent, 0.95);
    const inner = this.add.circle(0, 0, radius - 4, accent, 0.9).setStrokeStyle(2, 0xffffff, 0.34);
    const shine = this.add.ellipse(-16, -23, radius * 0.95, radius * 0.42, 0xffffff, 0.14).setRotation(-0.25);
    const iconText = this.add.text(0, -12, icon, {
      fontFamily: 'Arial, sans-serif',
      fontSize: icon === 'J' ? '34px' : '31px',
      fontStyle: 'bold',
      color: '#fffdf2'
    }).setOrigin(0.5);

    const caption = this.add.text(0, 27, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#fffdf2'
    }).setOrigin(0.5);

    const hit = this.add.circle(0, 0, radius, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    const container = this.add.container(x, y, [shadow, outer, inner, shine, iconText, caption, hit]).setDepth(34);
    return { container, hit, caption };
  }

  private createResultOverlay(): void {
    this.overlay = this.add.container(0, 0).setDepth(80).setVisible(false);
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
    this.hook.x = Phaser.Math.Clamp(ROD_TIP.x - distance, 120, 920);
    this.hook.y = Phaser.Math.FloatBetween(386, 470);
    this.hook.active = true;
    this.hook.bait = this.selectedBait;
    this.phase = 'cast';
    this.bobber.setPosition(this.hook.x, this.hook.y).setVisible(true);
    this.charge = 0;
    this.status('เหยื่อลงน้ำแล้ว', 'สังเกตปลาในน้ำ — แต่ละชนิดตอบสนองต่อเหยื่อไม่เหมือนกัน');

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

  private detectBites(): void {
    const biting = this.fish.find((fish) => fish.state === 'bite');
    if (!biting) return;
    this.biteFish = biting;
    this.phase = 'bite';
    this.biteWindow = Phaser.Math.Linear(1.65, 0.85, biting.species.wariness);
    this.status('มีปลากินเหยื่อ!', 'แตะ HOOK! ก่อนปลาคายเหยื่อ');
    this.tweens.add({ targets: this.bobber, y: this.hook.y + 24, duration: 110, yoyo: true, repeat: 2 });
  }

  private updateBiteWindow(dt: number): void {
    this.biteWindow -= dt;
    if (this.biteWindow > 0) return;
    if (this.biteFish) this.biteFish.escape();
    this.biteFish = null;
    this.phase = 'cast';
    this.status('ช้าไป — ปลาคายเหยื่อ', 'รออีกตัว หรือแตะปุ่มเหวี่ยงเพื่อเก็บสายแล้วลองตำแหน่งใหม่');
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

    if (fish.hookedStamina <= 0) this.completeCatch(fish);
  }

  private endFight(success: boolean, message: string): void {
    const fish = this.hookedFish;
    if (fish && !success) fish.escape();
    this.hookedFish = null;
    this.hook.active = false;
    this.bobber.setVisible(false);
    this.reelHeld = false;
    this.phase = 'idle';
    this.status(message, 'ลองใหม่ได้ทันที — ไม่มีพลังงานหรือเวลารอ');
  }

  private completeCatch(fish: FishActor): void {
    this.phase = 'result';
    this.reelHeld = false;
    this.hook.active = false;
    this.bobber.setVisible(false);
    this.sessionCatches += 1;
    const record = recordCatch(this.save, fish.species.id, fish.lengthCm, fish.weightKg);
    this.refreshHud();
    this.showCatchCard(fish.species, fish.lengthCm, fish.weightKg, record.isNewSpecies, record.isLengthRecord);
    fish.escape();
    this.hookedFish = null;
  }

  private showCatchCard(species: FishSpecies, length: number, weight: number, isNew: boolean, isRecord: boolean): void {
    this.overlay.removeAll(true);

    const shade = this.add.rectangle(640, 360, 1280, 720, 0x02090b, 0.82).setInteractive();
    const leftGlow = this.add.rectangle(395, 350, 650, 440, 0x102a27, 0.5).setStrokeStyle(1, 0xe7c981, 0.25);
    const panel = this.add.rectangle(970, 354, 490, 510, 0x071216, 0.94).setStrokeStyle(2, 0xaac7c2, 0.3);

    const texture = realisticTextureForSpecies(species.id);
    const hero: Phaser.GameObjects.GameObject[] = [];
    if (texture && this.textures.exists(texture)) {
      const fishImage = this.add.image(395, 355, texture).setDisplaySize(560, 187);
      hero.push(fishImage);
    } else {
      const silhouette = this.add.graphics();
      silhouette.fillStyle(0x829995, 0.5).fillEllipse(395, 355, 430, 118);
      silhouette.fillTriangle(185, 355, 115, 300, 115, 410);
      hero.push(silhouette);
    }

    const newLabel = isNew ? 'ค้นพบใหม่!' : isRecord ? 'สถิติส่วนตัวใหม่!' : 'บันทึกการตกปลา';
    const badge = this.add.text(395, 185, newLabel, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffd875',
      backgroundColor: '#5b431d',
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5);

    const fishName = this.add.text(395, 225, species.nameTh, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '38px',
      fontStyle: 'bold',
      color: '#fff5dc'
    }).setOrigin(0.5);

    const scientific = this.add.text(395, 268, `${species.nameEn} · ${species.scientific}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'italic',
      color: '#cbdcd6'
    }).setOrigin(0.5);

    const title = this.add.text(770, 126, species.nameTh, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '25px',
      fontStyle: 'bold',
      color: '#fff5dc'
    });

    const stats = this.add.text(770, 184,
      `ความยาว     ${length.toFixed(1)} ซม.\n\nน้ำหนัก       ${weight.toFixed(2)} กก.\n\nเหยื่อที่ใช้   ${BAITS.find((b) => b.id === this.selectedBait)?.label ?? '-'}\n\nสถานที่       หนองลาดใหญ่\n\nเวลา           17:42 น.`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#edf1e8',
        lineSpacing: 4
      }
    );

    const detail = this.add.text(770, 408, `ถิ่นอาศัย: ${species.habitatNote}\n${species.distributionNote}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#b9cec7',
      wordWrap: { width: 400 },
      lineSpacing: 7
    });

    const releaseBg = this.add.rectangle(970, 558, 310, 64, 0x0878a3, 0.96)
      .setStrokeStyle(3, 0x61d5ff, 0.65)
      .setInteractive({ useHandCursor: true });
    const releaseText = this.add.text(970, 558, '≋  ปล่อยคืนธรรมชาติ', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);
    releaseBg.on('pointerup', () => this.closeCatchCard());

    this.overlay.add([shade, leftGlow, panel, ...hero, badge, fishName, scientific, title, stats, detail, releaseBg, releaseText]);
    this.overlay.setVisible(true);
  }

  private closeCatchCard(): void {
    this.overlay.setVisible(false);
    this.phase = 'idle';
    this.status('บันทึกแล้ว และปล่อยคืนเรียบร้อย', 'เล่นต่อได้ทันที หรือพักแล้วกลับมาใหม่ได้ — สถิติถูกเก็บไว้ในเครื่อง');
  }

  private animateWater(): void {
    if (!this.waterFx || this.waterTick < 0.06) return;
    this.waterTick = 0;
    this.waterFx.clear();
    this.waterFx.lineStyle(1.5, 0xe8f4df, 0.18);
    const shift = (this.time.now * 0.02) % 110;
    for (let x = -80 + shift; x < 1080; x += 110) {
      this.waterFx.beginPath();
      this.waterFx.moveTo(x, 356);
      this.waterFx.lineTo(x + 30, 353);
      this.waterFx.lineTo(x + 62, 357);
      this.waterFx.strokePath();
    }
  }

  private drawLine(): void {
    this.lineGraphics.clear();
    if (!this.hook.active) return;

    this.lineGraphics.lineStyle(1.5, 0xf0f4e8, 0.9);
    this.lineGraphics.lineBetween(ROD_TIP.x, ROD_TIP.y, this.hook.x, this.hook.y);

    if (this.phase === 'fight') {
      this.lineGraphics.lineStyle(3.5, this.tension > 82 ? 0xff8b63 : this.tension < 16 ? 0x74c8e3 : 0xd9df8a, 0.32);
      this.lineGraphics.lineBetween(ROD_TIP.x, ROD_TIP.y, this.hook.x, this.hook.y);
    }
  }

  private drawBars(): void {
    this.chargeBar.clear();
    if (this.phase === 'charging') {
      this.chargeBar.fillStyle(0x06181b, 0.92).fillRoundedRect(784, 184, 340, 34, 17);
      this.chargeBar.fillStyle(0x253d3d, 1).fillRoundedRect(792, 192, 324, 18, 9);
      const color = this.charge > 0.55 && this.charge < 0.82 ? 0xe6c75e : 0x4fc4d8;
      this.chargeBar.fillStyle(color, 1).fillRoundedRect(792, 192, 324 * this.charge, 18, 9);
    }

    this.tensionBar.clear();
    if (this.phase === 'fight' && this.hookedFish) {
      this.tensionBar.fillStyle(0x06181b, 0.94).fillRoundedRect(790, 174, 350, 78, 16);
      this.tensionBar.lineStyle(1.5, 0xffffff, 0.18).strokeRoundedRect(790, 174, 350, 78, 16);
      this.tensionBar.fillStyle(0x23383a, 1).fillRoundedRect(806, 211, 318, 18, 9);
      this.tensionBar.fillStyle(0x79b85b, 0.35).fillRoundedRect(806 + 318 * 0.2, 209, 318 * 0.62, 22, 10);
      const color = this.tension > 88 ? 0xe95f43 : this.tension < 14 ? 0x50a9d0 : 0xe1c958;
      this.tensionBar.fillStyle(color, 1).fillCircle(806 + 318 * Phaser.Math.Clamp(this.tension / 100, 0, 1), 220, 9);
      this.debugText.setText(`ความตึงสาย  ${Math.round(this.tension)}%\nแรงปลา  ${Math.round(this.hookedFish.hookedStamina * 100)}%`);
    } else {
      this.debugText.setText('');
    }
  }

  private syncButtons(): void {
    for (const [id, button] of this.baitButtons) {
      const selected = id === this.selectedBait;
      button.bg.setFillStyle(selected ? 0x725518 : 0x14292d, selected ? 0.98 : 0.9);
      button.bg.setStrokeStyle(2, selected ? 0xffd665 : 0xffffff, selected ? 0.95 : 0.14);
      button.bg.setAlpha(this.phase === 'idle' ? 1 : 0.58);
      button.label.setAlpha(this.phase === 'idle' ? 1 : 0.58);
    }

    const setPrimary = (button: PrimaryButton, active: boolean) => {
      button.container.setAlpha(active ? 1 : 0.38);
    };

    setPrimary(this.castButton, ['idle', 'charging', 'cast', 'bite'].includes(this.phase));
    setPrimary(this.hookButton, this.phase === 'bite');
    setPrimary(this.reelButton, this.phase === 'fight');

    this.castButton.caption.setText(this.phase === 'charging' ? 'ปล่อยเพื่อเหวี่ยง' : this.phase === 'cast' || this.phase === 'bite' ? 'เก็บสาย' : 'เหวี่ยงเบ็ด');
    this.reelButton.container.setScale(this.reelHeld ? 0.96 : 1);
  }

  private refreshHud(): void {
    this.catchCountText.setText(`🎣 รอบนี้ ${this.sessionCatches} ตัว   ·   ทั้งหมด ${this.save.totalCatches} ตัว`);
    this.discoveredText.setText(`📖 Fishdex ${this.save.discovered.length}/${FISH_SPECIES.length} ชนิด   ·   เซฟอัตโนมัติ`);
  }

  private status(title: string, hint: string): void {
    this.statusText.setText(title);
    this.hintText.setText(hint);
  }
}
