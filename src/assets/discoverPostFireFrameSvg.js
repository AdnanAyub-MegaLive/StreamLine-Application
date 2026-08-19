
export const discoverPostFireFrameSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1049" height="1449" viewBox="0 0 1049 1449" preserveAspectRatio="none" fill="none">
  <defs>
    <linearGradient id="neonLoop" x1="28" y1="15" x2="1022" y2="1434" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FF28D7"/>
      <stop offset="0.13" stop-color="#8B35FF"/>
      <stop offset="0.25" stop-color="#00EFFF"/>
      <stop offset="0.39" stop-color="#296BFF"/>
      <stop offset="0.52" stop-color="#FF17D2"/>
      <stop offset="0.65" stop-color="#8C2DFF"/>
      <stop offset="0.78" stop-color="#00EFFF"/>
      <stop offset="0.9" stop-color="#FF3AC8"/>
      <stop offset="1" stop-color="#6A2DFF"/>
    </linearGradient>

    <linearGradient id="hotLoop" x1="1015" y1="30" x2="20" y2="1415" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FF46DD"/>
      <stop offset="0.2" stop-color="#FF008C"/>
      <stop offset="0.43" stop-color="#7950FF"/>
      <stop offset="0.62" stop-color="#00D9FF"/>
      <stop offset="0.81" stop-color="#FF4DCE"/>
      <stop offset="1" stop-color="#FF8A35"/>
    </linearGradient>

    <linearGradient id="coolLoop" x1="32" y1="1415" x2="1017" y2="25" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#00F5FF"/>
      <stop offset="0.19" stop-color="#176BFF"/>
      <stop offset="0.38" stop-color="#00EFFF"/>
      <stop offset="0.57" stop-color="#7E39FF"/>
      <stop offset="0.77" stop-color="#00C8FF"/>
      <stop offset="1" stop-color="#F62EFF"/>
    </linearGradient>

    <filter id="outerGlow" x="-25%" y="-20%" width="150%" height="140%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="11" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0.34  0 0.35 0 0 0.02  0 0 1 0 0.45  0 0 0 0.88 0" result="tinted"/>
      <feMerge><feMergeNode in="tinted"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    <filter id="softGlow" x="-70%" y="-70%" width="240%" height="240%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    <filter id="starGlow" x="-350%" y="-350%" width="700%" height="700%">
      <feGaussianBlur stdDeviation="3.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    <path id="framePath" d="M72 28 H977 Q1021 28 1021 72 V1377 Q1021 1421 977 1421 H72 Q28 1421 28 1377 V72 Q28 28 72 28 Z"/>
    <clipPath id="edgeClip">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M0 0H1049V1449H0V0ZM58 48Q48 48 48 58V1391Q48 1401 58 1401H991Q1001 1401 1001 1391V58Q1001 48 991 48H58Z"/>
    </clipPath>
  </defs>

  <g clip-path="url(#edgeClip)" opacity="0.74">
    <use href="#framePath" stroke="url(#neonLoop)" stroke-width="42" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <g filter="url(#outerGlow)">
    <use href="#framePath" stroke="#7D24FF" stroke-opacity="0.5" stroke-width="26" stroke-linejoin="round"/>
    <use href="#framePath" stroke="url(#hotLoop)" stroke-width="13" stroke-linejoin="round"/>
    <use href="#framePath" stroke="url(#coolLoop)" stroke-width="6" stroke-linejoin="round"/>
    <use href="#framePath" stroke="#FFFFFF" stroke-opacity="0.72" stroke-width="1.8" stroke-linejoin="round"/>
  </g>

  <g stroke-linecap="round" stroke-linejoin="round" filter="url(#softGlow)">
    <path d="M49 81C56 52 79 43 111 45C149 47 177 24 213 34C248 43 272 21 309 30C345 39 364 28 394 35C431 44 455 20 492 29C531 39 551 25 588 34C625 42 646 27 687 34C726 41 751 25 793 32C833 39 855 22 893 32C935 43 975 29 1000 55" stroke="#FF2BD6" stroke-width="8" opacity="0.92"/>
    <path d="M54 68C101 50 122 68 159 48C191 31 221 61 253 44C287 26 312 58 347 40C380 24 410 55 445 39C478 24 504 53 539 39C574 24 603 55 639 39C675 23 707 53 742 38C780 22 808 52 847 37C885 23 927 49 993 45" stroke="#20E7FF" stroke-width="5" opacity="0.95"/>
    <path d="M50 139C35 180 53 218 39 254C26 288 49 318 37 354C25 390 50 418 38 455C25 495 50 524 37 563C25 602 52 630 38 670C23 710 51 741 38 779C24 819 50 849 37 888C23 927 51 957 38 997C25 1034 50 1068 37 1106C24 1147 52 1176 38 1217C25 1257 50 1292 38 1330C31 1354 35 1375 50 1398" stroke="#FF29C8" stroke-width="9" opacity="0.94"/>
    <path d="M61 122C43 161 65 199 51 237C39 271 62 303 50 339C37 377 63 408 49 447C36 486 64 516 50 555C37 595 65 627 50 666C36 706 65 738 50 778C35 819 64 851 50 891C36 932 64 965 50 1005C36 1046 65 1078 50 1119C35 1160 64 1195 51 1235C39 1273 61 1311 51 1343" stroke="#00EAFF" stroke-width="5" opacity="0.95"/>
    <path d="M999 105C1014 144 992 180 1007 218C1021 254 994 285 1008 323C1022 362 994 391 1009 430C1023 469 995 500 1009 539C1024 578 995 609 1010 648C1025 688 996 720 1010 759C1024 800 996 831 1010 872C1025 913 996 946 1010 987C1024 1027 997 1060 1010 1101C1024 1142 996 1175 1010 1215C1022 1254 999 1292 1010 1332" stroke="#8435FF" stroke-width="9" opacity="0.94"/>
    <path d="M990 120C1008 160 986 196 1000 234C1013 270 989 302 1001 340C1014 379 988 409 1002 448C1016 487 988 518 1002 557C1016 596 988 628 1003 667C1017 706 989 739 1003 779C1018 819 989 851 1003 891C1018 932 989 965 1003 1005C1017 1046 989 1078 1003 1119C1018 1161 989 1195 1001 1236C989 1274 1011 1311 999 1348" stroke="#00E5FF" stroke-width="5" opacity="0.95"/>
    <path d="M58 1400C98 1386 129 1410 167 1394C203 1378 231 1407 267 1391C302 1377 333 1406 370 1390C405 1375 437 1405 473 1389C510 1373 541 1405 578 1389C616 1373 646 1405 684 1389C723 1372 751 1404 789 1388C830 1371 855 1403 895 1387C931 1374 966 1395 997 1380" stroke="#FF2ACD" stroke-width="9" opacity="0.95"/>
    <path d="M64 1410C104 1394 132 1420 170 1402C207 1385 236 1417 273 1399C308 1382 340 1415 376 1398C412 1381 445 1413 480 1397C517 1380 550 1413 587 1396C625 1379 654 1412 693 1395C730 1378 759 1411 797 1394C836 1377 866 1407 905 1391C939 1377 967 1394 989 1379" stroke="#08E8FF" stroke-width="5" opacity="0.95"/>
  </g>

  <g fill="none" stroke-linecap="round" filter="url(#softGlow)">
    <path d="M82 48C100 29 111 51 130 31C145 16 154 34 168 22" stroke="#FFF5FF" stroke-width="3"/>
    <path d="M254 38C270 20 283 47 300 24C313 7 322 29 337 17" stroke="#00F4FF" stroke-width="4"/>
    <path d="M605 38C624 18 634 48 653 26C667 10 677 34 692 19" stroke="#FF4BDD" stroke-width="4"/>
    <path d="M907 39C926 18 939 47 956 26C970 9 982 34 996 23" stroke="#00EBFF" stroke-width="4"/>
    <path d="M39 284C19 307 49 322 26 344C10 360 32 372 20 389" stroke="#FF42D9" stroke-width="4"/>
    <path d="M39 697C17 719 49 738 25 760C10 775 33 790 18 807" stroke="#00EFFF" stroke-width="4"/>
    <path d="M38 1124C18 1146 48 1162 25 1185C10 1201 32 1214 19 1230" stroke="#FF37D3" stroke-width="4"/>
    <path d="M1010 367C1030 389 999 406 1023 428C1038 443 1016 457 1030 474" stroke="#00EAFF" stroke-width="4"/>
    <path d="M1010 803C1031 824 1000 842 1024 864C1039 879 1017 894 1030 910" stroke="#FF3DDB" stroke-width="4"/>
    <path d="M1010 1220C1031 1243 999 1259 1024 1282C1039 1297 1016 1312 1030 1329" stroke="#00EAFF" stroke-width="4"/>
    <path d="M178 1405C196 1427 210 1395 229 1419C242 1436 255 1410 272 1426" stroke="#00F3FF" stroke-width="4"/>
    <path d="M483 1405C501 1428 516 1397 535 1420C548 1437 562 1410 579 1427" stroke="#FF40D7" stroke-width="4"/>
    <path d="M815 1404C833 1427 848 1395 867 1419C881 1435 894 1410 911 1425" stroke="#00EFFF" stroke-width="4"/>
  </g>

  <g fill="#FFFFFF" stroke-linecap="round" filter="url(#starGlow)">
    <g transform="translate(83 53)"><path d="M0-14V14M-14 0H14" stroke="#FFFFFF" stroke-width="2.5"/><circle r="3.5"/></g>
    <g transform="translate(625 26)"><path d="M0-10V10M-10 0H10" stroke="#FF6EE6" stroke-width="2"/><circle r="2.8"/></g>
    <g transform="translate(974 79)"><path d="M0-12V12M-12 0H12" stroke="#00ECFF" stroke-width="2.2"/><circle r="3"/></g>
    <g transform="translate(31 258)"><path d="M0-13V13M-13 0H13" stroke="#FF70E4" stroke-width="2.3"/><circle r="3"/></g>
    <g transform="translate(1017 499)"><path d="M0-11V11M-11 0H11" stroke="#FFFFFF" stroke-width="2"/><circle r="3"/></g>
    <g transform="translate(27 837)"><path d="M0-10V10M-10 0H10" stroke="#00F2FF" stroke-width="2"/><circle r="2.8"/></g>
    <g transform="translate(1021 1057)"><path d="M0-12V12M-12 0H12" stroke="#FF5BDD" stroke-width="2.2"/><circle r="3"/></g>
    <g transform="translate(34 1337)"><path d="M0-18V18M-18 0H18M-12-12L12 12M12-12L-12 12" stroke="#FFF2AE" stroke-width="2.5"/><circle r="4"/></g>
    <g transform="translate(188 1414)"><path d="M0-11V11M-11 0H11" stroke="#00EDFF" stroke-width="2"/><circle r="3"/></g>
    <g transform="translate(848 1410)"><path d="M0-12V12M-12 0H12" stroke="#FF61DF" stroke-width="2"/><circle r="3"/></g>
  </g>

  <g filter="url(#starGlow)">
    <circle cx="148" cy="24" r="3.3" fill="#00EFFF"/><circle cx="372" cy="27" r="2.5" fill="#FF48D9"/>
    <circle cx="763" cy="25" r="3" fill="#B76BFF"/><circle cx="1018" cy="177" r="3.2" fill="#FF32D2"/>
    <circle cx="1022" cy="638" r="2.7" fill="#00EFFF"/><circle cx="1020" cy="1168" r="3" fill="#C65CFF"/>
    <circle cx="927" cy="1420" r="3.2" fill="#00ECFF"/><circle cx="690" cy="1422" r="2.6" fill="#FF4BD9"/>
    <circle cx="420" cy="1421" r="3" fill="#8D5CFF"/><circle cx="30" cy="1246" r="3" fill="#00EBFF"/>
    <circle cx="27" cy="571" r="2.8" fill="#FF35D0"/><circle cx="30" cy="187" r="3.2" fill="#7D61FF"/>
  </g>
</svg>`;

export default discoverPostFireFrameSvg;
