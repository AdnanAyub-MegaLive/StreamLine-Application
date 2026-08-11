import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

// Neon transaction-state icons used by wallet history rows.
export function TransactionStatusIcon({ type = 'sent', size = 38 }) {
  const config = {
    sent: { color: '#16D992' },
    withdrawal: { color: '#FFB21A' },
    received: { color: '#00CFFF' },
    purchase: { color: '#A855F7' }
  }[type] ?? { color: '#16D992' };
  const p = { stroke: config.color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const glyph = type === 'purchase'
    ? <><Path {...p} d="M5 7h14l-1 12H6L5 7Z" /><Path {...p} d="M8 7V5a4 4 0 0 1 8 0v2M9 12h6" /></>
    : type === 'withdrawal'
    ? <><Rect {...p} x="7" y="9" width="10" height="10" rx="2" /><Path {...p} d="M9 9V7a3 3 0 0 1 6 0v2M13 14h4" /></>
    : type === 'received'
      ? <Path {...p} d="M12 6v12m0 0-4-4m4 4 4-4" />
      : <Path {...p} d="M12 18V6m0 0-4 4m4-4 4 4" />;
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{glyph}</Svg>;
}
