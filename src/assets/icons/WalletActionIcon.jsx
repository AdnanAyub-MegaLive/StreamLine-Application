import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

// Consistent outlined icons for the My Wallet action row. Native SVG keeps
// the neon strokes sharp on every Android/iOS display density.
export function WalletActionIcon({ name, size = 24, color = '#FFFFFF' }) {
  const p = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const icons = {
    topup: <><Path {...p} d="M4 7.5V6a3 3 0 0 1 3-3h8.5L20 7.5V18a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-2.5" /><Path {...p} d="M4 8h11a2 2 0 0 1 2 2v3H6a2 2 0 0 1-2-2V8Z" /><Path {...p} d="M14 16h6v3a2 2 0 0 1-2 2h-4v-5Z" /><Path {...p} d="M17 18.5h.01" /></>,
    withdraw: <><Rect {...p} x="5" y="3" width="14" height="18" rx="3" /><Path {...p} d="M12 16V7M8.5 10.5 12 7l3.5 3.5" /></>,
    transfer: <><Rect {...p} x="4" y="3" width="16" height="18" rx="3" /><Path {...p} d="M8 9h8m0 0-2.5-2.5M16 9l-2.5 2.5M16 15H8m0 0 2.5 2.5M8 15l2.5-2.5" /></>,
    transaction: <><Rect {...p} x="5" y="3" width="14" height="18" rx="2" /><Path {...p} d="M9 8h6M9 12h6M9 16h4" /><Path {...p} d="M8 3h8v3H8z" /></>
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{icons[name] ?? icons.transaction}</Svg>;
}
