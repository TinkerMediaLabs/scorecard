export type ScorecardStatus = 'active' | 'finished';
export type Theme = 'whiteboard' | 'midnight' | 'legalPad' | 'chalkboard' | 'chalkboard2';
export type DoneSound = 'none' | 'ting' | 'rooster' | 'whistle' | 'doorbell' | 'airHorn' | 'trombone' | 'meepMeep' | 'tickTock' | 'bomb';
export type TickerSound = 'none' | 'clock' | 'stopwatch' | 'grandfather' | 'waterTap' | 'blood' | 'warDrums';
export type TextSize = 'standard' | 'large' | 'extraLarge';
export type WinCondition = 'mostPoints' | 'leastPoints' | 'mostRoundsWon';

export interface Player {
  id: string;
  name: string;
}

export interface Round {
  id: string;
  scores: Record<string, number | null>;
  bids: Record<string, number | null>;
  melds: Record<string, number | null>;
  bonuses: Record<string, number | null>;
  customValues: Record<string, (number | null)[]>;
}

export interface ScorecardSettings {
  winCondition: WinCondition;
  showRoundWinner: boolean;
  highlightRoundWinner: boolean;
  useRomanNumerals: boolean;
  theme: Theme;
  timerEnabled: boolean;
  timerWarningEnabled: boolean;
  timerRoundSeconds: number;
  timerDoneSound: DoneSound;
  timerTickerSound: TickerSound;
  bidEnabled: boolean;
  meldEnabled: boolean;
  bonusEnabled: boolean;
  customFields: string[];
  textSize: TextSize;
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
  presetId?: string;
}

export interface PresetGameRecord {
  value: number;
  playerName: string;
  cardName: string;
  date: string;
}

export interface PresetStats {
  gamesPlayed: number;
  totalWinningScore: number;
  totalRounds: number;
  highestTotal: PresetGameRecord | null;
  lowestTotal: PresetGameRecord | null;
  bestRound: PresetGameRecord | null;
}

export const DEFAULT_PRESET_STATS: PresetStats = {
  gamesPlayed: 0,
  totalWinningScore: 0,
  totalRounds: 0,
  highestTotal: null,
  lowestTotal: null,
  bestRound: null,
};

export interface Preset {
  id: string;
  name: string;
  settings: ScorecardSettings;
  createdAt: string;
  stats: PresetStats;
  players: Player[];
}

export const DEFAULT_SETTINGS: ScorecardSettings = {
  winCondition: 'mostPoints',
  showRoundWinner: true,
  highlightRoundWinner: true,
  useRomanNumerals: true,
  theme: 'whiteboard',
  timerEnabled: false,
  timerWarningEnabled: false,
  timerRoundSeconds: 60,
  timerDoneSound: 'ting',
  timerTickerSound: 'clock',
  bidEnabled: false,
  meldEnabled: false,
  bonusEnabled: false,
  customFields: [],
  textSize: 'standard',
};