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
} as const;

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Auth: undefined;
  PhoneAuth: undefined;
  SignupDetails: { phone: string };
  Onboarding: undefined;
  TermsAndConditions: undefined;
  Room: { roomId?: string } | undefined;
  Profile: undefined;
};
