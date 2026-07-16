export const appEnv = {
  authEmail: 'demo@streamline.app',
  authPhone: '9876543210',
  authPassword: 'Abc@1234',
  // When true, even a recognized ("existing") demo user is routed through
  // SignupDetails + Onboarding instead of jumping straight to Home, so every
  // screen in the auth flow can be visualized while testing.
  demoVisualizeFullFlow: true,
} as const;

export default appEnv;
