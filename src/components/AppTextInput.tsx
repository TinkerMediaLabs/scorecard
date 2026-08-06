import { forwardRef } from 'react';
import { TextInput as RNTextInput, TextInputProps } from 'react-native';
import { FONTS } from '../lib/fonts';

const TextInput = forwardRef<RNTextInput, TextInputProps>(({ style, ...props }, ref) => (
  <RNTextInput ref={ref} style={[{ fontFamily: FONTS.regular }, style]} {...props} />
));

export default TextInput;