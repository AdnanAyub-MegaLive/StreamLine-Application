export const appEnv = {
  authEmail: 'demo@streamline.app',
  authPhone: '9876543210',
  authPassword: 'Abc@1234',
  // When true, even a recognized ("existing") demo user is routed through
  // SignupDetails + Onboarding instead of jumping straight to Home, so every
  // screen in the auth flow can be visualized while testing.
  demoVisualizeFullFlow: true,
  // LAN address of whoever is currently running the StreamLine-Portal backend
  // (Next.js dev server). This changes machine-to-machine — update it to
  // match the host running `npm run dev` there. Physical devices must be on
  // the same Wi-Fi network as that machine to reach it.
  apiBaseUrl: 'http://192.168.88.13:3000',
} as const;

export default appEnv;
