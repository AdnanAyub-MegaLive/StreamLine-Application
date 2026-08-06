// Raw markup for streamline_rank3_card_no_dp.svg — see rank2CardSvg.js /
// rank1GoldenCardSvg.js for why this stays as XML rendered via SvgXml.
export const RANK3_CROP = { x: 72, y: 100, width: 456, height: 576 };
export const RANK3_CARD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700" viewBox="${RANK3_CROP.x} ${RANK3_CROP.y} ${RANK3_CROP.width} ${RANK3_CROP.height}" fill="none">
<defs>
  <linearGradient id="metal" x1="90" y1="90" x2="510" y2="620" gradientUnits="userSpaceOnUse">
    <stop stop-color="#FFB05A"/>
    <stop offset=".35" stop-color="#FF5A24"/>
    <stop offset=".7" stop-color="#7A42B8"/>
    <stop offset="1" stop-color="#261044"/>
  </linearGradient>
  <linearGradient id="bright" x1="180" y1="100" x2="430" y2="500" gradientUnits="userSpaceOnUse">
    <stop stop-color="#FFFFFF"/>
    <stop offset=".25" stop-color="#FFB05A"/>
    <stop offset=".65" stop-color="#FF5A24"/>
    <stop offset="1" stop-color="#7A42B8"/>
  </linearGradient>
  <linearGradient id="card" x1="100" y1="120" x2="500" y2="570" gradientUnits="userSpaceOnUse">
    <stop stop-color="#171126" stop-opacity=".97"/>
    <stop offset=".55" stop-color="#08080F" stop-opacity=".98"/>
    <stop offset="1" stop-color="#140C20" stop-opacity=".97"/>
  </linearGradient>
  <radialGradient id="glow">
    <stop stop-color="#FF5A24" stop-opacity=".25"/>
    <stop offset="1" stop-color="#FF5A24" stop-opacity="0"/>
  </radialGradient>
  <filter id="glowFx" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="8" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="smallGlow" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="3" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>

<ellipse cx="300" cy="355" rx="270" ry="300" fill="url(#glow)"/>

<rect x="92" y="118" width="416" height="450" rx="30" fill="url(#card)" stroke="url(#metal)" stroke-width="3"/>
<rect x="98" y="124" width="404" height="438" rx="26" stroke="#FFB05A" stroke-opacity=".16"/>

<g filter="url(#smallGlow)">
  <circle cx="142" cy="166" r="28" fill="#09080F" stroke="url(#metal)" stroke-width="3"/>
  <text x="142" y="176" text-anchor="middle" font-family="Arial,Helvetica,sans-serif"
        font-size="30" font-weight="700" fill="#FFB05A">3</text>
</g>

<circle cx="300" cy="292" r="105" fill="#07070C" stroke="#FF5A24" stroke-opacity=".45" stroke-width="5"/>
<circle cx="300" cy="292" r="100" stroke="url(#bright)" stroke-width="4" filter="url(#smallGlow)"/>
<circle cx="300" cy="292" r="91" stroke="#FFB05A" stroke-opacity=".18"/>
<circle cx="300" cy="292" r="86" fill="#05050A" fill-opacity=".25"/>

<g fill="#FFB05A">
  <circle cx="132" cy="180" r="2" opacity=".5"/>
  <circle cx="470" cy="210" r="2" opacity=".35"/>
  <circle cx="160" cy="470" r="1.7" opacity=".4"/>
  <circle cx="445" cy="500" r="2" opacity=".3"/>
  <circle cx="122" cy="390" r="1.5" opacity=".3"/>
  <circle cx="475" cy="350" r="1.5" opacity=".45"/>
</g>

<g transform="translate(226 452)" filter="url(#smallGlow)">
  <path d="M0 10 L12 0 L28 3 L34 15 L22 29 L7 25 Z"
        fill="url(#bright)" stroke="#FFB05A" stroke-width="2"/>
  <path d="M12 0 L17 13 L28 3 M17 13 L22 29 M17 13 L7 25"
        stroke="#FFFFFF" stroke-width="1.5" opacity=".65"/>
</g>

<g filter="url(#glowFx)">
  <ellipse cx="300" cy="610" rx="190" ry="32" fill="#120B20" stroke="url(#metal)" stroke-width="3"/>
  <path d="M125 607 C135 650 180 668 300 668 C420 668 465 650 475 607
           C455 628 410 640 300 640 C190 640 145 628 125 607Z"
        fill="#09070F" stroke="url(#metal)" stroke-width="3"/>
  <ellipse cx="300" cy="607" rx="155" ry="22" fill="#09080F" stroke="#FFB05A" stroke-width="3"/>
  <ellipse cx="300" cy="606" rx="130" ry="14" fill="#171021" stroke="#FF5A24" stroke-opacity=".6" stroke-width="2"/>
</g>
</svg>`;

export default RANK3_CARD_SVG;
