import { ImageSourcePropType } from 'react-native';
import { Theme } from '../types';

export interface ThemePalette {
  name: Theme;
  label: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  mutedText: string;
  accent: string;
  accentText: string;
  roundWinnerHighlight: string;
  backgroundImage?: ImageSourcePropType;
  fontFamily?: string;
  roundColumnSurface?: string;
}

export const THEMES: Record<Theme, ThemePalette> = {
  whiteboard: {
    name: 'whiteboard',
    label: 'Whiteboard',
    background: '#ffffff',
    surface: '#f5f5f5',
    border: '#e0e0e0',
    text: '#000000',
    mutedText: '#666666',
    accent: '#155843',
    accentText: '#ffffff',
    roundWinnerHighlight: '#e8e8e8',
  },
  midnight: {
    name: 'midnight',
    label: 'Midnight',
    background: '#000000',
    surface: '#111111',
    border: '#2a2a2a',
    text: '#ffffff',
    mutedText: '#aaaaaa',
    accent: '#00e5ff',
    accentText: '#000000',
    roundWinnerHighlight: '#242424',
  },
  legalPad: {
    name: 'legalPad',
    label: 'Legal Pad',
    background: '#fffdb3',
    surface: '#fff9a0',
    border: '#e6df8a',
    text: '#1a1a6e',
    mutedText: '#3b49bf',
    accent: '#6a0dadB3',
    accentText: '#ffffff',
    roundWinnerHighlight: '#ffe98a',
  },
  chalkboard: {
    name: 'chalkboard',
    label: 'Chalkboard',
    background: '#1c3d2e',
    surface: '#173326',
    border: '#2f5745',
    text: '#ffffff',
    mutedText: '#cfd8d3',
    accent: '#ff8fd0CC',
    accentText: '#1c3d2e',
    roundWinnerHighlight: '#28493a',
  },
  chalkboard2: {
    name: 'chalkboard2',
    label: 'Chalkboard 2',
    background: 'black',
    surface: 'black',
    border: '#4e4e4e',
    text: '#ffffff',
    mutedText: '#cfd8d3',
    accent: '#7f7e7e',
    accentText: 'white',
    roundWinnerHighlight: '#7f7f7f4D',
    backgroundImage: require('../../assets/images/chalkboard.jpg'),
    roundColumnSurface: 'transparent',
  },
  retro: {
    name: 'retro',
    label: 'Retro',
    background: '#0d0221',
    surface: '#1a0b2e',
    border: '#3d1a5c',
    text: '#00f0ff',
    mutedText: '#8b7ec8',
    accent: '#ff2e9a',
    accentText: '#0d0221',
    roundWinnerHighlight: '#2e0854',
    fontFamily: 'PressStart2P',
  },
};

export const THEME_NAMES: Theme[] = ['whiteboard', 'midnight', 'legalPad', 'chalkboard', 'chalkboard2', 'retro'];