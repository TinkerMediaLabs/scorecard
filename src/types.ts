export type ScorecardStatus = 'active' | 'finished';
export type Theme = 'whiteboard' | 'midnight' | 'legalPad' | 'chalkboard';
export type DoneSound = 'none' | 'ting' | 'rooster' | 'whistle' | 'doorbell' | 'airHorn' | 'trombone' | 'meepMeep' | 'tickTock' | 'bomb';
export type TickerSound = 'none' | 'clock' | 'stopwatch' | 'grandfather' | 'waterTap' | 'blood' | 'warDrums';

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
  timerEnabled: boolean;
  timerWarningEnabled: boolean;
  timerRoundSeconds: number;
  timerDoneSound: DoneSound;
  timerTickerSound: TickerSound;
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
  timerEnabled: false,
  timerWarningEnabled: false,
  timerRoundSeconds: 60,
  timerDoneSound: 'ting',
  timerTickerSound: 'clock',
};