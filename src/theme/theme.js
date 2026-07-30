// "Neon Pulse" theme — Primary #FF007F, Secondary #00F2FF, Tertiary
// #7000FF, Neutral #0F0F12. Every screen in this app already pulls colors
// from this file (never hardcodes hex directly), so the whole rebrand
// happens here: token *names* are unchanged (teal50..teal900 etc.) to
// avoid touching every consuming screen, but every *value* now belongs to
// the new dark, magenta/cyan/purple palette instead of the old light teal
// one. teal700 remains the "main brand color" slot — it's now #FF007F
// (Primary) instead of teal, exactly matching how it was already used
// everywhere (primary buttons, active tab, links, accents).
export const colors = {
  // Primary (magenta) ramp — replaces the old teal ramp, same slots.
  teal50: '#3A0A22',
  teal100: '#FF99C7',
  teal200: '#FF4DA3',
  teal400: '#FF1A8C',
  teal600: '#E60074',
  teal700: '#FF007F',
  teal800: '#CC0069',
  teal900: '#99004F',
  tealDarkBg: '#0F0F12',
  // Secondary (cyan) and Tertiary (purple) — new to this palette, not
  // present in the old teal-only one.
  secondary: '#00F2FF',
  secondaryMuted: '#00C2CC',
  secondarySoft: '#062426',
  tertiary: '#7000FF',
  tertiaryMuted: '#5900CC',
  tertiarySoft: '#180B2E',
  // Neutral ramp (dark UI) — page/card surfaces, borders, text.
  neutral900: '#0F0F12',
  neutral800: '#18181C',
  neutral700: '#232328',
  neutral600: '#38383F',
  neutral500: '#57575F',
  neutral400: '#8B8B94',
  neutral200: '#C4C4CB',
  neutral100: '#DEDEE2',
  neutral50: '#F5F5F7',
  pageBackground: '#0F0F12',
  cardBackground: '#18181C',
  cardBorder: '#28282E',
  textPrimary: '#F5F5F7',
  textSecondary: '#9C9CA6',
  mutedIcon: '#6E6E77',
  onboardingStepMuted: '#3A3A42',
  onboardingAvatarRangerBackground: '#2A1620',
  onboardingAvatarHeroBackground: '#180B2E',
  onboardingAvatarNovaBackground: '#062426',
  onboardingAvatarMoreBackground: '#241318',
  liveBadge: '#E24B4A',
  giftAccent: '#FF4DA3',
  vipPurple: '#9D5CFF',
  facebookBlue: '#3AA0FF',
  vipGoldBackground: '#2E2312',
  vipGoldText: '#F0B93D',
  followOrange: '#F5A623',
  proGamerBackground: '#180B2E'
};
export const theme = {
  colors,
  cta: {
    primary: {
      background: colors.teal700,
      text: '#FFFFFF',
      border: colors.teal700
    },
    secondary: {
      background: colors.cardBackground,
      text: colors.teal700,
      border: colors.teal700
    },
    outline: {
      background: 'transparent',
      text: colors.teal700,
      border: colors.teal700
    }
  },
  surfaces: {
    page: colors.pageBackground,
    card: colors.cardBackground,
    dark: colors.tealDarkBg,
    darkSecondary: colors.neutral700
  },
  text: {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    mutedIcon: colors.mutedIcon
  },
  onboarding: {
    stepIndicator: {
      mutedDot: colors.onboardingStepMuted,
      activePill: colors.teal700
    },
    backButton: {
      background: colors.cardBackground,
      border: colors.cardBorder,
      text: colors.textPrimary
    },
    avatarStyles: {
      ranger: {
        accent: colors.giftAccent,
        background: colors.onboardingAvatarRangerBackground
      },
      hero: {
        accent: colors.teal700,
        background: colors.onboardingAvatarHeroBackground
      },
      nova: {
        accent: colors.vipPurple,
        background: colors.onboardingAvatarNovaBackground
      },
      star: {
        accent: colors.facebookBlue,
        background: colors.onboardingAvatarMoreBackground
      },
      wizard: {
        accent: colors.teal400,
        background: colors.onboardingAvatarRangerBackground
      },
      ninja: {
        accent: colors.teal900,
        background: colors.onboardingAvatarHeroBackground
      },
      robot: {
        accent: colors.teal600,
        background: colors.onboardingAvatarNovaBackground
      },
      explorer: {
        accent: colors.giftAccent,
        background: colors.onboardingAvatarMoreBackground
      }
    },
    deviceAvatar: {
      border: colors.cardBorder,
      placeholder: colors.cardBackground,
      addBadge: colors.teal700
    },
    gender: {
      activeBackground: colors.teal700,
      activeBorder: colors.teal700,
      inactiveBorder: colors.cardBorder
    }
  },
  state: {
    active: colors.teal700,
    hovered: colors.teal800,
    pressed: colors.teal800,
    soft: colors.teal50
  }
};
