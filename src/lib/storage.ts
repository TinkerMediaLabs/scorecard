import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_PRESET_STATS, DEFAULT_SETTINGS, Preset, Scorecard, ScorecardSettings, WinCondition } from '../types';

const INDEX_KEY = 'scorecards_index';
const SCORECARD_PREFIX = 'scorecard_';
const PRESETS_KEY = 'presets';

function migrateSettings(rawSettings: any): ScorecardSettings {
  const winCondition: WinCondition =
    rawSettings?.winCondition ?? (rawSettings?.lowestScoreWins ? 'leastPoints' : 'mostPoints');
  return { ...DEFAULT_SETTINGS, ...rawSettings, winCondition };
}

function hydrateScorecard(raw: Scorecard): Scorecard {
  return {
    ...raw,
    settings: migrateSettings(raw.settings),
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
    settings: migrateSettings(raw.settings),
    stats: { ...DEFAULT_PRESET_STATS, ...raw.stats },
    players:
      raw.players && raw.players.length > 0
        ? raw.players
        : [
            { id: 'preset-default-1', name: 'Player 1' },
            { id: 'preset-default-2', name: 'Player 2' },
          ],
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
  const winCondition = preset.settings.winCondition;
  const lowestScoreWins = winCondition === 'leastPoints';

  const totals = card.players.map((p) =>
    card.rounds.reduce((sum, r) => sum + (r.scores[p.id] ?? 0), 0)
  );

  const roundWinsCount = card.players.map((_, playerIndex) =>
    card.rounds.reduce((count, r) => {
      const scores = card.players.map((p) => r.scores[p.id] ?? null);
      const values = scores.filter((v): v is number => v !== null);
      if (values.length === 0) return count;
      const best = lowestScoreWins ? Math.min(...values) : Math.max(...values);
      return scores[playerIndex] === best ? count + 1 : count;
    }, 0)
  );

  let highestTotal = preset.stats.highestTotal;
  let lowestTotal = preset.stats.lowestTotal;
  card.players.forEach((p, i) => {
    const total = totals[i];
    if (!highestTotal || total > highestTotal.value) {
      highestTotal = { value: total, playerName: p.name, cardName: card.name, date: card.updatedAt };
    }
    if (!lowestTotal || total < lowestTotal.value) {
      lowestTotal = { value: total, playerName: p.name, cardName: card.name, date: card.updatedAt };
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

  let winningIndex = -1;
  if (winCondition === 'mostRoundsWon') {
    const maxWins = roundWinsCount.length ? Math.max(...roundWinsCount) : 0;
    winningIndex = roundWinsCount.indexOf(maxWins);
  } else if (totals.length) {
    const best = lowestScoreWins ? Math.min(...totals) : Math.max(...totals);
    winningIndex = totals.indexOf(best);
  }
  const gameWinningScore = winningIndex >= 0 ? totals[winningIndex] : 0;

  presets[index] = {
    ...preset,
    stats: {
      gamesPlayed: preset.stats.gamesPlayed + 1,
      totalWinningScore: preset.stats.totalWinningScore + gameWinningScore,
      totalRounds: preset.stats.totalRounds + card.rounds.length,
      highestTotal,
      lowestTotal,
      bestRound,
    },
  };

  await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export async function clearAllData(): Promise<void> {
  await AsyncStorage.clear();
}