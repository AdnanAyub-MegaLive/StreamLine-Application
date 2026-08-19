import React from 'react';
import { SvgAst, parse } from 'react-native-svg';
import { discoverPostFireFrameSvg } from '../assets/discoverPostFireFrameSvg';

// BUGFIX (scroll lag): SvgXml re-parses the full XML string from scratch on
// every mount — with one of these per post card, that meant re-parsing the
// same markup (several gradients, blur filters, ~35 paths) every time the
// Discover FlatList recycled/mounted a new card during scroll, all
// synchronous JS-thread work fighting the scroll gesture. Parsing once at
// module load and reusing the resulting AST via SvgAst (both exported by
// react-native-svg specifically for this) turns every render into just
// walking an already-built tree, no re-parsing.
const frameAst = parse(discoverPostFireFrameSvg);

// Live-rendered (not a static Image) so the source SVG's own <filter> glow
// (feGaussianBlur/feColorMatrix) actually renders — a rasterized PNG of it
// couldn't. preserveAspectRatio="none" is already baked into the source
// string itself (every post card has a different height, so the frame
// must stretch to match rather than letterbox).
function DiscoverPostFireFrameBase({ width = '100%', height = '100%', style }) {
  return <SvgAst ast={frameAst} override={{ width, height, style }} />;
}

export const DiscoverPostFireFrame = React.memo(DiscoverPostFireFrameBase);

export default DiscoverPostFireFrame;
