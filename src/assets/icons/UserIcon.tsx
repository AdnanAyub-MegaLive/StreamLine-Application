import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

export function UserIcon({ size = 20, color = '#0B8A7A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8.5" r="3.5" stroke={color} strokeWidth="1.8" />
      <Path
        d="M5.5 19c1.4-3.1 4.2-4.8 6.5-4.8S16.1 15.9 18.5 19"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default UserIcon;