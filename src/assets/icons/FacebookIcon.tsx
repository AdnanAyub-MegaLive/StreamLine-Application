import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

export function FacebookIcon({ size = 22, color = '#1877F2' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={12} fill={color} />
      <Path
        d="M13.5 21v-7.6h2.55l.38-2.96h-2.93V8.56c0-.86.24-1.44 1.47-1.44h1.57V4.48A20.9 20.9 0 0 0 14.24 4c-2.24 0-3.77 1.37-3.77 3.87v2.57H7.9v2.96h2.57V21h3.03Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

export default FacebookIcon;
