import { WinCondition } from '../types';

export const WIN_CONDITION_OPTIONS: WinCondition[] = ['mostPoints', 'leastPoints', 'mostRoundsWon'];

export const WIN_CONDITION_LABELS: Record<WinCondition, string> = {
  mostPoints: 'Most Points',
  leastPoints: 'Least Points',
  mostRoundsWon: 'Most Rounds Won',
};