import React from 'react';
import Svg, { Path } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

export function EmailIcon({ size = 20, color = '#0B8A7A' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6.5h16a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 17.5H4A1.5 1.5 0 0 1 2.5 16V8A1.5 1.5 0 0 1 4 6.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Path
        d="m4.5 8 7.5 5 7.5-5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default EmailIcon;