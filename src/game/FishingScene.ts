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
    const bg = this.add.graphics();
    bg.fillStyle(0xa9d9d4, 1).fillRect(0, 0, 1280, 720);
    bg.fillStyle(0xf0dca8, 1).fillCircle(190, 104, 46);

    bg.fillStyle(0x7ca99b, 1);
    bg.fillTriangle(0, 320, 220, 142, 445, 320);
    bg.fillTriangle(250, 320, 500, 118, 760, 320);
    bg.fillTriangle(610, 320, 830, 166, 1080, 320);
    bg.fillStyle(0x6b9484, 1);
    bg.fillTriangle(870, 320, 1080, 132, 1280, 320);

    bg.fillStyle(0x386e58, 1).fillRect(0, 292, 1280, 65);
    for (let x = 0; x < 1080; x += 34) {
      const h = 28 + ((x * 17) % 42);
      bg.fillStyle(x % 68 === 0 ? 0x315e4d : 0x3d765c, 1);
      bg.fillTriangle(x, 330, x + 15, 330 - h, x + 31, 330);
    }

    bg.fillStyle(0x2e8791, 1).fillRect(0, WORLD.top, 1082, WORLD.bottom - WORLD.top + 40);
    bg.fillStyle(0x287985, 0.82).fillRect(0, 456, 1082, 230);
    bg.fillStyle(0x246d79, 0.78).fillRect(0, 545, 1082, 140);
    bg.fillStyle(0x173f43, 1).fillRect(0, 642, 1082, 78);

    bg.fillStyle(0x76583f, 1).fillRect(1082, 330, 198, 390);
    bg.fillStyle(0x8f714f, 1).fillRect(1068, 365, 212, 26);
    bg.fillStyle(0x5b432f, 1);
    for (let x = 1082; x < 1280; x += 28) bg.fillRect(x, 391, 4, 329);

    bg.lineStyle(5, 0x56764d, 0.92);
    for (let i = 0; i < 12; i += 1) {
      const x = 60 + i * 17;
      bg.lineBetween(x, 408, x + (i % 2 ? 7 : -5), 348 + (i % 3) * 8);
    }
    bg.lineStyle(10, 0x4f3a2b, 0.56).lineBetween(410, 575, 570, 604);

    this.waterFx = this.add.graphics();

    this.add.text(28, 20, 'FisherTown', {
      fontFamily: 'Arial, sans-serif', fontSize: '27px', fontStyle: 'bold', color: '#0b3036'
    });
    this.add.text(30, 51, 'Fishing Lab v0.1 · Thailand Freshwater', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#31565a'
    });

    this.add.text(1000, 25, '☁  เย็นสบาย  •  น้ำไหลช้า', {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#17484f'
    }).setOrigin(1, 0);
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
    const angler = this.add.graphics();
    angler.fillStyle(0xe5c29b, 1).fillCircle(1175, 327, 19);
    angler.fillStyle(0x294953, 1).fillRoundedRect(1152, 347, 48, 76, 15);
    angler.fillStyle(0x21383f, 1).fillRoundedRect(1148, 412, 24, 58, 10);
    angler.fillRoundedRect(1182, 412, 24, 58, 10);
    angler.lineStyle(5, 0x513b2d, 1).lineBetween(1165, 363, ROD_TIP.x, ROD_TIP.y);
    angler.lineStyle(4, 0x513b2d, 1).lineBetween(ROD_TIP.x, ROD_TIP.y, 1004, 318);
    angler.lineStyle(2.5, 0xd1b06d, 1).lineBetween(1004, 318, 1032, 312);

    this.lineGraphics = this.add.graphics();
    const bobberBody = this.add.graphics();
    bobberBody.fillStyle(0xf2ede0, 1).fillCircle(0, 5, 7);
    bobberBody.fillStyle(0xcf593f, 1).fillRect(-3, -10, 6, 12);
    bobberBody.lineStyle(1, 0x173c42, 0.8).lineBetween(0, 12, 0, 24);
    this.bobber = this.add.container(this.hook.x, this.hook.y, [bobberBody]).setVisible(false);
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
    this.showCatchCard(fish.species, fish.lengthCm, fish.weightKg, record.isNewSpecies, record.isLengthRecord);
    fish.escape();
    this.hookedFish = null;
  }

  private showCatchCard(species: FishSpecies, length: number, weight: number, isNew: boolean, isRecord: boolean): void {
    this.overlay.removeAll(true);
    const shade = this.add.rectangle(640, 360, 1280, 720, 0x04191d, 0.76).setInteractive();
    const card = this.add.rectangle(640, 357, 650, 376, 0xf2efe3, 1).setStrokeStyle(4, 0x2b5c5b, 1);
    const title = this.add.text(640, 224, species.nameTh, {
      fontFamily: 'Arial, sans-serif', fontSize: '35px', fontStyle: 'bold', color: '#173d3e'
    }).setOrigin(0.5);
    const scientific = this.add.text(640, 265, `${species.nameEn} · ${species.scientific}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '16px', fontStyle: 'italic', color: '#526463'
    }).setOrigin(0.5);
    const measure = this.add.text(640, 312, `${length.toFixed(1)} cm   ·   ${weight.toFixed(2)} kg`, {
      fontFamily: 'Arial, sans-serif', fontSize: '27px', fontStyle: 'bold', color: '#245d5a'
    }).setOrigin(0.5);

    const badges: string[] = [];
    if (isNew) badges.push('NEW SPECIES');
    if (isRecord) badges.push('PERSONAL RECORD');
    if (species.conservationMode === 'research-only') badges.push('RESEARCH & RELEASE');
    else if (species.conservationMode === 'release-preferred') badges.push('RELEASE PREFERRED');
    const badge = this.add.text(640, 355, badges.join('  •  ') || 'CATCH RECORDED', {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#9b6630'
    }).setOrigin(0.5);

    const habitat = this.add.text(640, 401, `ถิ่นอาศัย: ${species.habitatNote}\n${species.distributionNote}`, {
      fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#3e5655', align: 'center', wordWrap: { width: 560 }
    }).setOrigin(0.5);

    const releaseBg = this.add.rectangle(640, 486, 260, 58, 0x246c66, 1).setInteractive({ useHandCursor: true });
    const releaseText = this.add.text(640, 486, 'ปล่อยคืนสู่ธรรมชาติ', {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#f4f3e9'
    }).setOrigin(0.5);
    releaseBg.on('pointerup', () => this.closeCatchCard());

    const note = this.add.text(640, 536, 'Prototype: ภาพปลาเป็น procedural morphology placeholder — asset สมจริงราย species จะเข้ามาใน art pipeline', {
      fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#6d7772', align: 'center', wordWrap: { width: 570 }
    }).setOrigin(0.5);

    this.overlay.add([shade, card, title, scientific, measure, badge, habitat, releaseBg, releaseText, note]);
    this.overlay.setVisible(true);
  }

  private closeCatchCard(): void {
    this.overlay.setVisible(false);
    this.phase = 'idle';
    this.status('บันทึกแล้ว และปล่อยคืนเรียบร้อย', 'เล่นต่อได้ทันที หรือพักแล้วกลับมาใหม่ได้ — สถิติถูกเก็บไว้ในเครื่อง');
  }

  private animateWater(): void {
    if (!this.waterFx || this.waterTick < 0.055) return;
    this.waterTick = 0;
    this.waterFx.clear();
    this.waterFx.lineStyle(2, 0xb7e1dc, 0.23);
    const shift = (this.time.now * 0.018) % 96;
    for (let y = 370; y < 625; y += 34) {
      for (let x = -60 + shift; x < 1040; x += 96) {
        this.waterFx.beginPath();
        this.waterFx.moveTo(x, y);
        this.waterFx.lineTo(x + 24, y + Math.sin((x + y) * 0.03) * 3);
        this.waterFx.lineTo(x + 48, y);
        this.waterFx.strokePath();
      }
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

  private status(title: string, hint: string): void {
    this.statusText.setText(title);
    this.hintText.setText(hint);
  }
}
