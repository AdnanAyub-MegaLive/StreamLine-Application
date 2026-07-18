import React from 'react';
import Svg, { Path } from 'react-native-svg';
export function PhoneIcon({
  size = 20,
  color = '#0B8A7A'
}) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 3.5h8A1.5 1.5 0 0 1 17.5 5v14A1.5 1.5 0 0 1 16 20.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M10 5.5h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M11.2 17.3h1.6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>;
}
export default PhoneIcon;
