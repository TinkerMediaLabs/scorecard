import { TextSize } from '../types';

export const FONTS = {
  regular: 'ChalkboardRegular',
  bold: 'ChalkboardBold',
  light: 'ChalkboardLight',
};

export const TEXT_SIZE_OPTIONS: TextSize[] = ['standard', 'large', 'extraLarge'];

export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
  standard: 'Standard',
  large: 'Large',
  extraLarge: 'Extra Large',
};

export const TEXT_SCALE: Record<TextSize, number> = {
  standard: 1,
  large: 1.25,
  extraLarge: 1.5,
};