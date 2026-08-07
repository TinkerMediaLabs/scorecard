import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PRESET_STATS, DEFAULT_SETTINGS, Preset, Scorecard } from '../types';

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
  return {
    ...raw,
    settings: { ...DEFAULT_SETTINGS, ...raw.settings },
    stats: raw.stats ?? DEFAULT_PRESET_STATS,
  };
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

export async function clearHistory(): Promise<void> {
  const cards = await loadAllScorecards();
  const finishedIds = cards.filter((c) => c.status === 'finished').map((c) => c.id);
  await Promise.all(finishedIds.map((id) => AsyncStorage.removeItem(SCORECARD_PREFIX + id)));

  const index = await listScorecardIds();
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index.filter((id) => !finishedIds.includes(id))));
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

export async function recordPresetGameResult(presetId: string, card: Scorecard): Promise<void> {
  const presets = await listPresets();
  const index = presets.findIndex((p) => p.id === presetId);
  if (index === -1) return;

  const preset = presets[index];
  const lowestScoreWins = preset.settings.lowestScoreWins;

  const totals = card.players.map((p) =>
    card.rounds.reduce((sum, r) => sum + (r.scores[p.id] ?? 0), 0)
  );

  let highestTotal = preset.stats.highestTotal;
  card.players.forEach((p, i) => {
    const total = totals[i];
    if (!highestTotal || total > highestTotal.value) {
      highestTotal = { value: total, playerName: p.name, cardName: card.name, date: card.updatedAt };
    }
  });

  let bestRound = preset.stats.bestRound;
  for (const round of card.rounds) {
    for (const p of card.players) {
      const score = round.scores[p.id];
      if (score == null) continue;
      const isBetter = bestRound
        ? lowestScoreWins
          ? score < bestRound.value
          : score > bestRound.value
        : true;
      if (isBetter) {
        bestRound = { value: score, playerName: p.name, cardName: card.name, date: card.updatedAt };
      }
    }
  }

  const gameWinningScore = totals.length ? (lowestScoreWins ? Math.min(...totals) : Math.max(...totals)) : 0;

  presets[index] = {
    ...preset,
    stats: {
      gamesPlayed: preset.stats.gamesPlayed + 1,
      totalWinningScore: preset.stats.totalWinningScore + gameWinningScore,
      totalRounds: preset.stats.totalRounds + card.rounds.length,
      highestTotal,
      bestRound,
    },
  };

  await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.clear();
}