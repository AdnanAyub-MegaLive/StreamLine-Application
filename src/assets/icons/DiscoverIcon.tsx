import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

export function DiscoverIcon({ size = 22, color = '#7A8C89' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path
        d="m14.8 9.2-1.4 3.8a1 1 0 0 1-.6.6l-3.8 1.4 1.4-3.8a1 1 0 0 1 .6-.6l3.8-1.4Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default DiscoverIcon;
