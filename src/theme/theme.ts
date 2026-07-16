export const colors = {
  teal50: '#E1F5EE',
  teal100: '#9FE1CB',
  teal200: '#5DCAA5',
  teal400: '#1D9E75',
  teal600: '#0F6E56',
  teal700: '#0B8A7A',
  teal800: '#085041',
  teal900: '#04342C',
  tealDarkBg: '#0A3937',

  pageBackground: '#F8FBFA',
  cardBackground: '#FFFFFF',
  cardBorder: '#D9E8F5',
  textPrimary: '#0A3937',
  textSecondary: '#5F7F7A',
  mutedIcon: '#7A8C89',
  onboardingStepMuted: '#D1DCE8',
  onboardingAvatarRangerBackground: '#FFF7E8',
  onboardingAvatarHeroBackground: '#E7F6F4',
  onboardingAvatarNovaBackground: '#F1ECFF',
  onboardingAvatarMoreBackground: '#F6F0DE',

  liveBadge: '#E24B4A',
  giftAccent: '#D4537E',
  vipPurple: '#7C4DFF',
  facebookBlue: '#1877F2',
} as const;

export const theme = {
  colors,
  cta: {
    primary: {
      background: colors.teal700,
      text: '#FFFFFF',
      border: colors.teal700,
    },
    secondary: {
      background: '#FFFFFF',
      text: colors.teal700,
      border: colors.teal700,
    },
    outline: {
      background: 'transparent',
      text: colors.teal700,
      border: colors.teal700,
    },
  },
  surfaces: {
    page: colors.pageBackground,
    card: colors.cardBackground,
    dark: colors.tealDarkBg,
    darkSecondary: '#0B4E49',
  },
  text: {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    mutedIcon: colors.mutedIcon,
  },
  onboarding: {
    stepIndicator: {
      mutedDot: colors.onboardingStepMuted,
      activePill: colors.teal700,
    },
    backButton: {
      background: colors.cardBackground,
      border: colors.cardBorder,
      text: colors.textPrimary,
    },
    avatarStyles: {
      ranger: {
        accent: colors.giftAccent,
        background: colors.onboardingAvatarRangerBackground,
      },
      hero: {
        accent: colors.teal700,
        background: colors.onboardingAvatarHeroBackground,
      },
      nova: {
        accent: colors.vipPurple,
        background: colors.onboardingAvatarNovaBackground,
      },
      more: {
        accent: colors.giftAccent,
        background: colors.onboardingAvatarMoreBackground,
      },
    },
    deviceAvatar: {
      border: colors.cardBorder,
      placeholder: colors.cardBackground,
      addBadge: colors.teal700,
    },
    gender: {
      activeBackground: colors.teal700,
      activeBorder: colors.teal700,
      inactiveBorder: colors.cardBorder,
    },
  },
  state: {
    active: colors.teal700,
    hovered: colors.teal800,
    pressed: colors.teal800,
    soft: colors.teal50,
  },
} as const;

export type Theme = typeof theme;