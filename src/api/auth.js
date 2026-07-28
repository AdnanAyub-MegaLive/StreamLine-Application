import axios from 'axios';
import { Platform } from 'react-native';
import { appEnv } from '@/config/env';
import { getStableDeviceId } from '@/utils/deviceId';
import { getCachedLocation, getCurrentLocationOrError, reverseGeocodeLocationLabel } from '@/utils/location';
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
// Auth calls (login/signup/OTP) use a shorter timeout than the default
// apiClient one — 5s is long enough for a real response and short enough
// that a hung/unreachable server doesn't leave the user staring at a
// spinner. See classifyAuthError below for how this maps to a popup.
const AUTH_REQUEST_TIMEOUT = 5000;
// Turns any axios failure from a login/signup call into one of three
// distinct, user-facing outcomes instead of one generic "something went
// wrong": the request timed out, the server couldn't be reached at all, or
// the server responded with a real validation/business error (which already
// carries its own message from the backend). UI screens use `code` to
// decide which popup copy to show.
function classifyAuthError(error, ErrorClass) {
  if (error instanceof ErrorClass) {
    return error;
  }
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.error) {
      const { code, message, fields, details } = error.response.data.error;
      return new ErrorClass(message, code, fields ?? details);
    }
    if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message ?? '')) {
      return new ErrorClass('The server is taking too long to respond. Please try again.', 'TIMEOUT');
    }
    return new ErrorClass('Unable to connect to the server. Check your internet connection and try again.', 'SERVER_UNREACHABLE');
  }
  return new ErrorClass('Something went wrong. Please try again.', 'UNKNOWN');
}
// Onboarding's whole job is collecting these two — once both exist on the
// account, there's nothing left to onboard. Used instead of a stored
// boolean so a returning user who logs out and back in (a fresh session
// object every time) doesn't get sent through onboarding again just because
// nothing locally remembered they'd already done it.
function hasCompletedOnboarding(user) {
  return Boolean(user.gender) && Boolean(user.profileImage);
}
// Shared by registerUser/loginWithPassword — gets a fresh GPS fix or throws
// with a message that actually matches why it failed. Only PERMISSION_DENIED
// and POSITION_UNAVAILABLE are genuine "location is off/blocked" cases;
// TIMEOUT means location is on and working, it just didn't get a fix in
// time, so it gets its own message instead of the misleading "turn on
// location" one.
async function requireCurrentLocation(ErrorClass) {
  const result = await getCurrentLocationOrError();
  if (result.location) {
    return result.location;
  }
  if (result.errorCode === 'TIMEOUT') {
    throw new ErrorClass('Could not get your location in time. Move to an area with a clearer signal and try again.', 'LOCATION_TIMEOUT');
  }
  if (result.errorCode === 'PERMISSION_DENIED') {
    throw new ErrorClass('Streamline needs location permission to continue. Please allow it in Settings.', 'LOCATION_PERMISSION_DENIED');
  }
  throw new ErrorClass('Please turn on location services to continue, then try again.', 'LOCATION_UNAVAILABLE');
}
// Login-only, temporary: the strict "turn on location" popup was making
// login feel broken/slow, so login no longer blocks on it at all — it uses
// a cached fix if one exists, otherwise tries for a fresh one but never
// throws or shows a popup if that fails. The backend still requires
// device.location to be a non-empty string, so this always resolves to
// *something* usable (falling back to 0,0 in the worst case) rather than
// leaving the field empty. Sign-up still uses requireCurrentLocation above
// (unaffected) since accuracy matters more there and it wasn't reported as
// a problem.
async function bestEffortLocation() {
  const cached = getCachedLocation();
  if (cached) {
    return cached;
  }
  const result = await getCurrentLocationOrError();
  return result.location ?? { latitude: 0, longitude: 0 };
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
  // Same rule as loginWithPassword — require a fresh location fix (not a
  // stale cached one from earlier), so sign-up is blocked until one is
  // available. See requireCurrentLocation for why the failure reason
  // matters (permission/services off vs. just a slow fix).
  const location = await requireCurrentLocation(RegisterUserError);
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
    dob: input.dob || undefined,
    device: {
      macAddress: getStableDeviceId(),
      platform: Platform.OS === 'ios' ? 'iOS' : 'Android',
      location: locationLabel
    }
  };
  try {
    const response = await apiClient.post('/api/users/register', body, { timeout: AUTH_REQUEST_TIMEOUT });
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
      gender: user.gender ?? undefined,
      dob: user.dob ?? undefined,
      sessionVersion: user.sessionVersion,
      createdAt: user.createdAt
    };
    return {
      token: sessionToken,
      user: authUser,
      onboardingComplete: false
    };
  } catch (error) {
    throw classifyAuthError(error, RegisterUserError);
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
  // See bestEffortLocation above — login no longer blocks or pops up over
  // location at all, it just uses whatever it can get (cached, fresh, or a
  // 0,0 fallback) so the backend's required device.location field is never
  // empty.
  const location = await bestEffortLocation();
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
    }, { timeout: AUTH_REQUEST_TIMEOUT });
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
      gender: data.user.gender ?? undefined,
      dob: data.user.dob ?? undefined,
      role: data.user.role,
      status: data.user.status,
      vipLevel: data.user.vipLevel,
      createdAt: data.user.createdAt,
      sessionVersion: data.sessionVersion
    };
    return {
      token: data.sessionToken,
      user: authUser,
      // Was hardcoded false — meaning every login, even a returning fully
      // set-up user, got sent through onboarding again. A fresh session
      // object is built on every login, so there's no stored flag to check
      // here; derive it instead from whether the account already has both
      // fields onboarding collects.
      onboardingComplete: hasCompletedOnboarding(authUser)
    };
  } catch (error) {
    throw classifyAuthError(error, LoginUserError);
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
// profileImage/gender. Only fields present on `input` are sent, so a
// partial update leaves the rest untouched.
export async function updateProfile(sessionToken, input) {
  const body = {};
  if (input.fullName !== undefined) body.name = input.fullName.trim();
  if (input.phone !== undefined) body.phone = input.phone.trim();
  if (input.email !== undefined) body.email = input.email?.trim().toLowerCase() ?? null;
  if (input.country !== undefined) body.country = input.country?.trim() ?? null;
  if (input.profileImage !== undefined) body.profileImage = input.profileImage ?? null;
  if (input.gender !== undefined) body.gender = input.gender ?? null;
  if (input.dob !== undefined) body.dob = input.dob ?? null;
  try {
    const response = await apiClient.patch('/api/users/profile', body, {
      headers: {
        Authorization: `Bearer ${sessionToken}`
      }
    });
    const {
      user
    } = response.data.data;
    // Same Special ID caveat as registerUser/loginWithPassword — user.id can
    // be a cosmetic VIP/SVIP display id once one is assigned, the permanent
    // account key is always normalId. This previously mapped publicId
    // straight from user.id, which would have silently corrupted the
    // session's real identity for any user with an active Special ID
    // saving literally any profile change (name, phone, avatar, gender...).
    return {
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
      gender: user.gender ?? undefined,
      dob: user.dob ?? undefined,
      // The profile route's response doesn't include sessionVersion — always
      // spreading it here wrote `undefined` into the session, which the
      // session guard reads as 0, so the next status poll (reporting the
      // real version, e.g. 1) looked like a forced version bump and
      // instantly logged the user out after any profile save. Only include
      // it when the backend actually sent one.
      ...(user.sessionVersion !== undefined ? { sessionVersion: user.sessionVersion } : {})
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
// GET /api/users/check-phone — public, no session required. Tells the Auth
// screen whether a phone number already has an account before deciding
// whether to route into the login or sign-up path. Returns null (not a
// boolean) on any failure — including the endpoint not existing yet on an
// older backend build — so callers can fall back to their current
// behavior instead of misreporting "not registered".
export async function checkPhoneRegistered(phone) {
  const cleanedPhone = phone.trim().replace(/[\s().-]/g, '');
  try {
    const response = await apiClient.get('/api/users/check-phone', {
      params: { phone: cleanedPhone }
    });
    return Boolean(response.data?.data?.exists);
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
