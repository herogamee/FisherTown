# Art Direction

## Visual Thesis

ปลา: สมจริงตาม species
โลก: สวย สงบ อ่านง่าย
ตัวละครและเมือง: stylized cozy
UI: modern, clear, mobile landscape

เป้าหมายไม่ใช่ photorealistic 3D แต่เป็น Naturalistic 2D HD ที่คนเห็น silhouette แล้วพอเดา species/family ได้

## Fish Accuracy Rules

ทุก fish asset ต้องมี Species Reference Sheet ก่อนวาด

Reference Sheet:
- accepted scientific name
- adult side profile
- juvenile differences ถ้าสำคัญ
- male/female differences ถ้าสำคัญ
- body proportion
- head shape
- mouth position
- fin placement
- fin shape
- tail shape
- scale/skin character
- base color
- diagnostic pattern
- approximate size range
- source/license of every visual reference

ห้าม:
- copy ภาพถ่ายโดยตรงเป็น texture ถ้าไม่มีสิทธิ์
- ใช้ภาพ FishBase โดยสมมติว่าใช้เชิงพาณิชย์ได้
- ใช้ generic fish แล้วเปลี่ยนสีสำหรับ species ที่รูปร่างต่างกันมาก
- เพิ่มครีบ หนวด ลาย หรือสี fantasy ให้ species จริงในโหมดหลัก

## Style

Fish:
- natural proportions
- realistic color family
- slightly enhanced contrast เพื่ออ่านบนมือถือ
- wet/specular highlight แบบพอดี
- details ชัดเมื่อ Landing screen
- simplified details ระหว่าง gameplay เพื่อ performance

Environment:
- painterly naturalistic
- color separation ชัดระหว่าง sky / land / water
- ไม่ใส่ texture noise จนลายตา
- focal area บริเวณน้ำต้องอ่านง่าย

## Camera

Landscape 16:9 เป็นฐาน

Fishing scene:
- ตัวละครอยู่ด้านหนึ่งหรือ foreground edge
- water occupies 45–65% ของ readable gameplay area
- horizon และฉากหลังให้ความรู้สึกกว้าง
- casting target ใช้พื้นที่แนวนอนเต็มประโยชน์

Underwater cutaway optional:
- ใช้เมื่อโหมด/spot รองรับ
- ไม่จำเป็นต้องเห็นปลาทุกตัวตลอดเวลา

## Fish Animation

ไม่ทำ frame-by-frame ใหม่จำนวนมากทุก species

ใช้ family rig templates:
- fusiform
- deep-bodied
- elongate
- eel-like
- catfish
- gar
- salmonid/trout
- cichlid/perch
- carp
- flatfish
- ray
- shark
- tuna/pelagic

แต่ species mesh และ silhouette ต้องเฉพาะตัว

Motion layers:
- body bend
- tail oscillation
- pectoral fins
- dorsal/anal subtle motion
- mouth/gill
- acceleration burst
- turn
- strike
- hooked struggle
- landing idle

Phaser Mesh/Shader หรือ custom vertex deformation ควรถูกพิจารณาก่อนระบบ rig ที่เพิ่ม runtime/license หนักเกินไป

## Size Presentation

Landing scene ต้องทำให้ scale เข้าใจได้โดยไม่หลอก:
- measuring mat/board
- rod reference
- player hands
- species-aware framing

ห้าม scale fish ให้ใหญ่เพื่อความตื่นเต้นจนขัด record

## Water

น้ำเป็น character สำคัญ

layers:
- base gradient
- reflection
- wave normal/mesh
- foam/ripples
- current streak
- rain impact
- lure wake
- fish boil
- jump splash
- underwater shadow

Effects ต้อง adaptive:
Low / Medium / High graphics mode

## Lighting & Weather

- dawn warmth
- midday clarity
- overcast soft contrast
- evening low-angle light
- night moon/lamp readable

Night ต้องยังมอง gameplay cue ได้
ไม่ใช้ความมืดเป็น difficulty ที่น่ารำคาญ

## UI

Mobile landscape priorities:
- touch target อย่างน้อยประมาณ 44 CSS px
- safe-area support
- information at edges
- center water clear
- one-thumb critical controls where possible
- no tiny scientific text during fight

HUD:
top: level / location / condition
left or right: compact gear/bait
bottom: primary fishing controls
center: water/gameplay

## Catch Card

ข้อมูลชั้นแรก:
- ชื่อไทย/ภาษาผู้เล่น
- English/common name
- scientific name
- length
- weight
- record badge
- release/record actions

ข้อมูล ecology เพิ่มใน expandable panel

## Aquarium Art

Aquarium เป็น digital habitat display ไม่ใช่ข้ออ้างว่าผู้เล่นเก็บปลาหายากจริง

ใช้ species discovery unlock เพื่อสร้าง digital specimen
ทำให้ conservation-sensitive species สามารถอยู่ใน Aquarium simulation ได้โดยไม่ขัดกับ Catch & Release

## Sound

Natural soundscape:
- water
- wind
- insects
- birds
- boat creak
- line/reel
- subtle fish splash

เพลง:
- low density
- adaptive
- หยุดเงียบเป็นช่วงเพื่อให้ได้ยินธรรมชาติ

## Asset Pipeline

1. taxonomy locked
2. reference research
3. legal/license check
4. silhouette sketch
5. morphology review
6. color/pattern review
7. rig/deformation
8. gameplay test at phone size
9. landing close-up test
10. export atlas
11. metadata link to species id
