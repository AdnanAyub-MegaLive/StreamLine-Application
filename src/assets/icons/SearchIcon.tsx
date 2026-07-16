import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

export function SearchIcon({ size = 22, color = '#7A8C89' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={2} />
      <Path d="m20 20-4.35-4.35" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export default SearchIcon;
