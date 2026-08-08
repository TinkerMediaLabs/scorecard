import { Text as RNText, StyleSheet, TextProps, TextStyle } from 'react-native';
import { FONTS } from '../lib/fonts';

function resolveFontFamily(weight?: TextStyle['fontWeight']): string {
  if (weight === 'bold' || weight === '700' || weight === '800' || weight === '900') {
    return FONTS.bold;
  }
  if (weight === '100' || weight === '200' || weight === '300') {
    return FONTS.light;
  }
  return FONTS.regular;
}

export default function Text({ style, ...props }: TextProps) {
  const flattened = StyleSheet.flatten(style) ?? {};
  const { fontWeight, ...rest } = flattened;
  const fontFamily = resolveFontFamily(fontWeight);

  return <RNText style={[{ fontFamily }, rest]} {...props} />;
}