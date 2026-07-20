import {
  STREAMLINE_API_BASE_URL,
  STREAMLINE_AUTH_EMAIL,
  STREAMLINE_AUTH_PASSWORD,
  STREAMLINE_AUTH_PHONE,
  STREAMLINE_DEMO_VISUALIZE_FULL_FLOW
} from '@env';

export const appEnv = {
  authEmail: STREAMLINE_AUTH_EMAIL || 'demo@streamline.app',
  authPhone: STREAMLINE_AUTH_PHONE || '9876543210',
  authPassword: STREAMLINE_AUTH_PASSWORD || 'Abc@1234',
  // When true, even a recognized ("existing") demo user is routed through
  // SignupDetails + Onboarding instead of jumping straight to Home, so every
  // screen in the auth flow can be visualized while testing.
  demoVisualizeFullFlow: STREAMLINE_DEMO_VISUALIZE_FULL_FLOW !== 'false',
  // LAN address of whoever is currently running the StreamLine-Portal backend
  // (Next.js dev server). This changes machine-to-machine — update it in
  // .env to match the host running `npm run dev` there. Physical devices
  // must be on the same Wi-Fi network as that machine to reach it.
  apiBaseUrl: STREAMLINE_API_BASE_URL || 'http://192.168.88.13:3000'
};

export default appEnv;
