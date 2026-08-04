import React from 'react';
import Svg, { Path } from 'react-native-svg';

const BOOKMARK_PATH = 'M6 3.5h12a.5.5 0 0 1 .5.5v17l-6.5-4-6.5 4v-17a.5.5 0 0 1 .5-.5z';

export function BookmarkIcon({ size = 22, color = '#FFFFFF', filled = false }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={BOOKMARK_PATH} fill={filled ? color : 'none'} stroke={color} strokeWidth={filled ? 0 : 1.8} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>;
}

export default BookmarkIcon;
