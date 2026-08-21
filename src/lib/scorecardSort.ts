import { Scorecard } from '../types';

export type ScorecardSortMode = 'mostRecent' | 'oldest';

export function sortScorecards(scorecards: Scorecard[], mode: ScorecardSortMode): Scorecard[] {
  const list = [...scorecards];
  if (mode === 'oldest') {
    return list.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  }
  return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}