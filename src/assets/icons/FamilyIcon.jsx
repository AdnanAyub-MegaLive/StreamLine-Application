import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
export function FamilyIcon({
  size = 22,
  color = '#7A8C89'
}) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={9} cy={8} r={2.6} stroke={color} strokeWidth={2} />
      <Path d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={16.5} cy={8.5} r={2} stroke={color} strokeWidth={1.6} />
      <Path d="M15 19c0-2 1.6-3.6 3.6-3.6.8 0 1.6.3 2.2.7" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>;
}
export default FamilyIcon;
