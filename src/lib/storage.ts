import AsyncStorage from '@react-native-async-storage/async-storage';
import { Scorecard } from '../types';

const INDEX_KEY = 'scorecards_index';
const SCORECARD_PREFIX = 'scorecard_';

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
  return json ? JSON.parse(json) : null;
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