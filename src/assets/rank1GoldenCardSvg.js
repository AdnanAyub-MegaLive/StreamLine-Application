// Raw markup for streamline_rank1_golden_card_no_dp.svg — rendered via
// react-native-svg's SvgXml since Metro isn't configured with an SVG
// transformer (every other icon in this app is hand-authored as
// Svg/Path JSX for the same reason; this one came from design as a
// ready-made file instead, so it's kept as XML rather than hand-copied
// into path elements). "no_dp" — the circular avatar slot in the middle
// is intentionally left empty for a real profile photo to sit over it.
//
// The original 0 0 600 700 viewBox includes a lot of transparent margin
// around the card (the ambient glow ellipse bleeds to the canvas edges)
// — rendered at that viewBox the actual gold card reads tiny and
// floating in the middle of its box. Cropped tighter to the card+crown
// +platform's real bounds (RANK1_CROP below) so it fills its column the
// same way the plain rank 2/3 cards fill theirs.
export const RANK1_CROP = { x: 72, y: 15, width: 456, height: 661 };
export const RANK1_GOLDEN_CARD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700" viewBox="${RANK1_CROP.x} ${RANK1_CROP.y} ${RANK1_CROP.width} ${RANK1_CROP.height}" fill="none">
  <defs>
    <linearGradient id="gold" x1="90" y1="80" x2="510" y2="620" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF3A0"/>
      <stop offset="0.28" stop-color="#FFD84A"/>
      <stop offset="0.62" stop-color="#FFB800"/>
      <stop offset="1" stop-color="#8F5600"/>
    </linearGradient>

    <linearGradient id="goldBright" x1="180" y1="90" x2="430" y2="470" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF7B8"/>
      <stop offset="0.45" stop-color="#FFD84A"/>
      <stop offset="1" stop-color="#FFAA00"/>
    </linearGradient>

    <linearGradient id="card" x1="100" y1="120" x2="500" y2="570" gradientUnits="userSpaceOnUse">
      <stop stop-color="#211A0C" stop-opacity=".94"/>
      <stop offset=".5" stop-color="#090909" stop-opacity=".97"/>
      <stop offset="1" stop-color="#1A1308" stop-opacity=".94"/>
    </linearGradient>

    <radialGradient id="avatarBg" cx="50%" cy="42%" r="62%">
      <stop stop-color="#241D0D"/>
      <stop offset=".7" stop-color="#0A0907"/>
      <stop offset="1" stop-color="#050505"/>
    </radialGradient>

    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop stop-color="#FFD84A" stop-opacity=".34"/>
      <stop offset=".55" stop-color="#FFB000" stop-opacity=".10"/>
      <stop offset="1" stop-color="#FFB000" stop-opacity="0"/>
    </radialGradient>

    <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="9" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <filter id="smallGlow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="3.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <clipPath id="cardClip">
      <rect x="92" y="118" width="416" height="450" rx="30"/>
    </clipPath>
  </defs>

  <ellipse cx="300" cy="355" rx="270" ry="300" fill="url(#glow)"/>

  <g filter="url(#softGlow)">
    <path d="M214 109 L230 54 L270 86 L300 32 L330 86 L370 54 L386 109 Z"
          fill="url(#goldBright)" stroke="#FFD84A" stroke-width="4" stroke-linejoin="round"/>
    <path d="M208 109 H392 L382 126 H218 Z"
          fill="url(#gold)" stroke="#FFD84A" stroke-width="3"/>
    <circle cx="230" cy="54" r="5" fill="#FFF6B0"/>
    <circle cx="300" cy="32" r="6" fill="#FFF6B0"/>
    <circle cx="370" cy="54" r="5" fill="#FFF6B0"/>
  </g>

  <rect x="92" y="118" width="416" height="450" rx="30"
        fill="url(#card)" stroke="url(#gold)" stroke-width="3"/>

  <rect x="98" y="124" width="404" height="438" rx="26"
        stroke="#FFD84A" stroke-opacity=".18" stroke-width="1"/>

  <g clip-path="url(#cardClip)" fill="#FFD84A">
    <circle cx="132" cy="180" r="2" opacity=".55"/>
    <circle cx="470" cy="210" r="2" opacity=".35"/>
    <circle cx="160" cy="470" r="1.7" opacity=".4"/>
    <circle cx="445" cy="500" r="2" opacity=".3"/>
    <circle cx="122" cy="390" r="1.5" opacity=".3"/>
    <circle cx="475" cy="350" r="1.5" opacity=".45"/>
  </g>

  <g filter="url(#smallGlow)">
    <circle cx="142" cy="166" r="28" fill="#0B0A08" stroke="url(#gold)" stroke-width="3"/>
    <text x="142" y="176" text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif" font-size="30"
          font-weight="700" fill="#FFE36A">1</text>
  </g>

  <circle cx="300" cy="292" r="105" fill="url(#avatarBg)"
          stroke="#6C4700" stroke-width="5"/>
  <circle cx="300" cy="292" r="100"
          stroke="url(#goldBright)" stroke-width="4"
          filter="url(#smallGlow)"/>
  <circle cx="300" cy="292" r="91"
          stroke="#FFD84A" stroke-opacity=".18" stroke-width="1"/>

  <circle cx="300" cy="292" r="86" fill="#050505" fill-opacity=".28"/>

  <g transform="translate(226 452)" filter="url(#smallGlow)">
    <path d="M0 10 L12 0 L28 3 L34 15 L22 29 L7 25 Z"
          fill="url(#goldBright)" stroke="#FFE477" stroke-width="2"/>
    <path d="M12 0 L17 13 L28 3 M17 13 L22 29 M17 13 L7 25"
          stroke="#FFF0A0" stroke-width="1.5" opacity=".8"/>
  </g>

  <g filter="url(#softGlow)">
    <ellipse cx="300" cy="610" rx="190" ry="32"
             fill="#2A1A00" stroke="#FFB800" stroke-width="3"/>
    <path d="M125 607 C135 650 180 668 300 668 C420 668 465 650 475 607
             C455 628 410 640 300 640 C190 640 145 628 125 607Z"
          fill="#120D05" stroke="url(#gold)" stroke-width="3"/>
    <ellipse cx="300" cy="607" rx="155" ry="22"
             fill="#0A0907" stroke="#FFD84A" stroke-width="3"/>
    <ellipse cx="300" cy="606" rx="130" ry="14"
             fill="#211705" stroke="#8F5A00" stroke-width="2"/>
  </g>
</svg>`;

export default RANK1_GOLDEN_CARD_SVG;
