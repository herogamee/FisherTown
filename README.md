# FisherTown

เกมตกปลาแนว `Cozy World Fishing / Fish Life Simulation` สำหรับเว็บและมือถือทั้งแนวนอนและแนวตั้ง โดยใช้โลกจริงและปลาจริงเป็นแกนหลัก

> เป้าหมาย: เปิดเกมแล้วผ่อนคลาย เล่น 2–10 นาทีได้ พักเมื่อไรก็ได้ กลับมาเล่นต่อได้ทันที แต่มีโลกและการสะสมลึกพอให้เล่นต่อเนื่องเป็นเดือนหรือเป็นปี

## Product Direction

- Platform หลัก: Mobile Web (Landscape + portrait)
- Engine: Phaser 4 + TypeScript
- Rendering: 2D HD / 2.5D effects
- Input: Touch-first, รองรับ Mouse/Keyboard
- Web App: PWA-ready
- Target: 60 FPS บนอุปกรณ์ระดับกลาง
- Game Pillars:
  1. Relaxing short sessions
  2. Real fish, real habitats, real-world inspired geography
  3. Skill-based fishing ที่เข้าใจง่ายแต่มีความลึก
  4. Collection / personal records / aquarium / museum
  5. No hard FOMO — หยุดแล้วกลับมาเล่นต่อได้
  6. Long-term expansion โดยเพิ่มปลาและแหล่งน้ำได้โดยไม่ต้องเปลี่ยนแกนเกม

## Fantasy ของผู้เล่น

ผู้เล่นเริ่มจากเมืองชาวประมงเล็ก ๆ ชื่อ **FisherTown** มีคันเบ็ดธรรมดา เรือเล็ก และสมุดปลาเปล่า จากนั้นค่อย ๆ เดินทางไปยังแหล่งน้ำทั่วโลก เรียนรู้ธรรมชาติของปลาแต่ละชนิด ทำสถิติ สะสมภาพและข้อมูล สร้าง Aquarium และพัฒนาเมืองของตัวเอง

เกมไม่เน้นการฆ่าหรือขายปลาหายากเป็นหลัก แต่ให้คุณค่ากับ:
- การค้นพบ
- การถ่ายภาพ
- การบันทึกสถิติ
- Catch & Release
- การเรียนรู้ถิ่นอาศัยจริง
- การสะสมปลาใน Aquarium แบบจำลอง
- การสร้างเมืองและชุมชนนักตกปลา

## Core Session

```
เลือกสถานที่
  ↓
ดูสภาพน้ำ / เวลา / อากาศ / ปลาที่มีโอกาสพบ
  ↓
เลือกเบ็ด + สาย + เหยื่อ
  ↓
เหวี่ยงเบ็ด
  ↓
ปลาเข้าหา / ตรวจเหยื่อ / กินเหยื่อ
  ↓
Hook
  ↓
Fight: tension + stamina + direction
  ↓
Landing
  ↓
วัดความยาว / น้ำหนัก / ถ่ายภาพ
  ↓
เก็บสถิติ / ปล่อย / นำไปใช้ตามกติกาของพื้นที่
```

รอบปกติควรจบได้ใน 2–5 นาที และรอบปลาใหญ่หรือ Trophy Fish ประมาณ 5–10 นาที

## Repository Structure

- `docs/01-VISION.md` — วิสัยทัศน์และกฎของโลก
- `docs/02-CORE-GAMEPLAY.md` — ระบบตกปลาและการควบคุม
- `docs/03-WORLD-ATLAS.md` — โครงโลก ประเทศ ลุ่มน้ำ และ Expedition
- `docs/04-FISH-ECOLOGY-DATA.md` — โมเดลปลาและระบบนิเวศ
- `docs/05-ART-DIRECTION.md` — แนวภาพปลา ฉาก น้ำ UI และ Animation
- `docs/06-PROGRESSION-AND-RETENTION.md` — Progression แบบไม่บังคับเล่นนาน
- `docs/07-TECH-ARCHITECTURE.md` — สถาปัตยกรรม Phaser/Web
- `docs/08-CONTENT-ROADMAP.md` — แผนทำ Prototype → v1 → World Expansion
- `research/DATA-SOURCES-AND-LICENSING.md` — แหล่งข้อมูลและข้อควรระวังด้านสิทธิ์
- `data/fish-spec.schema.json` — Schema ข้อมูลปลามาตรฐาน
- `data/fish-seed.json` — ปลาจริงชุดเริ่มต้นหลายภูมิภาค
- `data/world-regions.json` — พื้นที่โลกชุดเริ่มต้น

## Non-negotiable Design Rules

1. ปลาจริงต้องใช้ชื่อวิทยาศาสตร์เป็น Primary ID
2. ภาพปลาต้องอิงรูปร่างและสีของชนิดจริง ไม่เปลี่ยนจนจำชนิดไม่ได้
3. ถิ่นอาศัยต้องอิงข้อมูลจริงระดับประเทศ/ลุ่มน้ำ/ทะเล ไม่สุ่มประเทศเพื่อความสะดวก
4. ชนิดพันธุ์ต่างถิ่นต้องระบุว่า `introduced` แยกจาก `native`
5. พื้นที่จริงไม่จำเป็นต้องเป็น GIS จำลอง 1:1 แต่ ecology ต้องสอดคล้องกับสถานที่จริง
6. ปลาอนุรักษ์หรือชนิดอ่อนไหวใช้ระบบ Encounter / Photo / Tag / Release เป็นหลัก
7. ไม่มี Energy Wall ที่บังคับให้รอเพื่อเล่นต่อ
8. ไม่มี Daily Streak ที่ลงโทษผู้เล่นเมื่อหยุดพัก
9. Event ที่พลาดต้องมีวิธีกลับมาเล่นซ้ำหรือหมุนเวียนกลับมา
10. Monetization ห้ามขาย Power ที่ทำลายการตกปลาและสถิติ

