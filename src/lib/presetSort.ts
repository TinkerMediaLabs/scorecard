import { Preset } from '../types';

export type PresetSortMode = 'mostRecent' | 'mostPlayed';

export function sortPresets(presets: Preset[], mode: PresetSortMode): Preset[] {
  const list = [...presets];
  if (mode === 'mostPlayed') {
    return list.sort((a, b) => {
      const diff = b.stats.gamesPlayed - a.stats.gamesPlayed;
      if (diff !== 0) return diff;
      return Math.random() - 0.5;
    });
  }
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}