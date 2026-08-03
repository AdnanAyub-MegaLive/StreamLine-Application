import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../theme';

export function VerifiedTick({ size = 14 }) {
  const theme = useTheme();
  return <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11} fill={theme.colors.facebookBlue} />
      <Path d="M7 12.5L10.2 15.7L17 8.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>;
}

export default VerifiedTick;
