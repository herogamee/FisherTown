export interface CatchRecord {
  speciesId: string;
  bestLengthCm: number;
  bestWeightKg: number;
  catches: number;
  lastCaughtAt: string;
}

export interface FisherSave {
  version: 1;
  totalCatches: number;
  discovered: string[];
  records: Record<string, CatchRecord>;
  selectedBait: string;
}

const KEY = 'fishertown:v0.1:save';

export function loadSave(): FisherSave {
  const fallback: FisherSave = {
    version: 1,
    totalCatches: 0,
    discovered: [],
    records: {},
    selectedBait: 'worm'
  };

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<FisherSave>;
    if (parsed.version !== 1) return fallback;
    return {
      ...fallback,
      ...parsed,
      discovered: Array.isArray(parsed.discovered) ? parsed.discovered : [],
      records: parsed.records && typeof parsed.records === 'object' ? parsed.records : {}
    };
  } catch {
    return fallback;
  }
}

export function persistSave(save: FisherSave): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Storage can be blocked in private contexts. Gameplay must remain available.
  }
}

export function recordCatch(save: FisherSave, speciesId: string, lengthCm: number, weightKg: number): { isNewSpecies: boolean; isLengthRecord: boolean } {
  const existing = save.records[speciesId];
  const isNewSpecies = !save.discovered.includes(speciesId);
  const isLengthRecord = !existing || lengthCm > existing.bestLengthCm;

  if (isNewSpecies) save.discovered.push(speciesId);
  save.totalCatches += 1;
  save.records[speciesId] = {
    speciesId,
    bestLengthCm: Math.max(existing?.bestLengthCm ?? 0, lengthCm),
    bestWeightKg: Math.max(existing?.bestWeightKg ?? 0, weightKg),
    catches: (existing?.catches ?? 0) + 1,
    lastCaughtAt: new Date().toISOString()
  };
  persistSave(save);
  return { isNewSpecies, isLengthRecord };
}
