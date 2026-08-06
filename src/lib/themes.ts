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
  },
  legalPad: {
    name: 'legalPad',
    label: 'Legal Pad',
    background: '#fffdb3',
    surface: '#fff9a0',
    border: '#e6df8a',
    text: '#1a1a6e',
    mutedText: '#3b49bf',
    accent: '#6a0dad',
    accentText: '#ffffff',
  },
  chalkboard: {
    name: 'chalkboard',
    label: 'Chalkboard',
    background: '#1c3d2e',
    surface: '#173326',
    border: '#2f5745',
    text: '#ffffff',
    mutedText: '#cfd8d3',
    accent: '#ff8fd0',
    accentText: '#1c3d2e',
  },
};

export const THEME_NAMES: Theme[] = ['whiteboard', 'midnight', 'legalPad', 'chalkboard'];