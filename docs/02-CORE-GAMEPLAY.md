# Core Gameplay

## Core Loop

เลือกพื้นที่ → อ่านน้ำ → เลือกอุปกรณ์ → เหวี่ยง → รอแบบมีสิ่งให้สังเกต → ปลาเข้าหา → Hook → Fight → Landing → Record → Release/Use → Next Decision

เป้าหมายคือทำให้ช่วงก่อนปลากินเหยื่อมีชีวิต ไม่ใช่ loading bar

## 1. Read the Water

ก่อนเหวี่ยง ผู้เล่นเห็นข้อมูลแบบย่อยง่าย:
- ความลึกโดยประมาณ
- กระแสน้ำ
- ความขุ่น
- โครงสร้าง: หญ้า ไม้จม หิน ร่องน้ำ แนวปะการัง
- เวลาใน Expedition
- สภาพอากาศ
- Surface activity
- คำใบ้จากเสียง/เงา/ฟอง/ฝูงเหยื่อ

ระบบจะไม่บอก exact spawn percentage ในโหมดปกติ

## 2. Tackle Choice

อุปกรณ์หลัก:
- Rod
- Reel
- Line
- Leader
- Hook
- Float / Sinker
- Lure หรือ Bait
- Optional accessory

แต่ UI ต้องมี Smart Setup:
- Recommended
- Light
- Balanced
- Heavy

ผู้เล่นใหม่กด Recommended แล้วตกได้ทันที
ผู้เล่นเก่งปรับละเอียดเพื่อเปลี่ยน presentation และ fight feel

## 3. Casting

Touch-first:
1. แตะค้างเพื่อ Charge
2. Power arc วิ่งผ่าน Sweet Zone
3. ปล่อยเพื่อเหวี่ยง
4. ลากซ้าย/ขวาเล็กน้อยก่อนปล่อยเพื่อกำหนดมุม

ความแม่นไม่ควรลงโทษหนัก
Perfect cast ให้ positioning bonus ไม่ใช่ multiplier โกง

ปัจจัย:
- rod length
- lure/bait mass
- wind
- player timing
- casting skill

## 4. Underwater Fish Simulation

ปลาใน Spot ถูกจำลองเป็นกลุ่มประชากรและ active individuals เท่าที่จำเป็นต่อหน้าจอ

Fish AI states:
- Rest
- Cruise
- Patrol
- School
- Hold in current
- Forage
- Investigate
- Follow
- Strike/Bite
- Spook
- Flee
- Recover

ปลาไม่จำเป็นต้อง render ทุกตัวตลอดเวลา
ระบบ population layer สามารถสร้าง candidate fish แล้ว promote เป็น visible/interactive fish เมื่อเข้าเขตใกล้เหยื่อ

## Habitat Suitability

แต่ละ Spot มี environmental vector:
- water type
- salinity
- temperature
- depth
- flow
- turbidity
- vegetation
- woody structure
- rock/reef
- substrate
- oxygen proxy
- light
- season
- time block

แต่ละ Species มี preference vector

Suitability score:
S = weighted match ของ Species preference กับ Spot condition

S ใช้กำหนด:
- โอกาสมี species ใน population
- ตำแหน่งในฉาก
- activity
- feeding confidence
- size distribution modifier

ห้ามใช้ Suitability เป็นข้ออ้างให้ species ปรากฏนอก native/introduced range ที่กำหนดในข้อมูล

## 5. Bait Interaction

Fish decision ไม่ควรเป็น random bite อย่างเดียว

Bite score ควรประกอบด้วย:
- hunger
- species diet fit
- lure/bait profile
- presentation speed
- depth fit
- local confidence
- light
- water clarity
- fish wariness
- recent disturbance
- small random noise

พฤติกรรม:
- ignore
- inspect
- follow
- short strike
- full bite

ผู้เล่นจึงเรียนรู้ว่า “ปลาเห็นเหยื่อแล้วไม่กิน” และปรับวิธีได้

## 6. Hook Timing

เมื่อ bite เกิด:
- บาง species ต้อง strike เร็ว
- บาง bait ต้องรอโหลดน้ำหนัก
- circle-hook style mechanics สามารถใช้ auto-load แทนการกระชาก

