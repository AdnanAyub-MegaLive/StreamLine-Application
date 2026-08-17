import {
  STREAMLINE_API_BASE_URL,
  STREAMLINE_AUTH_EMAIL,
  STREAMLINE_AUTH_PASSWORD,
  STREAMLINE_AUTH_PHONE,
  STREAMLINE_DEMO_VISUALIZE_FULL_FLOW
} from '@env';

export const appEnv = {
  authEmail: STREAMLINE_AUTH_EMAIL,
  authPhone: STREAMLINE_AUTH_PHONE,
  authPassword: STREAMLINE_AUTH_PASSWORD,
  demoVisualizeFullFlow: STREAMLINE_DEMO_VISUALIZE_FULL_FLOW !== 'false',
  apiBaseUrl: STREAMLINE_API_BASE_URL ?? (() => {
    throw new Error('STREAMLINE_API_BASE_URL is not set — check .env and restart Metro with --reset-cache.');
  })()
};

export default appEnv;
