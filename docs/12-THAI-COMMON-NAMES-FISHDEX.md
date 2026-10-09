# FisherTown — Thai-first Fishdex and scientific names

Updated 2026-10-09

## Policy
The public-facing Thai name is the headline. The scientific binomial is kept for knowledge, identification and search.
Examples: ปลานิล = Oreochromis niloticus; ปลาช่อน = Channa striata; ปลาชะโด = Channa micropeltes; ปลาทู = Rastrelliger brachysoma.
Synonyms and common names are not unique taxonomic IDs. A broad Thai name such as ปลาดุก can refer to several species; users see the scientific name to distinguish them.
ปลาทับทิม is not automatically an exact one-to-one synonym of Oreochromis niloticus. Ambiguous commercial varieties must be researched independently.

## Data and sources
The regional and priority research candidates live under data/fish-atlas/thailand.
Curated common-name evidence and aliases are recorded in data/fish-atlas/thailand/common-name-curation.json.
The compiler scripts/build-fish-atlas.mjs builds public/data/fish-atlas/thailand-name-index.json; do not edit the compiled file by hand.
All 299 records remain research-only, and the game population stays limited to the existing 10 modeled species.

## UI behavior
Fishdex has two distinct tabs: Thailand research names (299) and playable fish (10).
Search matches Thai common names, documented alternate names, English where known and scientific names.
The detail view always shows scientific name and available source links, plus a clear under-review warning.
Research records are not automatically spawned or marked legally catchable. The existing gameplay save is unchanged.

## Authoritative examples
- Department of Fisheries on Nile tilapia: https://www4.fisheries.go.th/dof/news_local/1220/64290
- Department of Fisheries on Channa striata regional names: https://www4.fisheries.go.th/local/file_document/20230828112416_1_file.pdf
- ONEP TH-BIF Oreochromis niloticus: https://thbif.onep.go.th/taxons/detail/28938
- ONEP TH-BIF Channa striata: https://thbif.onep.go.th/taxons/detail/8545
- Remaining records use indexed TH-BIF taxon and regional source URLs and are not considered finally verified.

## Verification
Run npm run atlas:check, npm run validate, npm run build and npm run smoke. Playwright tests exercise portrait search and preservation of fishing controls.
