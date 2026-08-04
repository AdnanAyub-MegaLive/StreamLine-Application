import React from 'react';
import Svg, { Path } from 'react-native-svg';

// A paper-plane "send" glyph (matches Ionicons' send-outline) — built
// with react-native-svg like every other icon here instead of pulling in
// react-native-vector-icons as a second icon library for just this one.
export function RepostIcon({ size = 20, color = '#FFFFFF' }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 3 3 10.5l7.5 3M21 3l-7.5 18-3-7.5M21 3 10.5 13.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>;
}

export default RepostIcon;
