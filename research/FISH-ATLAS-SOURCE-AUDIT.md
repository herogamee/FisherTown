# FisherTown — Source audit for Thailand fish atlas (2026-10-09)

## Scope and counts
- 269 regional-list name pairs from ONEP TH-BIF Songkhla regional biodiversity index
- 62 editor-chosen high-interest taxa with individual ONEP profile references
- 299 *distinct nominal binomial combinations* after exact-name deduplication; **NOT yet 299 accepted biological species** and not all native to Thailand
- 3 unresolved suspected synonym pairs that must be compared against a contemporary taxonomic catalogue (not silently merged)
- zero new playable species; this is an annotated research staging catalog, separate from the original 10 gameplay fish and 26 worldwide research seed entries

## Referenced resources and rights

| ID | Authority | URL | Use |
| --- | --- | --- | --- |
| ONEP-2017-CHECKLIST | ONEP Biodiversity Series Vol. 24 (Chavalit Vidthayanon, 2017) | https://chm-thai.onep.go.th/?p=1573 | Historical baseline: at least 858 freshwater-linked fish, 81 families, 137 threatened in publication |
| THBIF-SONGKHLA-ONEPAGE | ONEP TH-BIF regional index | https://thbif.onep.go.th/minisite/lagoon/onepage | Research-only scientific/Thai-name leads for Songkhla basin, including brackish and marine fish; geographic claims need confirmation |
| THBIF-SPECIES-PAGES | ONEP TH-BIF individual taxon pages | https://thbif.onep.go.th/taxons/ | Individual name/family/distribution checks; mixed taxonomy quality |
| DOF-OPEN-CSV | Thai Department of Fisheries DGA CSV | https://data.go.th/dataset/item_cb5d392d-2824-4ac4-a171-2c4796ce81c2 | 162 **aquatic-animal records** (not 162 fish species), historical snapshot; published CC Attribution; not imported due unavailable/unsampled raw resource |
| DOF-CURRENT-DATA | DOF CKAN catalog | https://catalog.fisheries.go.th/dataset/aquatic/resource/d5725e4e-fe93-4376-b238-3dafb534ad54 | Newer government data dictionary; license unspecified on displayed page: keep as reference until clarified |
| THAI-BETTA-MAHACHAIENSIS-2012 | Kowasupat et al., *Zootaxa* 3522:49–60 | https://doi.org/10.11646/zootaxa.3522.1.3 | Original peer-reviewed species description; Samut Sakhon, brackish-water nipa habitat; DOI metadata only, no paper/image reproduction |
| CATALOG-OF-FISHES | Eschmeyer's Catalog of Fishes | https://researcharchive.calacademy.org/research/ichthyology/catalog/fishcatmain.asp | Resolve accepted scientific names and synonyms; terms check before import |

**Licensing hard gate:** source access is not a blanket right to copy entire official databases, maps, long articles, or reference images into a commercial game. The raw TH-BIF subset and every priority entry stay **research-only** until rights and attribution are cleared. Facts such as names are staging data, not licensed fish illustrations. FishBase material may be NC-licensed; do not bulk import it.

## Taxonomic and ecological QA

- TH-BIF can expose incorrectly joined content and spelling errors. Confirm individual page heading **and** actual scientific-name field, never rely on a plausible URL alone.
- Songkhla summary includes some trinomial names: `Oreochromis niloticus niloticus`, `Cyprinus carpio carpio`, `Tylosurus crocodilus crocodilus`. Compile only a **candidate binomial**, retaining the original name.
- Flag rather than silently merge `Trichogaster pectoralis / Trichopodus pectoralis`, `Trichogaster trichopterus / Trichopodus trichopterus`, and `Osteochilus hasseltii / Osteochilus vittatus`.
- A row appearing in a regional list does NOT establish that fish is indigenous, present in every part of Thailand, catchable, non-protected, or suitable for a freshwater pond scene.
- Never infer conservation status from the species’ colorful “rarity” game tier; real assessments must carry authority and year. Photo-only flags are editorial precautions, not legal conclusions.
- Threatened or sensitive species must not expose precise collection coordinates.
- Do not equate translated common Thai names with distinct taxa.
- Source URLs for priority taxa are **research leads**; only a subset of names was manually cross-checked against the live taxon page or primary literature. No automated bulk validation is claimed.

## Quality gates before release
1. Validate names, source provenance and no duplicate *exact* binomial keys: `npm run atlas:check`
2. Current-name taxonomy via CAS Catalog/WoRMS, GBIF accepted taxon where licensed, authoritative primary literature
3. Thai distribution/marine occurrence via DOF, ONEP, specimen collections and actual locality evidence
4. Record native/introduced status, habitat, legal protection, IUCN/ONEP assessment **with year**, independently per region
5. Obtain commercial-compatible photo/sprite rights and document attribution, or commission accurate original game art
6. Promote to a separately reviewed gameplay manifest only after all gates; never directly concatenate this index into `src/game/data/fish.ts`

## World expansion (phase order)
Thailand first; next Southeast Asia and South China Sea, then Indo-Pacific, Japan, Amazon/Orinoco, North America, Europe, Africa and Australia. Source priority: government fisheries agencies, voucher-backed museum publications, peer-reviewed species descriptions, GBIF dataset-specific CC0/CC-BY occurrence where permitted, OBIS marine occurrences, WoRMS taxonomy, FAO fishing areas for geographic grouping (not species occurrences). Never infer country from range-wide common names.

**Transcription audit note:** Source-listed Thai labels are hand-transcribed and sometimes spelling/punctuation-normalized (such as พ่นน้ำ/พ้นน้ำ, names for gobies). They are NOT promised to be exact quotes from the source. The source holds priority when any label differs.