เกมต้องสื่อด้วยภาพ/เสียง:
- float dip
- line twitch
- rod tip
- water ring
- haptic ถ้ารองรับ

Accessibility:
- เปิด Strong Bite Cue ได้
- เพิ่ม visual flash แบบไม่เปลี่ยนโอกาสสำเร็จ

## 7. Fight System

Fight เป็นแกน skill

ตัวแปรหลัก:
- fish stamina
- fish burst power
- fish direction
- fish depth tendency
- line tension
- reel drag
- rod load
- line abrasion
- obstacle risk
- player reel input

Touch controls:
- Hold = reel / apply controlled pressure
- Release = stop reeling / allow recovery of tension
- Drag thumb left-right = rod direction
- Drag setting button = quick drag adjust

Tension มี 3 zone:
- Too slack: เสี่ยงหลุด
- Working zone: ดี
- Overload: เสี่ยงขาด

เป้าหมายไม่ใช่ค้างเข็มตรงกลางตลอด แต่ต้องตอบสนองต่อ fish burst

## Fight Archetypes

ตัวอย่าง:
- Runner: วิ่งยาว ใช้ stamina สูง
- Burster: กระชากสั้นแรง
- Diver: ดำลงลึก
- Structure Seeker: วิ่งเข้าหาไม้/หิน/แนวปะการัง
- Jumper: กระโดด ทำให้ tension เปลี่ยนเร็ว
- Bulldozer: ช้าแต่แรง
- Spinner: เปลี่ยนทิศทางถี่
- School Escape: พุ่งตามฝูง

Species สามารถผสมหลาย archetype

## 8. Landing

Landing เป็นช่วง calm payoff

ข้อมูล:
- species
- common name
- scientific name
- length
- estimated weight
- personal percentile
- condition
- new species?
- personal record?
- local record?
- photo quality
- catch method summary

ตัวเลือก:
- Release
- Record & Release
- Keep only if game rule allows
- Aquarium digital specimen
- Museum donation record

## 9. Size & Weight

ห้ามสุ่มน้ำหนักแบบไม่สัมพันธ์กับความยาว

หลัก:
- ใช้ length distribution ต่อ population
- ถ้ามี validated length-weight parameters ให้คำนวณจาก W = aL^b
- ถ้าไม่มี ให้ใช้ curated species model
- extreme fish ต้องอยู่ใน plausible range
- Trophy ควรเป็น percentile ของ distribution ไม่ใช่สี rarity ที่ไร้ความหมาย

ระดับเชิงเกม:
- Typical
- Good
- Trophy
- Exceptional
- Record-class

## 10. Session Types

### Quick Fishing
2–5 นาที
เข้า spot ล่าสุดทันที
เหมาะกับมือถือ

### Expedition
10–20 นาทีโดยเลือกจบได้เป็นช่วง ๆ
หลาย spot ในพื้นที่เดียว

### Record Hunt
เลือก species เป้าหมาย
เกมช่วยแสดง habitat clues

### Photo Survey
จับ/พบเพื่อถ่ายรูปหรือ tag
เหมาะกับ species ที่ไม่ควรเก็บ

### Boat Trip
เลือก route หลายจุด
บันทึก checkpoint ทุกจุด

### Relax Mode
ช่วยเรื่อง cast/hook/tension มากขึ้น
ไม่ลด collection progress
แยก competitive record ถ้าจำเป็น

## 11. Pause / Resume

Browser visibilitychange:
- simulation pause ทันที
- audio suspend
- save active state

เมื่อกลับมา:
- restore state
- countdown 1–2 วินาที
- continue

หาก state ไม่ปลอดภัย:
- rollback ไป pre-cast checkpoint
- คืน consumable ที่ยังไม่ถูกใช้จริง
- ไม่มี penalty

## 12. Anti-Boredom Without Chores

ทุก spot ต้องมีอย่างน้อย 3 เหตุผลในการกลับมา:
1. species ที่ยังไม่พบ
2. size/record chase
3. condition variation เช่น time, weather, season

และมี meta goals:
- Fishdex
- regional medal
- photo set
- museum collection
- aquarium habitat
- town upgrade
- gear mastery

แต่ไม่มีระบบที่บังคับทำทุกอย่างในวันเดียว
