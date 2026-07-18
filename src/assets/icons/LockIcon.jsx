import React from 'react';
import Svg, { Path } from 'react-native-svg';
export function LockIcon({
  size = 20,
  color = '#0B8A7A'
}) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8.5 10V8.1a3.5 3.5 0 0 1 7 0V10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M6.5 10.5h11A1.5 1.5 0 0 1 19 12v6a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18v-6a1.5 1.5 0 0 1 1.5-1.5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M12 13.5v2.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>;
}
export default LockIcon;
