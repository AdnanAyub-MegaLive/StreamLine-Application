import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
export function FemaleIcon({
  size = 24,
  color = '#0B8A7A'
}) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="11" r="5" stroke={color} strokeWidth="1.8" />
      <Path d="M12 16v5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M9.5 19h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>;
}
export default FemaleIcon;
