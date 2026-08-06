import { Text as RNText, TextProps } from 'react-native';
import { FONTS } from '../lib/fonts';

export default function Text({ style, ...props }: TextProps) {
  return <RNText style={[{ fontFamily: FONTS.regular }, style]} {...props} />;
}