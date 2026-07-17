import axios from 'axios';
import { Platform } from 'react-native';
import type {
  AuthSession,
  AuthUser,
  LoginUserApiError,
  LoginUserApiResponse,
  LoginUserInput,
  RegisterUserApiError,
  RegisterUserApiResponse,
  RegisterUserInput,
  UpdateProfileApiError,
  UpdateProfileApiResponse,
  UpdateProfileInput,
  UserStatusApiResponse,
} from '@/types';
import { appEnv } from '@/config/env';
import { getStableDeviceId } from '@/utils/deviceId';
import { formatLocationString, getCachedLocation } from '@/utils/location';
import { apiClient } from './client';

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

function buildToken(prefix: string, identifier: string) {
  return `${prefix}-${identifier}-${Date.now()}`;
}

function buildUserFromLogin(identifier: string, method: 'email' | 'phone'): AuthUser {
  return {
    fullName: 'Streamline User',
    email: method === 'email' ? identifier.trim().toLowerCase() : TEMP_AUTH_CONFIG.email,
    phone: method === 'phone' ? identifier.replace(/\D/g, '') : TEMP_AUTH_CONFIG.phone,
    dob: '2000-01-01',
    method,
  };
}

function delay() {
  return new Promise<void>(resolve => setTimeout(resolve, TEMP_DELAY));
}

export class RegisterUserError extends Error {
  code: string;
  fields?: Record<string, string>;

  constructor(message: string, code: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'RegisterUserError';
    this.code = code;
    this.fields = fields;
  }
}

export async function registerUser(input: RegisterUserInput): Promise<AuthSession> {
  const email = input.email?.trim();
  const cachedLocation = getCachedLocation();
  const body = {
    name: input.fullName.trim(),
    phone: input.phone,
    password: input.password,
    email: email && email.length > 0 ? email.toLowerCase() : undefined,
    country: input.country || undefined,
    profileImage: input.profileImage || undefined,
    device: {
      macAddress: getStableDeviceId(),
      platform: Platform.OS === 'ios' ? 'iOS' : 'Android',
      location: cachedLocation ? formatLocationString(cachedLocation) : undefined,
    },
  };

  try {
    const response = await apiClient.post<RegisterUserApiResponse>('/api/users/register', body);
    const { user, sessionToken } = response.data.data;

    const authUser: AuthUser = {
      fullName: user.name,
      email: user.email ?? undefined,
      phone: user.phone,
      method: 'phone',
      publicId: user.id,
      role: user.role,
      status: user.status,
      vipLevel: user.vipLevel,
      country: user.country ?? undefined,
      profileImage: user.profileImage ?? undefined,
      sessionVersion: user.sessionVersion,
      createdAt: user.createdAt,
    };

    return {
      token: sessionToken,
      user: authUser,
      onboardingComplete: false,
    };
  } catch (error) {
    if (axios.isAxiosError<RegisterUserApiError>(error) && error.response?.data?.error) {
      const { code, message, fields } = error.response.data.error;
      throw new RegisterUserError(message, code, fields);
    }

    throw new RegisterUserError(
      'Unable to reach the server. Check your network and the backend address in src/config/env.ts.',
      'NETWORK_ERROR',
    );
  }
}

export class LoginUserError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'LoginUserError';
    this.code = code;
  }
}