## Current Status

Concept foundation / World Bible initialized. Fishing Lab v0.4 (portrait camera, quality presets and ten species illustrated art) implemented.

เริ่มจาก Prototype หนึ่งพื้นที่ในประเทศไทยก่อน แล้วใช้โครงเดียวกันขยายไป Amazon, North America, Europe, Africa, Japan, Australia, Oceanic และภูมิภาคอื่น ๆ


## Playable Prototype — Fishing Lab v0.1

Fishing Lab v0.1 is now implemented in the repository.

Current loop:

```
เลือกเหยื่อ
→ แตะค้างเพื่อเหวี่ยง
→ ปลาในฉากตรวจเหยื่อ
→ Bite
→ HOOK
→ คุมแรงตึงสาย
→ Landing
→ Record
→ Catch & Release
```

Prototype content:
- 1 Thailand freshwater-inspired spot
- 10 real fish species in the data layer
- 3 bait classes
- visible fish AI
- species-specific attraction / wariness / power / stamina
- tension-based fight
- Fishdex discovery + personal records
- local auto-save
- landscape mobile UI
- PWA shell

Run locally:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

See `docs/09-FISHING-LAB-V0.1.md` for controls, implemented features, known art limitations, and the next gates.

> v0.1 fish graphics are procedural morphology placeholders for gameplay validation. Final fish art must follow the species-accurate pipeline in `docs/05-ART-DIRECTION.md`.


## Fishing Lab v0.3.1 — Portrait controls + species illustrations

- Generated golden-hour scenery is wired into the Phaser scene; the full fishing state machine is retained after recovery from a broken partial scene commit.
- Every one of the ten Thai freshwater species has its own transparent SVG naturalist-study illustration (`public/assets/fish/<scientific-slug>.svg`) for swimming and landing. These are an **interim illustrated art pass**, not final photorealistic, scientifically certified image assets.
- On portrait phones, the 16:9 river simulation sits above a separate **full-height touch control panel**: bait selection, hold-to-cast, hook timing, hold-to-reel, tension meter, Fishdex count, and release button. The control panel scrolls if the screen is short. Landscape keeps the original simulation controls.
- Fullscreen button stays visible; desktop browsers use native Fullscreen API and unsupported browsers use edge-to-edge web-app fallback. PWA does not force landscape.
- Both CI and Pages run `npm run validate` before TypeScript compile + Vite build to catch missing assets and accidental scene truncation.

Live demo: https://herogamee.github.io/FisherTown/ (updated after GitHub Pages deploy succeeds)

See `docs/10-PORTRAIT-ART-RECOVERY.md` for limitations, testing and next art gates.


## v0.4 art delivery

`scripts/optimize-art.mjs` runs before `npm run dev` and `npm run build`: it converts the checked-in source PNG to a **1280×720 WebP at quality 83**, using `sharp`. Runtime loads the WebP, while the original full-size PNG is kept in Git for provenance and removed only from the *built dist* to save bandwidth. Species-specific SVGs are rasterized to 560×280 textures to improve retina landing-card clarity. All source image/illustration rights must still be reviewed before commercial release.


## v0.4 — adaptive portrait fishing and runtime QA

- The Phaser canvas itself becomes tall in portrait via `Phaser.Scale.RESIZE`, while an explicit camera keeps a **1280×720 world** and pans horizontally to follow the lure/fight. No image stretching or landscape-only orientation requirement.
- Original landscape HUD and controls are preserved and hidden only in portrait. A native HTML catch card appears for portrait so text and release controls do not get cropped by the narrow camera.
- Four quality modes: Auto, Low, Balanced and High. Fish AI uses a bounded fixed time step; water highlights redraw at a quality-dependent cadence. Quality persists via localStorage where supported.
- The checked-in 2.8MB sunset PNG is compressed to a 1280×720 WebP before dev/build. CI observed a 238,116-byte WebP (about 91% smaller). Dist keeps the optimized image only, original stays in Git.
- Ten fish naturalist SVGs have additional texture/lighting and remain **interim illustrations**, not photoreal final species art.
- CI includes Chromium Playwright smoke for **portrait size, holding/releasing cast, quality selection, landscape → portrait → landscape**, with screenshots saved as an artifact. Tests run against **production Vite preview**.

See `docs/11-V0.4-RELEASE-NOTES.md` for gates, remaining art work and manual iOS/Android validation.


## Thailand Fish Atlas (research catalog, 2026-10-09)

Research branch includes **269** region-listed name pairs, **62** notable Thai fish profile references and **299** unique nominal name keys after exact-name deduplication (potential synonyms unresolved). This is a curated **non-playable** research catalog, not a definitive accepted-species checklist. Existing gameplay and the worldwide seed remain unchanged.

- `data/fish-atlas/thailand/catalog-index.json` — unified candidate names with provenance, not playable
- `data/fish-atlas/thailand/songkhla-regional-candidates.json` — ONEP area source leads
- `data/fish-atlas/thailand/priority-taxa.json` — Thai popular, ornamental, rare/conservation-interest picks
- `research/FISH-ATLAS-SOURCE-AUDIT.md` — authority, bibliography, quality/licensing gates and global roadmap
- `npm run atlas:check` — verification and reproducible index consistency

See [ONEP freshwater checklist](https://chm-thai.onep.go.th/?p=1573) for the 2017 national reference (858 species, not a repository import count).
