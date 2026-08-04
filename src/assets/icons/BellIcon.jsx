import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function BellIcon({ size = 22, color = '#FFFFFF' }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>;
}

export default BellIcon;
