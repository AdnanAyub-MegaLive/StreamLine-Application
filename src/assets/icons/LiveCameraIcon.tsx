import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

export function LiveCameraIcon({ size = 22, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={7} width={12} height={10} rx={2.5} stroke={color} strokeWidth={2} />
      <Path d="M15 10.8 21 8v8l-6-2.8Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

export default LiveCameraIcon;
