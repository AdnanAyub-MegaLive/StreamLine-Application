import axios from 'axios';
import { Platform } from 'react-native';
import { appEnv } from '@/config/env';
import { getStableDeviceId } from '@/utils/deviceId';
import { getCurrentLocation, reverseGeocodeLocationLabel } from '@/utils/location';
import { apiClient } from './client';
const TEMP_AUTH_CONFIG = {
  email: appEnv.authEmail,
  phone: appEnv.authPhone,
  password: appEnv.authPassword
};
const TEMP_DELAY = 600;
function buildToken(prefix, identifier) {
  return `${prefix}-${identifier}-${Date.now()}`;
}
function buildUserFromLogin(identifier, method) {
  return {
    fullName: 'Streamline User',
    email: method === 'email' ? identifier.trim().toLowerCase() : TEMP_AUTH_CONFIG.email,
    phone: method === 'phone' ? identifier.replace(/\D/g, '') : TEMP_AUTH_CONFIG.phone,
    dob: '2000-01-01',
    method
  };
}
function delay() {
  return new Promise(resolve => setTimeout(resolve, TEMP_DELAY));
}
export class RegisterUserError extends Error {
  code;
  fields;
  constructor(message, code, fields) {
    super(message);
    this.name = 'RegisterUserError';
    this.code = code;
    this.fields = fields;
  }
}
export async function registerUser(input) {
  const email = input.email?.trim();
  // Same rule as loginWithPassword — require location to actually be on
  // right now (not a stale cached fix from earlier), so sign-up is blocked
  // with the same "Turn On Location" prompt until it is.
  const location = await getCurrentLocation();
  if (!location) {
    throw new RegisterUserError('Unable to determine your location. Please check location permission and try again.', 'LOCATION_UNAVAILABLE');
  }
  // Send a human-readable "City, Country" label (matches the backend's
  // documented example) instead of raw coordinates.
  const locationLabel = await reverseGeocodeLocationLabel(location);
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
      location: locationLabel
    }
  };
  try {
    const response = await apiClient.post('/api/users/register', body);
    const {
      user,
      sessionToken
    } = response.data.data;
    // The backend's `id` can be a cosmetic VIP/SVIP "Special ID" (e.g.
    // "VIP55") instead of the real account key once one is assigned — the
    // permanent key is always `normalId`. Store that as publicId (used for
    // socket rooms, avatar seeds, etc.) and keep the display-only id
    // separately. See docs/mobile-special-id.md.
    const authUser = {
      fullName: user.name,
      email: user.email ?? undefined,
      phone: user.phone,
      method: 'phone',
      publicId: user.normalId ?? user.id,
      displayId: user.id,
      specialId: user.specialId ?? null,
      specialIdExpiresAt: user.specialIdExpiresAt ?? null,
      role: user.role,
      status: user.status,
      vipLevel: user.vipLevel,
      country: user.country ?? undefined,
      profileImage: user.profileImage ?? undefined,
      sessionVersion: user.sessionVersion,
      createdAt: user.createdAt
    };
    return {
      token: sessionToken,
      user: authUser,
      onboardingComplete: false
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const {
        code,
        message,
        fields
      } = error.response.data.error;
      throw new RegisterUserError(message, code, fields);
    }
    throw new RegisterUserError('Unable to reach the server. Check your network and the backend address in .env (STREAMLINE_API_BASE_URL).', 'NETWORK_ERROR');
  }
}
export class LoginUserError extends Error {
  code;
  details;
  constructor(message, code, details) {
    super(message);
    this.name = 'LoginUserError';
    this.code = code;
    this.details = details;
  }
}

