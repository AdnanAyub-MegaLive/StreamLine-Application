import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function PlayIcon({ size = 16, color = '#FFFFFF' }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 4.5v15l13-7.5-13-7.5Z" fill={color} />
    </Svg>;
}

export default PlayIcon;
