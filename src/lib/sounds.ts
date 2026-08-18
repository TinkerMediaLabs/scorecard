import { DoneSound, TickerSound } from '../types';

export const DONE_SOUND_OPTIONS: DoneSound[] = ['none', 'ting', 'rooster', 'whistle', 'doorbell', 'airHorn', 'trombone', 'meepMeep', 'buzzer', 'bomb'];
export const TICKER_SOUND_OPTIONS: TickerSound[] = ['none', 'clock', 'stopwatch', 'grandfather', 'waterTap', 'blood', 'warDrums'];

export const DONE_SOUNDS: Record<Exclude<DoneSound, 'none'>, number> = {
  ting: require('../../assets/audio/done/Ting.mp3'),
  rooster: require('../../assets/audio/done/Rooster.mp3'),
  whistle: require('../../assets/audio/done/Whistle.mp3'),
  doorbell: require('../../assets/audio/done/Doorbell.mp3'),
  airHorn: require('../../assets/audio/done/AirHorn.mp3'),
  trombone: require('../../assets/audio/done/Trombone.mp3'),
  meepMeep: require('../../assets/audio/done/MeepMeep.mp3'),
  buzzer: require('../../assets/audio/done/Buzzer.mp3'),
  bomb: require('../../assets/audio/done/Bomb.mp3'),
};

export const TICKER_SOUNDS: Record<Exclude<TickerSound, 'none'>, number> = {
  clock: require('../../assets/audio/ticker/Clock.mp3'),
  stopwatch: require('../../assets/audio/ticker/Stopwatch.mp3'),
  grandfather: require('../../assets/audio/ticker/Grandfather.mp3'),
  waterTap: require('../../assets/audio/ticker/WaterTap.mp3'),
  blood: require('../../assets/audio/ticker/Blood.mp3'),
  warDrums: require('../../assets/audio/ticker/WarDrums.mp3'),
};

export const WARNING_SOUND = require('../../assets/audio/warning/DingDing.mp3');

export const DONE_SOUND_LABELS: Record<DoneSound, string> = {
  none: 'None',
  ting: 'Ting',
  rooster: 'Rooster',
  whistle: 'Whistle',
  doorbell: 'Doorbell',
  airHorn: 'Air Horn',
  trombone: 'Trombone',
  meepMeep: 'Meep Meep',
  buzzer: 'Buzzer',
  bomb: 'Bomb',
};

export const TICKER_SOUND_LABELS: Record<TickerSound, string> = {
  none: 'None',
  clock: 'Clock',
  stopwatch: 'Stopwatch',
  grandfather: 'Grandfather Clock',
  waterTap: 'Water Tap',
  blood: 'Blood',
  warDrums: 'War Drums',
};