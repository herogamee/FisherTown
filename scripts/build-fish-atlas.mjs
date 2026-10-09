import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const location = (path) => fileURLToPath(new URL(path, root));
const json = (path) => JSON.parse(readFileSync(location(path), 'utf8'));
const candidates = json('data/fish-atlas/thailand/songkhla-regional-candidates.json');
const priority = json('data/fish-atlas/thailand/priority-taxa.json');
const currentSeed = json('data/fish-seed.json');
const naming = json('data/fish-atlas/thailand/common-name-curation.json');
const scopedSources = ['THBIF-SONGKHLA-ONEPAGE', 'THBIF-SPECIES-PAGES'];
const regex = /^[A-Z][A-Za-z]+ [a-z][a-zA-Z-]+(?: [a-z][a-zA-Z-]+)?$/;

assert.equal(candidates.record_count, candidates.species.length, 'Regional source count mismatch');
assert.equal(priority.count, priority.profiles.length, 'Priority source count mismatch');
assert.ok(candidates.species.length >= 200, 'Regional source list unexpectedly truncated');
assert.ok(priority.profiles.length >= 40, 'Priority profiles unexpectedly truncated');
const registry = new Map();

for (const [i, entry] of candidates.species.entries()) {
  assert.ok(regex.test(entry.scientific_name_as_listed), 'Bad source taxon name at row ' + i);
  assert.ok(entry.thai_name_transcribed.length > 0 && /[\u0e00-\u0e7f]/.test(entry.thai_name_transcribed));
  assert.equal(entry.source_id, scopedSources[0]);
  assert.equal(entry.transcription_exactness, 'manual_curated_label_not_guaranteed_verbatim');
  assert.equal(entry.in_game, false, 'Unreviewed regional fish leaked to game');
  assert.equal(entry.taxonomy_review_required, true);
  const candidate = entry.canonical_candidate;
  const tokens = entry.scientific_name_as_listed.split(' ');
  assert.equal(candidate, tokens.slice(0, 2).join(' '));
  assert.ok(!registry.has(candidate.toLowerCase()), 'Duplicate regional candidate ' + candidate);
  registry.set(candidate.toLowerCase(), {
    id: candidate.toLowerCase().replace(/\s+/g, '_'),
    scientific_name_candidate: candidate,
    thai_name_for_review: entry.thai_name_transcribed,
    thai_names_for_review: [entry.thai_name_transcribed],
    source_ids: [scopedSources[0]],
    regional_reports: [{
      region: 'songkhla_lake_basin',
      scientific_name_as_listed: entry.scientific_name_as_listed,
      source_id: entry.source_id
    }],
    priority: false,
    identity_review: 'regional_listing_only',
    interest_tags: [],
    water_types_reviewed: [],
    habitat_verified: false,
    native_status_verified: false,
    legal_status_verified: false,
    image_rights_verified: false,
    gameplay_ready: false
  });
}

const prioritiesSeen = new Set();
for (const p of priority.profiles) {
  assert.ok(regex.test(p.scientific_name), 'Bad priority binomial ' + p.scientific_name);
  assert.ok(p.thai_name && /[\u0e00-\u0e7f]/.test(p.thai_name));
  assert.equal(p.source_id, scopedSources[1]);
  assert.equal(p.in_game, false, 'Priority profile leaked to game');
  assert.ok(p.taxon_page_url.startsWith('https://thbif.onep.go.th/'));
  assert.ok(!prioritiesSeen.has(p.scientific_name.toLowerCase()), 'Duplicate priority entry');
  prioritiesSeen.add(p.scientific_name.toLowerCase());
  const key = p.scientific_name.toLowerCase();
  let record = registry.get(key);
  if (!record) {
    record = {
      id: p.id,
      scientific_name_candidate: p.scientific_name,
      thai_name_for_review: p.thai_name,
      thai_names_for_review: [p.thai_name],
      source_ids: [],
      regional_reports: [],
      priority: false,
      identity_review: 'priority_reference_only',
      interest_tags: [],
      water_types_reviewed: [],
      habitat_verified: false,
      native_status_verified: false,
      legal_status_verified: false,
      image_rights_verified: false,
      gameplay_ready: false
    };
    registry.set(key, record);
  }
  record.priority = true;
  record.thai_name_for_review = p.thai_name;
  if (!record.thai_names_for_review.includes(p.thai_name)) {
    record.thai_names_for_review.push(p.thai_name);
  }
  if (!record.source_ids.includes(p.source_id)) record.source_ids.push(p.source_id);
  record.taxon_page_url = p.taxon_page_url;
  record.identity_review = p.review_status;
  record.interest_tags = p.interest_tags;
  record.water_types_to_review = p.water_types_to_review;
  record.gameplay_handling = p.gameplay_handling;
  if (p.taxonomy_note) record.taxonomy_note = p.taxonomy_note;
  if (p.primary_literature) record.primary_literature = p.primary_literature;
  record.origin_status = p.origin_status;
}

const aliases = [
  ['Trichogaster pectoralis', 'Trichopodus pectoralis'],
  ['Trichogaster trichopterus', 'Trichopodus trichopterus'],
  ['Osteochilus hasseltii', 'Osteochilus vittatus']
].filter(pair => pair.every(name => registry.has(name.toLowerCase())));
for (const [left, right] of aliases) {
  registry.get(left.toLowerCase()).possible_synonym_review_with = right;
  registry.get(right.toLowerCase()).possible_synonym_review_with = left;
}
const species = [...registry.values()].sort((a, b) =>
  a.scientific_name_candidate.localeCompare(b.scientific_name_candidate, 'en'));
