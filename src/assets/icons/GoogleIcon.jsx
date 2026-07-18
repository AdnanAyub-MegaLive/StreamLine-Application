import React from 'react';
import Svg, { Path } from 'react-native-svg';
export function GoogleIcon({
  size = 22
}) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.1c-.2 1-.8 1.9-1.6 2.5v2h2.6C20.2 17 21 14.9 21 12.2Z" fill="#4285F4" />
      <Path d="M12 21c2.3 0 4.3-.8 5.8-2.2l-2.6-2c-.8.5-1.8.8-3.2.8-2.5 0-4.6-1.7-5.4-4H4v2.1A9 9 0 0 0 12 21Z" fill="#34A853" />
      <Path d="M6.6 13.6c-.2-.6-.4-1.3-.4-2s.1-1.4.4-2V7.5H4A9 9 0 0 0 3 12c0 1.4.3 2.7 1 3.9l2.6-2.3Z" fill="#FBBC05" />
      <Path d="M12 5.6c1.2 0 2.3.4 3.2 1.2l2.4-2.4A9 9 0 0 0 12 3C8.8 3 6 4.8 4.5 7.5L7 9.5c.8-2.2 2.9-3.9 5-3.9Z" fill="#EA4335" />
      <Path d="M3 3h18v18H3z" fill="none" />
    </Svg>;
}
export default GoogleIcon;
