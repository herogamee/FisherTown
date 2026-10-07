# FisherTown

เกมตกปลาแนว `Cozy World Fishing / Fish Life Simulation` สำหรับเว็บและมือถือแนวนอน โดยใช้โลกจริงและปลาจริงเป็นแกนหลัก

> เป้าหมาย: เปิดเกมแล้วผ่อนคลาย เล่น 2–10 นาทีได้ พักเมื่อไรก็ได้ กลับมาเล่นต่อได้ทันที แต่มีโลกและการสะสมลึกพอให้เล่นต่อเนื่องเป็นเดือนหรือเป็นปี

## Product Direction

- Platform หลัก: Mobile Web (Landscape)
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

Concept foundation / World Bible initialized.

เริ่มจาก Prototype หนึ่งพื้นที่ในประเทศไทยก่อน แล้วใช้โครงเดียวกันขยายไป Amazon, North America, Europe, Africa, Japan, Australia, Oceanic และภูมิภาคอื่น ๆ
