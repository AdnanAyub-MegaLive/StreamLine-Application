import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
export function EyeIcon({
  size = 20,
  color = '#0B8A7A'
}) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2.5 12s3.6-6.5 9.5-6.5S21.5 12 21.5 12 17.9 18.5 12 18.5 2.5 12 2.5 12Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth="1.8" />
    </Svg>;
}
export default EyeIcon;
