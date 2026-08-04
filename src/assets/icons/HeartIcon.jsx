import React from 'react';
import Svg, { Path } from 'react-native-svg';

const HEART_PATH = 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';

export function HeartIcon({ size = 22, color = '#FFFFFF', filled = false }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={HEART_PATH} fill={filled ? color : 'none'} stroke={color} strokeWidth={filled ? 0 : 1.8} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>;
}

export default HeartIcon;
