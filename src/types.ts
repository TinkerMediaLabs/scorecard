export type ScorecardStatus = 'active' | 'finished';
export type Theme = 'whiteboard' | 'midnight' | 'legalPad' | 'chalkboard';

export interface Player {
  id: string;
  name: string;
}

export interface Round {
  id: string;
  scores: Record<string, number | null>; // playerId -> score for this round
}

export interface ScorecardSettings {
  lowestScoreWins: boolean;
  showRoundWinner: boolean;
  useRomanNumerals: boolean;
  theme: Theme;
}

export interface Scorecard {
  id: string;
  name: string;
  status: ScorecardStatus;
  createdAt: string;
  updatedAt: string;
  players: Player[];
  rounds: Round[];
  settings: ScorecardSettings;
}

export const DEFAULT_SETTINGS: ScorecardSettings = {
  lowestScoreWins: false,
  showRoundWinner: true,
  useRomanNumerals: true,
  theme: 'whiteboard',
};