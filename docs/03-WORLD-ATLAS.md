# World Atlas & Expedition Design

## World Model

FisherTown ใช้โลกจริงเป็นฐาน แต่สร้างฉากเกมแบบ curated เพื่อให้สวย ลื่น และเล่นบนมือถือได้

Hierarchy:
- World
- Macro Region
- Country / Territory
- Basin / Sea / Coast
- Waterbody
- Habitat Zone
- Fishing Spot

ตัวอย่าง:
Asia
→ Thailand
→ Chao Phraya Basin
→ lowland river
→ deep outside bend
→ Fishing Spot A

## Geography Rules

- Species ต้องอยู่ใน native range หรือ documented introduced range เท่านั้น
- Introduced population ต้องติดธง introduced
- Marine species ใช้ทะเล/มหาสมุทรและ FAO Area เป็น reference layer
- Freshwater ใช้ basin/watershed สำคัญกว่าพรมแดนประเทศ เพราะปลาไม่รู้จักเส้นประเทศ
- ประเทศใช้สำหรับ UI, travel, culture และ localization
- Habitat ใช้สำหรับ actual spawn logic

## Launch Atlas

### A. Thailand — Central Rivers & Mekong Gateway

ประเทศ: Thailand และพื้นที่ลุ่มน้ำเชื่อมโยงเพื่อนบ้านตามชนิดปลา
ระบบน้ำ:
- Chao Phraya Basin
- Mae Klong Basin
- Mekong Basin sections relevant to Thailand
- estuary / brackish transition

Habitat:
- lowland river
- deep pool
- canal margin
- flooded vegetation
- tributary
- estuary
- mangrove edge

Identity:
เป็นพื้นที่เริ่มต้น เพราะมีทั้งปลาน้ำจืดเขตร้อน ปลาใหญ่ และทางเชื่อมไปสู่น้ำกร่อย

### B. Japan — Rivers, Estuaries & Coastal Bays

ประเทศ: Japan
Habitat:
- clear mountain stream
- middle river
- estuary
- harbor edge
- coastal bay
- rocky shore

Identity:
presentation ละเอียด ใช้ lure fishing มากขึ้น และมีฤดูกาลชัด

### C. Amazon Basin

ประเทศหลักใน content: Brazil, Peru, Colombia
Habitat:
- whitewater river
- blackwater tributary
- floodplain lake
- flooded forest edge
- oxbow
- main channel

Identity:
ความหลากหลายสูง ปลา predator เด่น น้ำเปลี่ยนตาม flood pulse

### D. Lower Mississippi & Gulf Coastal Rivers

ประเทศ: USA, Mexico
Habitat:
- big river backwater
- bayou
- oxbow lake
- swamp channel
- reservoir edge
- brackish lower river

Identity:
bass, catfish, gar และ structure fishing

### E. Pacific Northwest & Alaska

ประเทศ: USA, Canada
Habitat:
- cold river
- gravel run
- pool-riffle
- lake
- estuary
- nearshore coast

Identity:
salmonids, clear/cold water, migration season

### F. Great Lakes & Northern Inland Waters

ประเทศ: USA, Canada
Habitat:
- large lake
- rocky shoreline
- weed bed
- river mouth
- cold deep water

Identity:
seasonal depth changes และ boat fishing

### G. Northern & Central Europe

ประเทศตัวอย่าง: Norway, Sweden, Finland, Germany, France, Poland และประเทศที่ species range รองรับ
Habitat:
- natural lake
- slow river
- reservoir
- reed margin
- deep channel

Identity:
pike, perch, carp, wels-type big fish, cold/temperate seasonal cycle

### H. Mediterranean & Connected Coasts

ประเทศหลายประเทศรอบ Mediterranean
Habitat:
- harbor
- rocky coast
- seagrass edge
- reef
- estuary
- offshore shelf

Identity:
light saltwater tackle, clear water, coastal travel

### I. Nile & East African Great Lakes

ประเทศตาม basin/content license และ ecology
Habitat:
- large lake
- river channel
- papyrus/reed margin
- rocky littoral
- deep basin

Identity:
large predators, warm-water lake ecology

หมายเหตุ:
ต้องแยก native/introduced history อย่างชัดเจน เช่น populations ที่ถูกนำเข้าในบางทะเลสาบ

### J. Zambezi & Southern African Waters

ประเทศตัวอย่างตาม basin: Zambia, Zimbabwe, Botswana, Namibia, Mozambique
Habitat:
- river channel
- floodplain
- delta
- rapid edge
- lagoon

Identity:
tigerfish-style fast fights และ floodplain ecology

### K. Australia — Murray-Darling & Tropical North

แบ่งเป็นสอง ecology pack:
1. Murray-Darling freshwater
2. tropical north river/estuary

Habitat:
- snaggy river
- billabong
- reservoir
- tropical creek
- estuary
- mangrove

Identity:
Murray cod / golden perch ฝั่ง temperate inland และ barramundi ฝั่ง tropical north

### L. Indo-Pacific Tropical Coast & Open Water

ประเทศ/เกาะตาม Expedition
Habitat:
- coral edge
- lagoon
- reef drop-off
- mangrove channel
- coastal current line
- offshore pelagic

Identity:
trevally, pelagic species, reef/coastal predators

## Future Atlas

- New Zealand
- Patagonia
- Caribbean
- West Africa
- Congo Basin
- Indian subcontinent / Himalayan rivers
- Siberia
- Arctic coast
- Middle East wadis/reservoirs where appropriate
- Pacific islands
- Atlantic offshore
- Southern Ocean research expedition

## Water Conditions

แต่ละ Expedition ใช้ condition seed:
- season
- time block
- cloud
- rain
- wind
- water level
- flow
- clarity
- temperature
- salinity where relevant

ไม่จำเป็นต้องผูกกับอากาศจริงทั้งหมด
ระบบควรเป็น predictable simulation เพื่อไม่ให้ผู้เล่นต้องรอโลกจริง

## Time Model

หนึ่ง Expedition เลือก Time Window:
- Dawn
- Morning
- Midday
- Evening
- Night

เริ่มแรกเปิดบางช่วง
เมื่อผู้เล่นเรียนรู้พื้นที่ จะเลือกช่วงอื่นได้

ไม่มีการบังคับให้ผู้เล่นเข้าเกมตามนาฬิกาจริง

## Seasons

แต่ละ region มี local season model ไม่ใช่ Spring/Summer/Fall/Winter แบบเดียวทั่วโลก

ตัวอย่าง:
- Thailand: dry / hot / wet / flood transition
- Amazon: rising / high water / falling / low water
- temperate: spring / summer / autumn / winter
- tropical coast: monsoon/current windows where relevant

## Spot Composition

หนึ่ง Spot ควรมี:
- foreground landmark
- casting lane
- 2–4 habitat pockets
- hidden depth profile
- visible environmental clues
- ambient wildlife
- soundscape
- 6–15 active target species ตามพื้นที่ ไม่ยัดทุก species ของ region ลงจุดเดียว

## Travel

การเดินทางไม่ควรกลายเป็น timer wall

Travel ใช้:
- unlock cost / passport progress
- short transition animation
- optional route map

ห้าม:
- รอ 6 ชั่วโมงเพื่อถึงประเทศใหม่
- จ่ายเงินจริงเพื่อข้าม timer

## Discovery

Map เริ่มจากข้อมูลคร่าว ๆ
เมื่อผู้เล่นตก:
- spot notes เพิ่ม
- species hints เพิ่ม
- habitat map ชัดขึ้น
- best personal conditions ถูกบันทึก

ดังนั้น “ความรู้” เป็น progression จริง