const atlas = {
  version: '2026.10-thailand-r1',
  generated_at: '2026-10-09',
  scope: 'Thailand-first nominal-name candidate index for licensed/reviewed future gameplay',
  not_ready_for_game: true,
  counts: {
    regional_reference_rows: candidates.species.length,
    priority_profiles: priority.profiles.length,
    unique_nominal_binomials: species.length,
    priority_not_in_regional: species.filter(s => s.priority && !s.regional_reports.length).length,
    regional_plus_priority_overlap: species.filter(s => s.priority && s.regional_reports.length).length,
    unresolved_possible_synonym_pairs: aliases.length,
    gameplay_ready: species.filter(s => s.gameplay_ready).length
  },
  warning: '299 nominal combinations are NOT 299 taxonomically accepted species; synonyms may need merging. Names, habitats, native status, conservation and licenses need independent review before use. Thai labels are manual transcriptions and can contain editorial spelling normalization.',
  possible_synonym_pairs: aliases,
  records: species
};

assert.ok(currentSeed.species.length >= 20, 'Existing world seed was altered/truncated');
assert.equal(atlas.counts.gameplay_ready, 0);
assert.ok(species.every(x => x.gameplay_ready === false && x.native_status_verified === false && x.image_rights_verified === false));
// Export a lightweight, non-playable Thai-first directory for the in-game Fishdex.
// The scientific name remains the species identity. Vernacular labels can overlap.
const byName = new Map(naming.records.map(x => [x.scientific_name.toLowerCase(), x]));
assert.equal(byName.size, naming.records.length, 'Duplicate curated scientific names');
const bySeed = new Map(currentSeed.species.map(x => [x.scientific_name.toLowerCase(), x]));
for (const candidate of naming.records) {
  assert.ok(species.some(x => x.scientific_name_candidate.toLowerCase() === candidate.scientific_name.toLowerCase()),
    'Curated name is not in Thailand atlas: ' + candidate.scientific_name);
  assert.ok(candidate.evidence_urls.length > 0 && candidate.evidence_urls.every(x => x.startsWith('https://')),
    'Curated display names need source references');
}
const fishNameEntries = species.map(record => {
  const curated = byName.get(record.scientific_name_candidate.toLowerCase());
  assert.ok(!curated || curated.display_name_th === record.thai_name_for_review,
    'Name curation cannot silently rename a source species: ' + record.scientific_name_candidate);
  const verified = (curated?.verified_aliases_th ?? []).filter(x => x !== record.thai_name_for_review);
  const reported = record.thai_names_for_review.filter(x => x !== record.thai_name_for_review && !verified.includes(x));
  const links = [
    ...(record.taxon_page_url ? [record.taxon_page_url] :
      record.regional_reports?.length ? ['https://thbif.onep.go.th/minisite/lagoon/onepage'] : []),
    ...(curated?.evidence_urls ?? [])
  ];
  return {
    id: record.id,
    display_name_th: record.thai_name_for_review,
    scientific_name: record.scientific_name_candidate,
    common_name_en: curated?.english_name ??
      bySeed.get(record.scientific_name_candidate.toLowerCase())?.common_names?.en ?? null,
    verified_aliases_th: verified,
    reported_aliases_th_pending_review: reported,
    searchable_names_th: [...new Set([record.thai_name_for_review, ...verified, ...reported])],
    priority: record.priority,
    popular: record.interest_tags.includes('popular'),
    interest_tags: record.interest_tags,
    name_evidence_status: record.identity_review === 'scientific_and_thai_name_checked_against_taxon_or_paper_page' ?
      'name_pair_crosschecked_in_research' : 'source_label_pending_final_review',
    source_ids: record.source_ids,
    evidence_urls: [...new Set(links)],
    origin_status: record.origin_status ?? 'not_assessed',
    possible_synonym_review_with: record.possible_synonym_review_with ?? null,
    gameplay_ready: false,
    review_note: curated?.note ?? null
  };
});
const fishNames = {
  version: '2026.10-th-names-r1',
  generated_at: '2026-10-09',
  region: 'Thailand',
  research_only: true,
  notice_th: 'ทะเบียนปลาไทยสำหรับการศึกษา บางชื่อและชนิดยังอยู่ระหว่างตรวจสอบ ไม่ได้หมายความว่าพบปลานี้ในฉากหรืออนุญาตให้ตกได้',
  counts: {
    records: fishNameEntries.length,
    gameplay_ready: 0,
    curated_common_name_examples: naming.records.length
  },
  entries: fishNameEntries
};
assert.equal(fishNames.counts.records, species.length);
assert.ok(fishNames.entries.every(x => x.gameplay_ready === false && x.display_name_th.length));
const namesOut = location('public/data/fish-atlas/thailand-name-index.json');

const out = location('data/fish-atlas/thailand/catalog-index.json');
if (process.argv.includes('--write')) {
  writeFileSync(out, JSON.stringify(atlas, null, 2) + '\n');
  writeFileSync(namesOut, JSON.stringify(fishNames, null, 2) + '\n');
  console.log('WROTE fish atlas index', atlas.counts);
} else {
  assert.deepEqual(json('data/fish-atlas/thailand/catalog-index.json'), atlas,
    'Index stale: run node scripts/build-fish-atlas.mjs --write and commit result');
  assert.deepEqual(json('public/data/fish-atlas/thailand-name-index.json'), fishNames,
    'Thai common-name index stale: run npm run atlas:build');
  console.log('PASS fish atlas source counts, taxonomic safeguards and merged index', atlas.counts);
}
