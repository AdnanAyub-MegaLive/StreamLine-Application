import React from 'react';
import { SvgXml } from 'react-native-svg';
import { discoverPostFireFrameSvg } from '../assets/discoverPostFireFrameSvg';

// Live-rendered (not a static Image) so the source SVG's own <filter> glow
// (feGaussianBlur/feColorMatrix) actually renders — a rasterized PNG of it
// couldn't. preserveAspectRatio="none" is already baked into the source
// string itself (every post card has a different height, so the frame
// must stretch to match rather than letterbox).
export function DiscoverPostFireFrame({ width = '100%', height = '100%', style }) {
  return <SvgXml xml={discoverPostFireFrameSvg} width={width} height={height} style={style} />;
}

export default DiscoverPostFireFrame;
