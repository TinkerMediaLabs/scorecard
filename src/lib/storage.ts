import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, Preset, Scorecard } from '../types';

const INDEX_KEY = 'scorecards_index';
const SCORECARD_PREFIX = 'scorecard_';
const PRESETS_KEY = 'presets';

function hydrateScorecard(raw: Scorecard): Scorecard {
  return {
    ...raw,
    settings: { ...DEFAULT_SETTINGS, ...raw.settings },
    rounds: raw.rounds.map((r) => ({
      ...r,
      bids: r.bids ?? {},
      melds: r.melds ?? {},
      bonuses: r.bonuses ?? {},
      customValues: r.customValues ?? {},
    })),
  };
}

function hydratePreset(raw: Preset): Preset {
  return { ...raw, settings: { ...DEFAULT_SETTINGS, ...raw.settings } };
}

export async function listScorecardIds(): Promise<string[]> {
  const json = await AsyncStorage.getItem(INDEX_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveScorecard(card: Scorecard): Promise<void> {
  card.updatedAt = new Date().toISOString();
  await AsyncStorage.setItem(SCORECARD_PREFIX + card.id, JSON.stringify(card));

  const index = await listScorecardIds();
  if (!index.includes(card.id)) {
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify([...index, card.id]));
  }
}

export async function loadScorecard(id: string): Promise<Scorecard | null> {
  const json = await AsyncStorage.getItem(SCORECARD_PREFIX + id);
  return json ? hydrateScorecard(JSON.parse(json)) : null;
}

export async function loadAllScorecards(): Promise<Scorecard[]> {
  const ids = await listScorecardIds();
  const cards = await Promise.all(ids.map(loadScorecard));
  return cards.filter((c): c is Scorecard => c !== null);
}

export async function deleteScorecard(id: string): Promise<void> {
  await AsyncStorage.removeItem(SCORECARD_PREFIX + id);
  const index = await listScorecardIds();
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index.filter((i) => i !== id)));
}

export async function listPresets(): Promise<Preset[]> {
  const json = await AsyncStorage.getItem(PRESETS_KEY);
  const presets: Preset[] = json ? JSON.parse(json) : [];
  return presets.map(hydratePreset);
}

export async function savePreset(preset: Preset): Promise<void> {
  const presets = await listPresets();
  const index = presets.findIndex((p) => p.id === preset.id);
  if (index >= 0) {
    presets[index] = preset;
  } else {
    presets.push(preset);
  }
  await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export async function deletePreset(id: string): Promise<void> {
  const presets = await listPresets();
  await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(presets.filter((p) => p.id !== id)));
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.clear();
}