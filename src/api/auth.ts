import type { AuthSession, AuthUser, LoginInput, SignupInput } from '@/types';
import { appEnv } from '@/config/env';

type TempAuthConfig = {
  email: string;
  phone: string;
  password: string;
};

const TEMP_AUTH_CONFIG: TempAuthConfig = {
  email: appEnv.authEmail,
  phone: appEnv.authPhone,
  password: appEnv.authPassword,
};

const TEMP_DELAY = 600;

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

function buildToken(prefix: string, identifier: string) {
  return `${prefix}-${identifier}-${Date.now()}`;
}

function buildUserFromLogin(identifier: string, method: 'email' | 'phone'): AuthUser {
  return {
    fullName: 'Streamline User',
    email: method === 'email' ? normalizeIdentifier(identifier) : TEMP_AUTH_CONFIG.email,
    phone: method === 'phone' ? identifier.replace(/\D/g, '') : TEMP_AUTH_CONFIG.phone,
    dob: '2000-01-01',
    method,
  };
}

function delay() {
  return new Promise<void>(resolve => setTimeout(resolve, TEMP_DELAY));
}

export async function loginWithCredentials({ identifier, password }: LoginInput): Promise<AuthSession> {
  await delay();

  const cleanedIdentifier = identifier.trim();
  const cleanedPassword = password.trim();
  const isEmailMatch = normalizeIdentifier(cleanedIdentifier) === TEMP_AUTH_CONFIG.email;
  const isPhoneMatch = cleanedIdentifier.replace(/\D/g, '') === TEMP_AUTH_CONFIG.phone;
  const isPasswordMatch = cleanedPassword === TEMP_AUTH_CONFIG.password;

  if (!isPasswordMatch || (!isEmailMatch && !isPhoneMatch)) {
    throw new Error('Invalid email/phone number or password.');
  }

  const method = isEmailMatch ? 'email' : 'phone';
  const user = buildUserFromLogin(cleanedIdentifier, method);

  return {
    token: buildToken('login', normalizeIdentifier(cleanedIdentifier)),
    user,
    onboardingComplete: false,
  };
}

export async function signUpWithCredentials(input: SignupInput): Promise<AuthSession> {
  await delay();

  const identifier = input.email.trim().length > 0 ? normalizeIdentifier(input.email) : input.phone.replace(/\D/g, '');

  if (input.password.trim() !== input.confirmPassword.trim()) {
    throw new Error('Passwords do not match.');
  }

  const user: AuthUser = {
    fullName: input.fullName.trim(),
    email: normalizeIdentifier(input.email),
    phone: input.phone.replace(/\D/g, ''),
    dob: input.dob.trim(),
    method: input.email.trim().length > 0 ? 'email' : 'phone',
  };

  return {
    token: buildToken('signup', identifier),
    user,
    onboardingComplete: false,
  };
}

export { TEMP_AUTH_CONFIG };
