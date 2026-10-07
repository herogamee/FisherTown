# Fish Ecology & Data Model

## Principle

FisherTown ต้องแยก Biological Truth ออกจาก Game Balance

Biological Truth:
- taxonomy
- native range
- introduced range
- habitat
- water type
- climate
- morphology
- diet type
- migration type
- behavior evidence
- size evidence
- source provenance

Game Balance:
- encounter abundance
- fight difficulty
- XP
- rewards
- unlock level
- tutorial priority

ห้ามแก้ข้อมูลจริงเพื่อบาลานซ์เกม ให้แก้ game layer แทน

## Species Identity

Primary key:
scientific_name canonical + internal stable id

เก็บ:
- genus
- species
- scientific name
- accepted name source
- common names per language
- family
- taxonomic source IDs เมื่อมี

ชื่อสามัญเปลี่ยนได้ แต่ ID ภายในห้ามผูกกับชื่อสามัญ

## Distribution

แยก:
- native regions
- introduced regions
- uncertain regions
- blocked regions

แต่ละ record ต้องมี source provenance

Freshwater priority:
- basin
- watershed
- connected water system
- country display

Marine priority:
- ocean/sea
- FAO area
- coastal country
- depth/habitat

## Habitat Tags

ตัวอย่าง controlled vocabulary:
- freshwater
- brackish
- marine
- river_main_channel
- tributary
- rapid
- riffle
- deep_pool
- backwater
- floodplain
- flooded_forest
- lake_littoral
- lake_pelagic
- reservoir
- swamp
- estuary
- mangrove
- seagrass
- rocky_shore
- coral_reef
- reef_dropoff
- continental_shelf
- pelagic_ocean
- benthic_deep

## Environmental Niche

ค่าที่เก็บเมื่อมีแหล่งอ้างอิงพอ:
- temperature range
- salinity class
- depth range
- flow preference
- clarity preference
- substrate
- cover association
- diel activity
- seasonality
- migration

ไม่เติมเลขเพื่อให้ schema ดูครบ ถ้าไม่มีข้อมูลให้ null + research status

## Diet & Feeding Guild

guild:
- herbivore
- detritivore
- planktivore
- insectivore
- molluscivore
- crustacean_feeder
- piscivore
- omnivore
- scavenger
- mixed_predator

presentation tags:
- surface
- midwater
- bottom
- structure
- current_edge
- open_water

Bait compatibility มาจาก guild + local prey model ไม่ใช่ hard-code ว่า species กินเหยื่อชนิดเดียว

## Behaviour Profile

แกน 0–1:
- activity
- aggression
- wariness
- schooling
- structure_affinity
- bottom_affinity
- surface_affinity
- burst_power
- endurance
- jump_tendency
- direction_change
- obstacle_seeking

ค่าเหล่านี้เป็น Game Interpretation ของ biology ต้องติดสถานะ curated_gameplay ไม่ใช่ factual measurement

## Population Layer

หนึ่ง Spot เก็บ population profile:
- species id
- presence
- seasonal availability
- habitat pockets
- base abundance band
- length distribution
- activity windows

ตอนโหลดฉาก:
1. filter range
2. filter season
3. score habitat suitability
4. create population pool
5. spawn/promote เฉพาะ active individuals

## Encounter Formula

แนวคิด:
EncounterWeight =
BaseAbundance
× RangeValidity
× HabitatSuitability
× SeasonFactor
× TimeFactor
× WeatherFactor
× LocalPressureFactor

Bait ไม่ควรสร้างปลาที่ไม่มีอยู่ใน population
Bait มีผลหลังจาก population exists แล้ว

## Individual Fish

runtime instance:
- instance id
- species id
- length
- weight
- energy
- hunger
- confidence
- current state
- habitat pocket
- injury/condition abstraction if needed
- hooked state
- stamina
- escape memory within session

## Trophy Model

Trophy ไม่ใช้ rarity color อย่างเดียว

เกณฑ์:
- percentile within plausible local size distribution
- personal record
- spot record
- region record
- verified competitive record if online mode

ระดับ:
- Typical
- Quality
- Trophy
- Exceptional
- Record-class

ระบบต้องไม่ generate ตัวที่เกิน maximum evidence โดยไม่มี developer override พร้อมเหตุผล

## Weight Model

Preferred:
W = a × L^b

แต่ต้องรู้:
- unit ของ L
- unit ของ W
- sex/stock differences
- source

ถ้าไม่มี reliable parameters:
ใช้ curated curve + confidence flag

ทุกตัวเก็บ:
- measured length
- estimated weight
- method
- source/model version

## Fight Translation

Biology → Game:
- body mass → pull baseline
- body form → acceleration profile
- habitat → obstacle behavior
- migration/open-water habit → runner tendency
- ambush predator → burst tendency
- surface behavior → jump/surface tendency when supported

ห้ามอ้างว่า game behaviour เป็น fact 100%
Fishdex แยก “Natural history” กับ “In-game fight notes”

## Conservation / Sensitive Species

fields:
- conservation_handling: normal / release_preferred / release_only / photo_only / research_only
- legal_note
- source
- review date

สถานะในเกมต้องผ่าน editorial review
ไม่ import IUCN API เข้า commercial build โดยอัตโนมัติ

## Data Confidence

ทุก field ที่สำคัญมี provenance:
- verified_primary
- verified_secondary
- cross_checked
- editorial
- gameplay_curated
- pending_review

Species พร้อม production ต้อง:
- taxonomy verified
- range verified
- habitat verified
- image reference legal review
- local naming reviewed
- conservation handling reviewed

## Source Refresh

เก็บ:
- source URL
- source organization
- access date
- dataset license
- dataset DOI if applicable
- reviewer
- last verified date

ข้อมูล distribution เป็นสิ่งที่ update ได้ จึงต้อง version data แยกจาก game code

## Scale Goal

Prototype: 12–20 species
Vertical slice: 30–50
v1 target: 100–150 carefully verified species
Long-term: หลายร้อยถึงหลักพัน species เมื่อ content pipeline และ licensing พร้อม

คุณภาพและ provenance สำคัญกว่าการยัด species ให้มากที่สุด