// POST /api/users/login — phone + password only (matches the backend
// team's login route, which looks up by phone alone).
export async function loginWithPassword(input: LoginUserInput): Promise<AuthSession> {
  const cleanedPhone = input.phone.trim().replace(/[\s().-]/g, '');

  try {
    const response = await apiClient.post<LoginUserApiResponse>('/api/users/login', {
      phone: cleanedPhone,
      password: input.password,
    });
    const { data } = response.data;

    if (data.isBanned || !data.user || !data.sessionToken) {
      throw new LoginUserError(
        data.banReason ? `Account banned: ${data.banReason}` : 'This account is banned.',
        'ACCOUNT_BANNED',
      );
    }

    const authUser: AuthUser = {
      fullName: data.user.name,
      email: data.user.email ?? undefined,
      phone: data.user.phone,
      method: 'phone',
      publicId: data.user.id,
      sessionVersion: data.sessionVersion,
    };

    return {
      token: data.sessionToken,
      user: authUser,
      onboardingComplete: false,
    };
  } catch (error) {
    if (error instanceof LoginUserError) {
      throw error;
    }

    if (axios.isAxiosError<LoginUserApiError>(error) && error.response?.data?.error) {
      const { code, message } = error.response.data.error;
      throw new LoginUserError(message, code);
    }

    throw new LoginUserError(
      'Unable to reach the server. Check your network and the backend address in src/config/env.ts.',
      'NETWORK_ERROR',
    );
  }
}

export class UpdateProfileError extends Error {
  code: string;
  fields?: Record<string, string>;

  constructor(message: string, code: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'UpdateProfileError';
    this.code = code;
    this.fields = fields;
  }
}

// PATCH /api/users/profile — self-service edit for name/phone/email/country/
// profileImage. Only fields present on `input` are sent, so a partial update
// leaves the rest untouched.
export async function updateProfile(sessionToken: string, input: UpdateProfileInput): Promise<AuthUser> {
  const body: Record<string, string | null> = {};

  if (input.fullName !== undefined) body.name = input.fullName.trim();
  if (input.phone !== undefined) body.phone = input.phone.trim();
  if (input.email !== undefined) body.email = input.email?.trim().toLowerCase() ?? null;
  if (input.country !== undefined) body.country = input.country?.trim() ?? null;
  if (input.profileImage !== undefined) body.profileImage = input.profileImage ?? null;

  try {
    const response = await apiClient.patch<UpdateProfileApiResponse>('/api/users/profile', body, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    const { user } = response.data.data;

    return {
      fullName: user.name,
      email: user.email ?? undefined,
      phone: user.phone,
      method: 'phone',
      publicId: user.id,
      role: user.role,
      status: user.status,
      vipLevel: user.vipLevel,
      country: user.country ?? undefined,
      profileImage: user.profileImage ?? undefined,
      sessionVersion: user.sessionVersion,
    };
  } catch (error) {
    if (axios.isAxiosError<UpdateProfileApiError>(error) && error.response?.data?.error) {
      const { code, message, fields } = error.response.data.error;
      throw new UpdateProfileError(message, code, fields);
    }

    throw new UpdateProfileError(
      'Unable to reach the server. Check your network and the backend address in src/config/env.ts.',
      'NETWORK_ERROR',
    );
  }
}

export type UserStatus = UserStatusApiResponse['data'];

// Fallback status check for cold start / foreground resume (the socket
// connection in src/services/socket.ts handles live push updates while the
// app is running). Fails silently (returns null) if the token is missing,
// invalid, or the backend is unreachable — callers should treat null as
// "no change, nothing to act on" rather than an error.
export async function checkUserStatus(sessionToken: string): Promise<UserStatus | null> {
  try {
    const response = await apiClient.get<UserStatusApiResponse>('/api/users/session/status', {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });

    return response.data.data;
  } catch {
    return null;
  }
}

const TEMP_OTP = '123456';

export async function verifyPhoneOtp(phone: string, otp: string): Promise<AuthSession | null> {
  await delay();

  const cleanedPhone = phone.replace(/\D/g, '');

  if (!cleanedPhone || otp.trim() !== TEMP_OTP) {
    throw new Error('Use a phone number and OTP 123456 for this temporary flow.');
  }

  const isExistingUser = cleanedPhone === TEMP_AUTH_CONFIG.phone;

  if (!isExistingUser) {
    return null;
  }

  return {
    token: buildToken('phone', cleanedPhone),
    user: buildUserFromLogin(cleanedPhone, 'phone'),
    onboardingComplete: false,
  };
}

export { TEMP_AUTH_CONFIG };
