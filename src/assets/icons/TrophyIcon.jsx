import React from 'react';
import Svg, { Path } from 'react-native-svg';
export function TrophyIcon({
  size = 22,
  color = '#7A8C89'
}) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 4h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 13v3M9 20h6M10 17h4v3h-4z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>;
}
export default TrophyIcon;
