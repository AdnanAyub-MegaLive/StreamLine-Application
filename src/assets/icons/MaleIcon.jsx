import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
export function MaleIcon({
  size = 24,
  color = '#0B8A7A'
}) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="10" cy="14" r="5" stroke={color} strokeWidth="1.8" />
      <Path d="M13.5 10.5 20 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M15.5 4h4v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>;
}
export default MaleIcon;
