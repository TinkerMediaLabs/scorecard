import { ImageSourcePropType, TextStyle } from 'react-native';
import { Theme } from '../types';

export interface ButtonPalette {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontWeight: TextStyle['fontWeight'];
}

export interface FieldPalette {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontWeight: TextStyle['fontWeight'];
}

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
  fontFamilyBold?: string;
  roundColumnSurface?: string;
  arrow: { color: string };

  // Buttons — each is independently adjustable, no longer all tied to `accent`.
  editButton: ButtonPalette;
  finishButton: ButtonPalette;
  timerStartButton: ButtonPalette;
  timerResetButton: ButtonPalette;
  addRoundButton: ButtonPalette;
  modalNextButton: ButtonPalette;
  modalSignToggleButton: ButtonPalette;
  modalStepperButton: ButtonPalette;
  shareButton: ButtonPalette;

  // Text fields
  scoreInput: FieldPalette;
  extraFieldInput: FieldPalette;
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
    arrow: {color: '#000'},
    fontFamilyBold: 'FuzzyBubblesBold',

    editButton: { backgroundColor: 'transparent', textColor: '#155843', fontSize: 14, fontWeight: 'normal' },
    finishButton: { backgroundColor: '#155843', textColor: '#ffffff', fontSize: 14, fontWeight: '600' },
    timerStartButton: { backgroundColor: '#155843', textColor: '#ffffff', fontSize: 15, fontWeight: '600' },
    timerResetButton: { backgroundColor: 'transparent', textColor: '#000000', fontSize: 15, fontWeight: '600' },
    addRoundButton: { backgroundColor: 'transparent', textColor: '#155843', fontSize: 20, fontWeight: 'normal' },
    modalNextButton: { backgroundColor: '#155843', textColor: '#ffffff', fontSize: 14, fontWeight: '700' },
    modalSignToggleButton: { backgroundColor: '#e0e0e0', textColor: '#000000', fontSize: 16, fontWeight: '700' },
    modalStepperButton: { backgroundColor: '#e0e0e0', textColor: '#000000', fontSize: 16, fontWeight: '700' },
    shareButton: { backgroundColor: '#f0f0f0', textColor: '#155843', fontSize: 13, fontWeight: '700' },
    scoreInput: { backgroundColor: '#f5f5f5', textColor: '#000000', fontSize: 40, fontWeight: 'normal' },
    extraFieldInput: { backgroundColor: 'transparent', textColor: '#000000', fontSize: 18, fontWeight: 'normal' },
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
    arrow: {color: '#fff'},
    fontFamily: 'SpaceMonoRegular',
    fontFamilyBold: 'SpaceMonoBold',

    editButton: { backgroundColor: 'transparent', textColor: '#00e5ff', fontSize: 14, fontWeight: 'normal' },
    finishButton: { backgroundColor: '#00e5ff', textColor: '#000000', fontSize: 14, fontWeight: '600' },
    timerStartButton: { backgroundColor: '#00e5ff', textColor: '#000000', fontSize: 15, fontWeight: '600' },
    timerResetButton: { backgroundColor: 'transparent', textColor: '#ffffff', fontSize: 15, fontWeight: '600' },
    addRoundButton: { backgroundColor: 'transparent', textColor: '#00e5ff', fontSize: 20, fontWeight: 'normal' },
    modalNextButton: { backgroundColor: '#00e5ff', textColor: '#000000', fontSize: 14, fontWeight: '700' },
    modalSignToggleButton: { backgroundColor: '#2a2a2a', textColor: '#ffffff', fontSize: 16, fontWeight: '700' },
    modalStepperButton: { backgroundColor: '#2a2a2a', textColor: '#ffffff', fontSize: 16, fontWeight: '700' },
    shareButton: { backgroundColor: '#f0f0f0', textColor: '#155843', fontSize: 13, fontWeight: '700' },
    scoreInput: { backgroundColor: '#111111', textColor: '#ffffff', fontSize: 40, fontWeight: 'normal' },
    extraFieldInput: { backgroundColor: 'transparent', textColor: '#ffffff', fontSize: 18, fontWeight: 'normal' },
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
    fontFamilyBold: 'FuzzyBubblesBold',

    editButton: { backgroundColor: 'transparent', textColor: '#6a0dadB3', fontSize: 14, fontWeight: 'normal' },
    finishButton: { backgroundColor: '#6a0dadB3', textColor: '#ffffff', fontSize: 14, fontWeight: '600' },
    timerStartButton: { backgroundColor: '#6a0dadB3', textColor: '#ffffff', fontSize: 15, fontWeight: '600' },
    timerResetButton: { backgroundColor: 'transparent', textColor: '#1a1a6e', fontSize: 15, fontWeight: '600' },
    addRoundButton: { backgroundColor: 'transparent', textColor: '#6a0dadB3', fontSize: 20, fontWeight: 'normal' },
    modalNextButton: { backgroundColor: '#6a0dadB3', textColor: '#ffffff', fontSize: 14, fontWeight: '700' },
    modalSignToggleButton: { backgroundColor: '#e6df8a', textColor: '#1a1a6e', fontSize: 16, fontWeight: '700' },
    modalStepperButton: { backgroundColor: '#e6df8a', textColor: '#1a1a6e', fontSize: 16, fontWeight: '700' },
    shareButton: { backgroundColor: '#f0f0f0', textColor: '#155843', fontSize: 13, fontWeight: '700' },
    scoreInput: { backgroundColor: '#fff9a0', textColor: '#1a1a6e', fontSize: 40, fontWeight: 'normal' },
    extraFieldInput: { backgroundColor: 'transparent', textColor: '#1a1a6e', fontSize: 18, fontWeight: 'normal' },
    arrow: {color: '#1a1a6e'},
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
    arrow: {color: '#ff8fd0CC'},
    fontFamilyBold: 'FuzzyBubblesBold',

    editButton: { backgroundColor: 'transparent', textColor: '#ff8fd0CC', fontSize: 14, fontWeight: 'normal' },
    finishButton: { backgroundColor: '#ff8fd0CC', textColor: '#1c3d2e', fontSize: 14, fontWeight: '600' },
    timerStartButton: { backgroundColor: '#ff8fd0CC', textColor: '#1c3d2e', fontSize: 15, fontWeight: '600' },
    timerResetButton: { backgroundColor: 'transparent', textColor: '#ffffff', fontSize: 15, fontWeight: '600' },
    addRoundButton: { backgroundColor: 'transparent', textColor: '#ff8fd0CC', fontSize: 20, fontWeight: 'normal' },
    modalNextButton: { backgroundColor: '#ff8fd0CC', textColor: '#1c3d2e', fontSize: 14, fontWeight: '700' },
    modalSignToggleButton: { backgroundColor: '#2f5745', textColor: '#ffffff', fontSize: 16, fontWeight: '700' },
    modalStepperButton: { backgroundColor: '#2f5745', textColor: '#ffffff', fontSize: 16, fontWeight: '700' },
    shareButton: { backgroundColor: '#f0f0f0', textColor: '#155843', fontSize: 13, fontWeight: '700' },
    scoreInput: { backgroundColor: '#173326', textColor: '#ffffff', fontSize: 40, fontWeight: 'normal' },
    extraFieldInput: { backgroundColor: 'transparent', textColor: '#ffffff', fontSize: 18, fontWeight: 'normal' },
  },
  chalkboard2: {
    name: 'chalkboard2',
    label: 'Chalkboard 2',
    background: 'black',
    surface: 'black',
    border: '#4e4e4e',
    text: '#ffffff',
    mutedText: '#cfd8d3',
    accent: '#7f7f7f4D',
    accentText: 'white',
    roundWinnerHighlight: '#7f7f7f4D',
    backgroundImage: require('../../assets/images/chalkboard.jpg'),
    roundColumnSurface: 'transparent',
    arrow: {color: '#fff'},
    fontFamilyBold: 'FuzzyBubblesBold',

    editButton: { backgroundColor: 'transparent', textColor: '#cccccc', fontSize: 14, fontWeight: 'normal' },
    finishButton: { backgroundColor: '#4e4e4e', textColor: 'white', fontSize: 14, fontWeight: '600' },
    timerStartButton: { backgroundColor: '#7f7e7e', textColor: 'white', fontSize: 15, fontWeight: '600' },
    timerResetButton: { backgroundColor: 'transparent', textColor: '#ffffff', fontSize: 15, fontWeight: '600' },
    addRoundButton: { backgroundColor: 'transparent', textColor: '#c9c9c9', fontSize: 20, fontWeight: 'normal' },
    modalNextButton: { backgroundColor: '#4e4e4e', textColor: 'white', fontSize: 14, fontWeight: '700' },
    modalSignToggleButton: { backgroundColor: '#4e4e4e', textColor: '#ffffff', fontSize: 16, fontWeight: '700' },
    modalStepperButton: { backgroundColor: '#4e4e4e', textColor: '#ffffff', fontSize: 16, fontWeight: '700' },
    shareButton: { backgroundColor: '#f0f0f0', textColor: '#155843', fontSize: 13, fontWeight: '700' },
    scoreInput: { backgroundColor: 'black', textColor: '#ffffff', fontSize: 40, fontWeight: 'normal' },
    extraFieldInput: { backgroundColor: 'transparent', textColor: '#ffffff', fontSize: 18, fontWeight: 'normal' },
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
    fontFamily: 'SilkscreenRegular',
    arrow: {color: '#ff2e9a'},
    fontFamilyBold: 'SilkscreenBold',

    editButton: { backgroundColor: 'transparent', textColor: '#ff2e9a', fontSize: 14, fontWeight: 'normal',  },
    finishButton: { backgroundColor: '#ff2e9a', textColor: '#0d0221', fontSize: 14, fontWeight: '600' },
    timerStartButton: { backgroundColor: '#ff2e9a', textColor: '#0d0221', fontSize: 15, fontWeight: '600' },
    timerResetButton: { backgroundColor: 'transparent', textColor: '#00f0ff', fontSize: 15, fontWeight: '600' },
    addRoundButton: { backgroundColor: 'transparent', textColor: '#ff2e9a', fontSize: 20, fontWeight: 'normal' },
    modalNextButton: { backgroundColor: '#ff2e9a', textColor: '#0d0221', fontSize: 14, fontWeight: '700' },
    modalSignToggleButton: { backgroundColor: '#3d1a5c', textColor: '#00f0ff', fontSize: 16, fontWeight: '700' },
    modalStepperButton: { backgroundColor: '#3d1a5c', textColor: '#00f0ff', fontSize: 16, fontWeight: '700' },
    shareButton: { backgroundColor: '#f0f0f0', textColor: '#155843', fontSize: 13, fontWeight: '700' },
    scoreInput: { backgroundColor: '#1a0b2e', textColor: '#00f0ff', fontSize: 40, fontWeight: 'normal' },
    extraFieldInput: { backgroundColor: 'transparent', textColor: '#00f0ff', fontSize: 18, fontWeight: 'normal' },
  },
};

export const THEME_NAMES: Theme[] = ['whiteboard', 'midnight', 'legalPad', 'chalkboard', 'chalkboard2', 'retro'];