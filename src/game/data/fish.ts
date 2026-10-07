export type FishMorphology = 'barb' | 'snakehead' | 'catfish' | 'gourami' | 'featherback';
export type BaitId = 'worm' | 'small-fish' | 'spinner';
export type FightStyle = 'runner' | 'burster' | 'bulldozer' | 'structure' | 'spinner';

export interface FishSpecies {
  id: string;
  nameTh: string;
  nameEn: string;
  scientific: string;
  morphology: FishMorphology;
  bodyColor: number;
  accentColor: number;
  localLengthCm: [number, number];
  weightFactor: number;
  attraction: Record<BaitId, number>;
  speed: number;
  wariness: number;
  power: number;
  stamina: number;
  fight: FightStyle[];
  habitatNote: string;
  distributionNote: string;
  conservationMode: 'normal' | 'release-preferred' | 'research-only';
  researchStatus: 'cross-checked' | 'prototype-review';
  source: string;
}

// Gameplay ranges are curated for this prototype spot, not biological maxima.
// They intentionally model a plausible local population rather than world-record size.
export const FISH_SPECIES: FishSpecies[] = [
  {
    id: 'barbonymus-gonionotus',
    nameTh: 'ปลาตะเพียนขาว',
    nameEn: 'Silver barb',
    scientific: 'Barbonymus gonionotus',
    morphology: 'barb',
    bodyColor: 0xb9c8c3,
    accentColor: 0xd7b26d,
    localLengthCm: [18, 38],
    weightFactor: 0.000018,
    attraction: { worm: 0.92, 'small-fish': 0.18, spinner: 0.35 },
    speed: 54,
    wariness: 0.34,
    power: 0.42,
    stamina: 0.48,
    fight: ['runner'],
    habitatNote: 'ขอบพืชน้ำและพื้นที่น้ำไหลช้า',
    distributionNote: 'พบตามลุ่มน้ำเจ้าพระยา แม่กลอง และโขงในไทย',
    conservationMode: 'normal',
    researchStatus: 'cross-checked',
    source: 'FishBase / Thailand territory record'
  },
  {
    id: 'channa-striata',
    nameTh: 'ปลาช่อน',
    nameEn: 'Striped snakehead',
    scientific: 'Channa striata',
    morphology: 'snakehead',
    bodyColor: 0x5d634d,
    accentColor: 0x30372f,
    localLengthCm: [24, 66],
    weightFactor: 0.000013,
    attraction: { worm: 0.42, 'small-fish': 0.96, spinner: 0.84 },
    speed: 66,
    wariness: 0.58,
    power: 0.72,
    stamina: 0.58,
    fight: ['burster', 'structure'],
    habitatNote: 'น้ำนิ่งหรือน้ำไหลช้า บึง คลอง ทุ่งน้ำหลาก',
    distributionNote: 'เป็นปลาพื้นถิ่นในระบบแม่น้ำหลายแห่งของประเทศไทย',
    conservationMode: 'normal',
    researchStatus: 'cross-checked',
    source: 'FishBase / Thailand territory record'
  },
  {
    id: 'channa-micropeltes',
    nameTh: 'ปลาชะโด',
    nameEn: 'Indonesian snakehead',
    scientific: 'Channa micropeltes',
    morphology: 'snakehead',
    bodyColor: 0x3f5549,
    accentColor: 0x8b4a38,
    localLengthCm: [32, 86],
    weightFactor: 0.000015,
    attraction: { worm: 0.14, 'small-fish': 1, spinner: 0.9 },
    speed: 76,
    wariness: 0.63,
    power: 0.86,
    stamina: 0.72,
    fight: ['burster', 'structure', 'runner'],
    habitatNote: 'แม่น้ำ บึง และบริเวณที่มีโครงสร้างหรือพืชน้ำ',
    distributionNote: 'มีถิ่นในลุ่มน้ำโขงและเจ้าพระยา รวมถึงเอเชียตะวันออกเฉียงใต้',
    conservationMode: 'normal',
    researchStatus: 'cross-checked',
    source: 'FisherTown research seed / FishBase'
  },
  {
    id: 'pangasianodon-hypophthalmus',
    nameTh: 'ปลาสวาย',
    nameEn: 'Striped catfish',
    scientific: 'Pangasianodon hypophthalmus',
    morphology: 'catfish',
    bodyColor: 0x77858a,
    accentColor: 0xaab5b6,
    localLengthCm: [28, 82],
    weightFactor: 0.000016,
    attraction: { worm: 0.82, 'small-fish': 0.42, spinner: 0.12 },
    speed: 58,
    wariness: 0.3,
    power: 0.68,
    stamina: 0.78,
    fight: ['runner', 'bulldozer'],
    habitatNote: 'ร่องน้ำลึกและแม่น้ำสายใหญ่',
    distributionNote: 'ปลาลุ่มน้ำเอเชียตะวันออกเฉียงใต้ที่พบในไทย',
    conservationMode: 'normal',
    researchStatus: 'prototype-review',
    source: 'FisherTown research backlog'
  },
  {
    id: 'clarias-macrocephalus',
    nameTh: 'ปลาดุกอุย',
    nameEn: 'Bighead catfish',
    scientific: 'Clarias macrocephalus',
    morphology: 'catfish',
    bodyColor: 0x4f493d,
    accentColor: 0x6f674f,
    localLengthCm: [20, 42],
    weightFactor: 0.000019,
    attraction: { worm: 1, 'small-fish': 0.68, spinner: 0.08 },
    speed: 44,
    wariness: 0.28,
    power: 0.56,
    stamina: 0.66,
    fight: ['bulldozer', 'structure'],
    habitatNote: 'พื้นท้องน้ำ บึง คลอง และพื้นที่น้ำไหลช้า',
    distributionNote: 'ปลาน้ำจืดเอเชียตะวันออกเฉียงใต้ รวมถึงประเทศไทย',
    conservationMode: 'normal',
    researchStatus: 'prototype-review',
    source: 'FisherTown research backlog'
  },
  {
    id: 'anabas-testudineus',
    nameTh: 'ปลาหมอไทย',
    nameEn: 'Climbing perch',
    scientific: 'Anabas testudineus',
    morphology: 'gourami',
    bodyColor: 0x7f8067,
    accentColor: 0x3f463c,
    localLengthCm: [12, 24],
    weightFactor: 0.000024,
    attraction: { worm: 0.96, 'small-fish': 0.22, spinner: 0.2 },
    speed: 42,
    wariness: 0.36,
    power: 0.32,
    stamina: 0.38,
    fight: ['spinner'],
    habitatNote: 'ทุ่งน้ำหลาก บึง คลอง และแหล่งน้ำนิ่ง',
    distributionNote: 'ปลาน้ำจืดพื้นถิ่นที่พบทั่วไปในเอเชียใต้และเอเชียตะวันออกเฉียงใต้',
    conservationMode: 'normal',
    researchStatus: 'prototype-review',
    source: 'FisherTown research backlog'
  },
  {
    id: 'trichopodus-pectoralis',
    nameTh: 'ปลาสลิด',
    nameEn: 'Snakeskin gourami',
    scientific: 'Trichopodus pectoralis',
    morphology: 'gourami',
    bodyColor: 0xa4a890,
    accentColor: 0x59675f,
    localLengthCm: [14, 26],
    weightFactor: 0.00002,
    attraction: { worm: 0.78, 'small-fish': 0.08, spinner: 0.12 },
    speed: 38,
    wariness: 0.46,
    power: 0.3,
    stamina: 0.34,
    fight: ['spinner'],
    habitatNote: 'แหล่งน้ำนิ่งที่มีพืชน้ำหนาแน่น',
    distributionNote: 'พบในเอเชียตะวันออกเฉียงใต้และสัมพันธ์กับแหล่งน้ำนิ่งเขตร้อน',
    conservationMode: 'normal',
    researchStatus: 'prototype-review',
    source: 'FisherTown research backlog'
  },
  {
    id: 'notopterus-notopterus',
    nameTh: 'ปลาสลาด',
    nameEn: 'Bronze featherback',
    scientific: 'Notopterus notopterus',
    morphology: 'featherback',
    bodyColor: 0xb3a88d,
    accentColor: 0x6e6556,
    localLengthCm: [22, 46],
    weightFactor: 0.000012,
    attraction: { worm: 0.66, 'small-fish': 0.72, spinner: 0.45 },
    speed: 52,
    wariness: 0.55,
    power: 0.5,
    stamina: 0.56,
    fight: ['spinner', 'runner'],
    habitatNote: 'แม่น้ำ คลอง และน้ำไหลช้าที่มีที่หลบ',
    distributionNote: 'พบในเอเชียใต้และเอเชียตะวันออกเฉียงใต้ รวมถึงระบบน้ำในไทย',
    conservationMode: 'normal',
    researchStatus: 'prototype-review',
    source: 'FisherTown research backlog'
  },
  {
    id: 'wallago-attu',
    nameTh: 'ปลาเค้า',
    nameEn: 'Wallago catfish',
    scientific: 'Wallago attu',
    morphology: 'catfish',
    bodyColor: 0x6f746f,
    accentColor: 0x4b514e,
    localLengthCm: [36, 92],
    weightFactor: 0.000013,
    attraction: { worm: 0.42, 'small-fish': 0.98, spinner: 0.58 },
    speed: 62,
    wariness: 0.6,
    power: 0.82,
    stamina: 0.76,
    fight: ['bulldozer', 'runner', 'structure'],
    habitatNote: 'ร่องน้ำลึก แม่น้ำสายใหญ่ และบริเวณที่มีเหยื่อปลา',
    distributionNote: 'ปลาน้ำจืดขนาดใหญ่ในเอเชียใต้และเอเชียตะวันออกเฉียงใต้',
    conservationMode: 'release-preferred',
    researchStatus: 'prototype-review',
    source: 'FisherTown research backlog'
  },
  {
    id: 'catlocarpio-siamensis',
    nameTh: 'ปลากระโห้',
    nameEn: 'Giant barb',
    scientific: 'Catlocarpio siamensis',
    morphology: 'barb',
    bodyColor: 0x94998e,
    accentColor: 0xc2b180,
    localLengthCm: [45, 105],
    weightFactor: 0.000021,
    attraction: { worm: 0.6, 'small-fish': 0.04, spinner: 0.04 },
    speed: 48,
    wariness: 0.72,
    power: 0.9,
    stamina: 0.92,
    fight: ['bulldozer', 'runner'],
    habitatNote: 'แม่น้ำขนาดใหญ่ ร่องน้ำ และพื้นที่น้ำหลาก',
    distributionNote: 'มีบันทึกในลุ่มน้ำแม่กลอง โขง และเจ้าพระยา',
    conservationMode: 'research-only',
    researchStatus: 'cross-checked',
    source: 'FisherTown research seed / FishBase'
  }
];

export const BAITS: { id: BaitId; label: string; icon: string; note: string }[] = [
  { id: 'worm', label: 'ไส้เดือน', icon: '🪱', note: 'เหมาะกับปลากินได้หลากหลายและปลาหน้าดิน' },
  { id: 'small-fish', label: 'ลูกปลา', icon: '🐟', note: 'ดึงดูดปลานักล่าและปลาขนาดใหญ่' },
  { id: 'spinner', label: 'สปินเนอร์', icon: '✨', note: 'เหยื่อปลอมสำหรับปลาที่ตอบสนองต่อการเคลื่อนไหว' }
];
