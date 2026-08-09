import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function ProfileIcon({ name, size = 22, color = '#FFFFFF' }) {
  const p = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const icons = {
    level: <><Path {...p} d="M5 20V12M10 20V7M15 20V10M20 20V4M3 20h18" /></>,
    shop: <><Path {...p} d="M5 9h14l-1 11H6L5 9Z" /><Path {...p} d="M8 9V7a4 4 0 0 1 8 0v2" /></>,
    badge: <><Circle {...p} cx="12" cy="9" r="5" /><Path {...p} d="m8.5 13-1 8 3.5-2 3.5 2-1-8" /></>,
    verified: <><Rect {...p} x="4" y="5" width="16" height="14" rx="2" /><Path {...p} d="m8 12 2.5 2.5L16.5 9" /></>,
    agency: <><Path {...p} d="M4 20h16M6 20V7l6-3 6 3v13M9 10h1M14 10h1M9 14h1M14 14h1" /><Path {...p} d="M11 20v-3h2v3" /></>,
    bag: <><Rect {...p} x="4" y="8" width="16" height="12" rx="2" /><Path {...p} d="M8 8V6a4 4 0 0 1 8 0v2M9 13h6" /></>,
    monitor: <><Rect {...p} x="3" y="4" width="18" height="13" rx="2" /><Path {...p} d="m7 13 3-3 2 2 4-4M9 21h6M12 17v4" /></>,
    statistics: <><Path {...p} d="M12 3a9 9 0 1 0 9 9h-9V3Z" /><Path {...p} d="M15 3a6 6 0 0 1 6 6h-6V3Z" /></>,
    settings: <><Circle {...p} cx="12" cy="12" r="3" /><Path {...p} d="M12 3v2M12 19v2M4 12h2M18 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" /></>,
    support: <Path {...p} d="M5 13v-2a7 7 0 0 1 14 0v2M5 13v3h3v-4H5ZM19 13v3h-3v-4h3ZM16 19c-1 1-2.3 1.5-4 1.5" />,
    wallet: <><Rect {...p} x="3" y="6" width="18" height="13" rx="2" /><Path {...p} d="M16 11h5v4h-5a2 2 0 0 1 0-4Z" /><Circle cx="17" cy="13" r=".8" fill={color} /></>,
    tasks: <><Rect {...p} x="6" y="4" width="12" height="17" rx="2" /><Path {...p} d="M9 4.5h6v2H9zM9 11l1.5 1.5L13 10M9 16l1.5 1.5L13 15" /></>,
    diamond: <Path {...p} d="m4 9 3-5h10l3 5-8 11L4 9ZM4 9h16M9 4l3 5 3-5" />,
    chat: <Path {...p} d="M4 5h16v11H9l-5 4V5Z" />,
    priority: <Path {...p} d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" />,
    gift: <><Rect {...p} x="5" y="10" width="14" height="10" rx="1" /><Path {...p} d="M3 7h18v3H3zM12 7v13M12 7c-3-4-6-2-6 0s4 0 6 0Zm0 0c3-4 6-2 6 0s-4 0-6 0Z" /></>,
    shield: <Path {...p} d="m12 3 7 3v5c0 4.7-3 8-7 10-4-2-7-5.3-7-10V6l7-3Z" />
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{icons[name] ?? icons.shield}</Svg>;
}
