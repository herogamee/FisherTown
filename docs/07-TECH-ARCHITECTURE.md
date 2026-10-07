# Technical Architecture

## Client Stack

- Phaser 4
- TypeScript
- Vite
- WebGL
- Web Audio
- PWA
- Responsive landscape-first layout

## Performance Goal

Target:
- 60 FPS บนมือถือระดับกลางที่รองรับ WebGL เหมาะสม
- graceful fallback 30 FPS mode
- fast first playable path

Simulation:
- fixed timestep 30 Hz สำหรับ fish/fishing logic
- render up to display refresh
- interpolate visuals
- pause simulation เมื่อ browser hidden

## Scene Structure

Suggested scenes:
- BootScene
- PreloadScene
- MainMenuScene
- FisherTownScene
- WorldMapScene
- ExpeditionScene
- FishingScene
- LandingScene
- AquariumScene
- MuseumScene

Fishing submodules:
- CastingController
- LineController
- ReelController
- HookController
- FishPopulationSystem
- FishAI
- FightController
- WaterConditionSystem
- HabitatSystem
- CatchRecorder

## Data-driven Content

Code ห้าม hard-code species content

Data:
- species
- regions
- waterbodies
- spots
- tackle
- bait
- quests
- localization
- art manifests

Content update ควรเพิ่ม JSON/asset ได้โดยแก้ gameplay code น้อยที่สุด

## Species Runtime Layers

1. SpeciesDefinition — factual/editorial data
2. RegionPopulationDefinition — species exists here or not
3. SpotPopulation — local abundance and size profile
4. FishRuntime — individual instance
5. HookedFishState — fight state

แยกเพื่อ scale ไปหลักร้อย/พัน species

## Spawn Determinism

ใช้ seeded RNG ต่อ expedition สำหรับ:
- population candidates
- weather variant
- ambient events

ประโยชน์:
- debug ทำซ้ำได้
- bug report มี seed
- tournament fair mode ทำ server-verified seed ได้

## Mobile Landscape

Baseline design canvas:
16:9 logical coordinate system

ต้องรองรับ:
- 844x390 class
- 932x430 class
- tablets
- desktop wide screen

ใช้ safe area
UI anchors ตาม edges
world camera ขยาย field ไม่ stretch sprite

Portrait:
- แสดง rotate device overlay
- menu บางหน้าอาจใช้ portrait responsive ได้ แต่ gameplay landscape only ในช่วงแรก

## Asset Strategy

ใช้:
- texture atlas
- WebP/AVIF where suitable for static imagery
- compressed audio
- lazy load by region
- fish asset bundles by family/region

อย่า preload ปลาโลกทั้งใบ

Budget ต่อ active fishing scene:
- จำกัด draw calls
- pool particles
- pool fish runtime
- cap visible fish
- use LOD for distant environmental layers

## Save Model

Local:
- IndexedDB
- settings
- temporary session checkpoint
- offline-safe progress queue

Online account:
- server source of truth สำหรับ economy/competitive records
- sync client progress with idempotent operations

v0 prototype ใช้ local save ก่อน
v1 online layer ค่อยเพิ่ม

## Suggested Server

เมื่อจำเป็น:
- Node.js + TypeScript
- PostgreSQL
- Redis optional
- REST/JSON สำหรับ account/content
- WebSocket only where real-time needed

## Record Integrity

Casual records:
client accepted

Competitive records:
server validates:
- content version
- region seed
- tackle config
- species model version
- plausible fight result
- no impossible size

ไม่ต้อง server-authoritative ทุก frame สำหรับ casual play

## PWA

Goals:
- installable
- cache shell/assets
- last loaded region playable where design permits
- resume quickly
- update content safely

Service worker update ต้องไม่ reload กลาง fight

## Audio

unlock audio on user gesture
suspend on hidden
resume gently
music separate from ambience/sfx sliders

## Accessibility

- text size scaling
- strong bite cue
- reduced motion
- reduced water shader
- color-independent tension cues
- left-handed control layout
- vibration toggle
- simplified fight control option

## Content Tools

Future internal editor:
- species editor
- region population editor
- spot habitat editor
- spawn preview
- size distribution simulator
- fight profile tester
- mobile performance inspector
- source/provenance checklist

## Testing Gates

Per build:
- TypeScript compile
- unit tests for length/weight and spawn filters
- schema validation
- no species outside allowed region fixture
- save/resume regression
- mobile viewport tests
- hidden-tab pause test
- asset manifest validation
- missing localization report
