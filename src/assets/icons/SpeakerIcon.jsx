import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function SpeakerIcon({ size = 16, color = '#FFFFFF', muted = false }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 9.5h3.2L11 6v12l-3.8-3.5H4v-5Z" fill={color} />
      {muted
        ? <Path d="m15.5 9.5 4 5m0-5-4 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        : <Path d="M15.3 8.3a5 5 0 0 1 0 7.4" stroke={color} strokeWidth={1.8} strokeLinecap="round" fill="none" />}
    </Svg>;
}

export default SpeakerIcon;
