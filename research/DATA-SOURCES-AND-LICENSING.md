# Research Sources & Licensing Policy

Updated: 2026-10-07

เอกสารนี้สำคัญเพราะ FisherTown มีโอกาสเป็นเกมเชิงพาณิชย์ในอนาคต การที่ข้อมูลอยู่บนอินเทอร์เน็ตไม่ได้แปลว่านำฐานข้อมูลหรือภาพมาใช้ในเกมเชิงพาณิชย์ได้ทันที

## 1. FishBase

Use:
- research reference
- taxonomy cross-check
- habitat/distribution reading
- bibliography discovery
- prototype research

Current site reports tens of thousands of fish species and provides extensive ecology/distribution information.

Important licensing:
FishBase ระบุ Creative Commons Attribution-NonCommercial 4.0 สำหรับงานของ FishBase และระบุว่าการนำ text/numbers/maps ไปใส่เว็บไซต์ของตนใช้ได้สำหรับ non-commercial พร้อม attribution

Policy for FisherTown:
- ห้าม wholesale import FishBase database เข้า commercial game
- ห้าม copy descriptions
- ห้าม copy photos/drawings โดยไม่ตรวจสิทธิ์ของภาพแต่ละภาพ
- ใช้เป็น research lead แล้ว cross-check กับแหล่งที่ใช้เชิงพาณิชย์ได้หรือแหล่งภาครัฐ/primary literature
- เก็บ FishBase URL เป็น research provenance ได้

Reference:
https://www.fishbase.org/

## 2. GBIF

Use:
- occurrence records
- countries/coordinates
- biodiversity occurrence discovery
- dataset provenance

GBIF API รองรับ occurrence search และ bulk download

Licensing:
แต่ละ dataset มี license ของ publisher
GBIF รองรับ CC0, CC BY, CC BY-NC

Commercial production policy:
- ใช้เฉพาะ record/dataset ที่ license compatible เช่น CC0 หรือ CC BY ตามเงื่อนไข
- ห้ามรวม CC BY-NC ใน commercial dataset
- retain dataset identity
- เก็บ DOI/citation
- attribution ตามเงื่อนไข publisher

References:
https://techdocs.gbif.org/en/openapi/v1/occurrence
https://www.gbif.org/terms/data-user

## 3. WoRMS

Use:
- accepted marine taxonomic names
- synonym checking
- marine classification

WoRMS อธิบายตนเองว่าเป็น authoritative classification and catalogue of marine names

Policy:
- ใช้สำหรับ marine taxonomy verification
- ตรวจ terms/citation ณ วันที่ import
- เก็บ AphiaID เมื่อเหมาะสม

Reference:
https://www.marinespecies.org/

## 4. OBIS

Use:
- marine occurrence data
- marine distribution exploration
- dataset discovery

OBIS มี open marine biodiversity network และ dataset มี license ต่างกัน

Policy:
- ตรวจ license ระดับ dataset
- commercial build ใช้เฉพาะ license ที่อนุญาต
- เก็บ attribution/DOI
- ระวัง sensitive locality

References:
https://obis.org/
https://manual.obis.org/policy.html

## 5. FAO Major Fishing Areas

Use:
- marine macro geography
- FAO area IDs
- world atlas grouping
- fisheries geography vocabulary

FAO แบ่ง major marine fishing areas เช่น 21, 27, 31, 34, 37, 41, 47, 51, 57, 61, 67, 71, 77, 81, 87 เป็นต้น และ inland macro areas

Reference:
https://www.fao.org/cwp-on-fishery-statistics/handbook/general-concepts/main-water-areas

Policy:
ใช้เป็น reference geography layer ไม่ใช้แทน species occurrence verification

## 6. IUCN Red List

Important:
IUCN Red List API ระบุว่าการใช้ API เชิงพาณิชย์ถูกห้าม และแนะนำ commercial users ให้พิจารณา IBAT/licensing

Policy:
- ห้าม build production pipeline ที่ scrape/import IUCN API สำหรับ commercial game
- ใช้ public status เป็น manual research ได้เฉพาะตาม terms และ attribution ที่อนุญาต
- ถ้าต้องการ automated commercial conservation status ให้ขอ license ที่ถูกต้องก่อน
- ในเกมใช้ internal conservation_handling ซึ่งผ่าน editorial/legal review แทนการ copy API payload

Reference:
https://api.iucnredlist.org/

## 7. Government & Scientific Sources

Preferred production sources:
- national fisheries agencies
- environment ministries
- museum collections
- university publications
- peer-reviewed papers
- government species profiles
- regional fishery bodies

เหตุผล:
ช่วย cross-check local range, season, legal context และ local common names

## 8. Images

Biological facts และ image rights เป็นคนละเรื่อง

Rules:
- ทุกภาพ reference เก็บ source + license
- reference-only image ห้าม ship ในเกม
- artwork ต้องสร้างใหม่
- ห้าม trace/copy ภาพที่ไม่มีสิทธิ์จนเป็น derivative ที่ชัดเจน
- ถ้าใช้ photo texture ต้องมี explicit commercial-compatible license
- attribution ต้องเก็บใน Credits DB เมื่อ license ต้องการ

## 9. Data Provenance Record

ทุก production species ต้องมี:
- source title
- source organization
- source URL
- access date
- license
- dataset ID/DOI ถ้ามี
- field(s) supported
- reviewer
- verification date

## 10. Starter Research Notes

Verified concept examples from FishBase pages used during initial design research:

- Pangasianodon gigas — freshwater, Mekong basin endemic; large migratory Mekong catfish
  https://fishbase.org/summary/SpeciesSummary.php?id=6192
- Catlocarpio siamensis — Maeklong, Mekong and Chao Phraya basins; large rivers/floodplains
  https://www.fishbase.org/summary/Catlocarpio-siamensis
- Channa micropeltes — Mekong/Chao Phraya, Malay Peninsula, Sumatra, Borneo
  https://fishbase.org/summary/Channa-micropeltes
- Lates calcarifer — Indo-West Pacific; freshwater/brackish/marine, river-estuary life cycle
  https://www.fishbase.org/summary/Lates-calcarifer
- Arapaima gigas — Amazon basin
  https://www.fishbase.org/summary/2076
- Atractosteus spatula — Mississippi/Gulf coastal plain system
  https://www.fishbase.org/summary/Atractosteus-spatula
- Salmo salar — North Atlantic and connected rivers; anadromous
  https://fishbase.org/summary/236
- Silurus glanis — Europe/Asia large rivers and lakes
  https://www.fishbase.org/summary/Silurus-glanis.html
- Lateolabrax japonicus — western Pacific, Japan to South China Sea; marine/brackish/freshwater
  https://www.fishbase.org/summary/Lateolabrax-japonicus

These are research references, not permission to copy FishBase database content into a commercial product.

## 11. Production Data Rule

No external automated import may be promoted from research → production until:
1. license compatible
2. attribution strategy exists
3. source version recorded
4. sampled records reviewed
5. taxonomy normalized
6. sensitive locations handled
7. importer reproducible
8. legal/editorial sign-off
