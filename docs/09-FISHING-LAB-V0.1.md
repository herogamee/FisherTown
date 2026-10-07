# Fishing Lab v0.1

## Purpose

Vertical gameplay laboratory สำหรับพิสูจน์ว่า core fishing ของ FisherTown สนุกบนมือถือแนวนอนก่อนเริ่มสร้างเมือง ระบบออนไลน์ และ World Atlas เต็มรูปแบบ

## Implemented

- Phaser 4.2.1 + TypeScript + Vite
- Landscape 16:9, touch-first
- PWA manifest + basic service worker
- Thailand freshwater prototype spot
- 10 fish species represented as morphology-aware procedural placeholders
- 3 bait classes: worm, small fish, spinner
- Hold/release cast power
- Visible fish simulation
- Fish cruise → investigate → bite → escape states
- Species-specific bait attraction, wariness, power, stamina and fight styles
- Hook timing window
- Tension-based fight
- Line-break and slack-escape fail states
- Landing card with Thai/common/scientific names, size, habitat note, record badges
- Catch & release loop
- Local Fishdex, personal records and auto-save
- Browser background pause safety
- Reduced active fish count for mobile performance
- CI typecheck + production build on every push to main

## Controls

### Idle
- เลือกเหยื่อทางซ้ายล่าง
- แตะค้าง **เหวี่ยงเบ็ด**
- ปล่อยเมื่อได้ระยะที่ต้องการ

### Waiting
- สังเกตปลาที่เข้ามาดูเหยื่อ
- กด **เก็บสาย** เพื่อเปลี่ยนตำแหน่งได้ทันที

### Bite
- กด **HOOK!** ภายในหน้าต่างเวลาที่ปลาแต่ละชนิดกำหนด

### Fight
- กดค้าง **ดึงสาย** เพื่อรีลปลาเข้า
- ปล่อยเมื่อแรงตึงสูง
- ห้ามปล่อยสายหย่อนนานเกินไป
- Tension สูงเกิน 100 = สายขาด

## Fish in Prototype

1. Barbonymus gonionotus — ปลาตะเพียนขาว
2. Channa striata — ปลาช่อน
3. Channa micropeltes — ปลาชะโด
4. Pangasianodon hypophthalmus — ปลาสวาย
5. Clarias macrocephalus — ปลาดุกอุย
6. Anabas testudineus — ปลาหมอไทย
7. Trichopodus pectoralis — ปลาสลิด
8. Notopterus notopterus — ปลาสลาด
9. Wallago attu — ปลาเค้า
10. Catlocarpio siamensis — ปลากระโห้

## Important Art Note

ปลาใน v0.1 เป็น procedural vector placeholder ที่แยก silhouette/morphology ตามกลุ่มปลาเพื่อให้ gameplay ไม่ต้องรอ art production

Production art ต้องทำตาม `docs/05-ART-DIRECTION.md`:
- species-specific morphology
- reference/licensing checklist
- natural proportions and coloration
- close-up landing art
- mobile gameplay LOD

ห้ามถือ procedural placeholder ใน v0.1 เป็น final fish art

## Data Note

ค่าขนาดใน prototype คือ local gameplay population ranges ไม่ใช่ biological maximum หรือ world record

Species ที่ `prototype-review` ยังต้องผ่าน production research gates ก่อนใช้ใน release เชิงพาณิชย์

## Next Gates

### v0.2
- เปลี่ยน procedural fish เป็น species asset manifest + first realistic fish set
- underwater habitat pockets
- bait presentation depth
- rod/line classes
- drag adjustment
- sound/haptic cues
- better casting target control

### v0.3
- Thailand spot selector 3 habitats
- Fishdex screen
- Aquarium first room
- personal record journal
- graphics quality presets
- installable PWA icon set

### Vertical Slice
- FisherTown hub
- 20–30 verified Thai species
- 3–4 waterbody types
- Museum / Research Center
- Passport progression
