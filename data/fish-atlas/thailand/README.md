# FisherTown Thailand Fish Atlas — Research staging

The Songkhla subset holds 269 **scientific-name/Thai-name pairs reported by a ONEP TH-BIF *regional* overview**. These are NOT 269 verified playable fish, not a modern complete checklist, and not proof of native distribution. This intentionally excludes genus-only records, cross-kingdom records, pictures and descriptive paragraphs.

Data: `songkhla-regional-candidates.json`
Source: https://thbif.onep.go.th/minisite/lagoon/onepage
Accessed: 2026-10-09

**Do not promote into production/gameplay without independent taxonomic, distribution and rights review.** Historical names and reported vernacular labels are preserved; common Thai names may cover several species. This regional index spans marine, brackish and freshwater animals: do not map all records into the Thai freshwater scene.

The ONEP 2017 freshwater checklist (858 species, 81 families) is a separate national historical reference, *not* the count of this regional list or this repository. Government sources may have publication-specific licensing; refer to `research/DATA-SOURCES-AND-LICENSING.md`. FishBase's NC-licensed content must not be copied into a commercial game.

All candidate rows have `in_game=false`, `taxonomy_review_required=true`. Join with priority taxon profiles only after a separate source has verified the current name and Thai label.

**Name transcription:** `thai_name_transcribed` is a manual candidate label, not guaranteed verbatim; consult the linked source and taxonomic journals for exact spelling and accepted current name.