// POST /api/users/login — phone + password, plus device info (now
// mandatory: the backend requires device.macAddress and device.location,
// returning 422 without them — see docs/mobile-login-api.md).
export async function loginWithPassword(input) {
  const cleanedPhone = input.phone.trim().replace(/[\s().-]/g, '');
  // Deliberately NOT falling back to getCachedLocation() here — login must
  // block until location services are actually on right now, not whenever
  // they were last on (e.g. permission was granted with GPS enabled, then
  // the user turned it off before logging in; a stale cache would silently
  // let that through).
  const location = await getCurrentLocation();
  if (!location) {
    throw new LoginUserError('Unable to determine your location. Please check location permission and try again.', 'LOCATION_UNAVAILABLE');
  }
  // Human-readable "City, Country" label (matches the backend's documented
  // example), not raw coordinates. Falls back to "lat,lng" internally if
  // reverse geocoding fails, so this field is never left empty.
  const locationLabel = await reverseGeocodeLocationLabel(location);
  try {
    const response = await apiClient.post('/api/users/login', {
      phone: cleanedPhone,
      password: input.password,
      device: {
        macAddress: getStableDeviceId(),
        location: locationLabel,
        platform: Platform.OS === 'ios' ? 'iOS' : 'Android'
      }
    });
    const {
      data
    } = response.data;
    if (data.isBanned || !data.user || !data.sessionToken) {
      throw new LoginUserError(data.banReason ? `Account banned: ${data.banReason}` : 'This account is banned.', 'ACCOUNT_BANNED');
    }
    // Same Special ID caveat as registerUser() below — data.user.id can be a
    // cosmetic VIP/SVIP display ID, the real account key is normalId.
    const authUser = {
      fullName: data.user.name,
      email: data.user.email ?? undefined,
      phone: data.user.phone,
      method: 'phone',
      publicId: data.user.normalId ?? data.user.id,
      displayId: data.user.id,
      specialId: data.user.specialId ?? null,
      specialIdExpiresAt: data.user.specialIdExpiresAt ?? null,
      country: data.user.country ?? undefined,
      profileImage: data.user.profileImage ?? undefined,
      role: data.user.role,
      status: data.user.status,
      vipLevel: data.user.vipLevel,
      createdAt: data.user.createdAt,
      sessionVersion: data.sessionVersion
    };
    return {
      token: data.sessionToken,
      user: authUser,
      onboardingComplete: false
    };
  } catch (error) {
    if (error instanceof LoginUserError) {
      throw error;
    }
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const {
        code,
        message,
        details
      } = error.response.data.error;
      throw new LoginUserError(message, code, details);
    }
    throw new LoginUserError('Unable to reach the server. Check your network and the backend address in .env (STREAMLINE_API_BASE_URL).', 'NETWORK_ERROR');
  }
}
export class UpdateProfileError extends Error {
  code;
  fields;
  constructor(message, code, fields) {
    super(message);
    this.name = 'UpdateProfileError';
    this.code = code;
    this.fields = fields;
  }
}

// PATCH /api/users/profile — self-service edit for name/phone/email/country/
// profileImage. Only fields present on `input` are sent, so a partial update
// leaves the rest untouched.
export async function updateProfile(sessionToken, input) {
  const body = {};
  if (input.fullName !== undefined) body.name = input.fullName.trim();
  if (input.phone !== undefined) body.phone = input.phone.trim();
  if (input.email !== undefined) body.email = input.email?.trim().toLowerCase() ?? null;
  if (input.country !== undefined) body.country = input.country?.trim() ?? null;
  if (input.profileImage !== undefined) body.profileImage = input.profileImage ?? null;
  try {
    const response = await apiClient.patch('/api/users/profile', body, {
      headers: {
        Authorization: `Bearer ${sessionToken}`
      }
    });
    const {
      user
    } = response.data.data;
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
      sessionVersion: user.sessionVersion
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const {
        code,
        message,
        fields
      } = error.response.data.error;
      throw new UpdateProfileError(message, code, fields);
    }
    throw new UpdateProfileError('Unable to reach the server. Check your network and the backend address in .env (STREAMLINE_API_BASE_URL).', 'NETWORK_ERROR');
  }
}
// Fallback status check for cold start / foreground resume (the socket
// connection in src/services/socket.ts handles live push updates while the
// app is running). Fails silently (returns null) if the token is missing,
// invalid, or the backend is unreachable — callers should treat null as
// "no change, nothing to act on" rather than an error. macAddress is now
// mandatory — the backend uses it to report this specific device's ban
// status (deviceBanned/deviceBanReason/deviceBanExpiresAt) alongside the
// account-level ban fields.
export async function checkUserStatus(sessionToken, macAddress) {
  try {
    const response = await apiClient.get('/api/users/session/status', {
      params: { macAddress },
      headers: {
        Authorization: `Bearer ${sessionToken}`
      }
    });
    return response.data.data;
  } catch {
    return null;
  }
}
const TEMP_OTP = '123456';
export async function verifyPhoneOtp(phone, otp) {
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
    onboardingComplete: false
  };
}
export { TEMP_AUTH_CONFIG };
