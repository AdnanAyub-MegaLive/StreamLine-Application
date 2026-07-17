export const routes = {
  splash: 'Splash',
  home: 'Home',
  auth: 'Auth',
  phoneAuth: 'PhoneAuth',
  signupDetails: 'SignupDetails',
  onboarding: 'Onboarding',
  terms: 'TermsAndConditions',
  room: 'Room',
  profile: 'Profile',
  banned: 'Banned',
  settings: 'Settings',
  editProfile: 'EditProfile',
} as const;

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Auth: undefined;
  PhoneAuth: { phone?: string } | undefined;
  SignupDetails: { phone: string };
  Onboarding: undefined;
  TermsAndConditions: undefined;
  Room: { roomId?: string } | undefined;
  Profile: undefined;
  Banned: undefined;
  Settings: undefined;
  EditProfile: undefined;
};
