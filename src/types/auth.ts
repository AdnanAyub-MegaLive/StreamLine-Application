export type AuthMethod = 'email' | 'phone';

export type AuthUser = {
  fullName: string;
  email?: string;
  phone: string;
  dob?: string;
  method: AuthMethod;
  // Present once a user is registered against the real backend
  // (StreamLine-Portal). Absent for the local mock/demo auth flows.
  publicId?: string;
  role?: string;
  status?: string;
  vipLevel?: number;
  country?: string;
  profileImage?: string;
  // Incremented by the backend every time an admin forces this user to log
  // out. We store the value seen at login time and compare against it on
  // each status check — a mismatch means "log this session out now".
  sessionVersion?: number;
  // ISO timestamp from the backend's registration response — drives the
  // "New" badge (shown for the first 7 days after signup). Only set for
  // sessions created via the real registerUser() flow.
  createdAt?: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  onboardingComplete: boolean;
};

export type BanInfo = {
  reason: string | null;
  expiresAt: string | null;
};

// Response shape for GET /api/users/session/status (Bearer sessionToken)
// and the matching Socket.IO "session:status" / "account:banned" /
// "account:unbanned" / "session:force-logout" events.
export type UserStatusApiResponse = {
  success: true;
  data: {
    sessionVersion: number;
    forcedLogoutAt: string | null;
    isBanned: boolean;
    banReason: string | null;
    banExpiresAt: string | null;
  };
};

export type LoginInput = {
  identifier: string;
  password: string;
};

export type SignupInput = {
  fullName: string;
  email?: string;
  phone: string;
  dob: string;
  password: string;
  confirmPassword: string;
};

export type RegisterUserInput = {
  fullName: string;
  phone: string;
  password: string;
  email?: string;
  country?: string;
  profileImage?: string;
};

export type RegisterUserApiResponse = {
  success: true;
  message: string;
  data: {
    user: {
      id: string;
      name: string;
      email: string | null;
      phone: string;
      country: string | null;
      profileImage: string | null;
      role: string;
      status: string;
      vipLevel: number;
      createdAt: string;
      sessionVersion: number;
    };
    sessionToken: string;
  };
};

export type RegisterUserApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};

// POST /api/users/login — phone + password only. The backend team's own
// login route only accepts `phone` (no publicId/username lookup), so the
// app matches that contract.
export type LoginUserInput = {
  phone: string;
  password: string;
};

export type LoginUserApiResponse = {
  success: true;
  data: {
    sessionVersion: number;
    forcedLogoutAt: string | null;
    isBanned: boolean;
    banReason: string | null;
    banExpiresAt: string | null;
    user?: { id: string; name: string; phone: string; email: string | null };
    sessionToken?: string;
  };
};

export type LoginUserApiError = {
  success: false;
  error: { code: string; message: string };
};

// PATCH /api/users/profile — self-service profile editing (Bearer sessionToken).
export type UpdateProfileInput = {
  fullName?: string;
  phone?: string;
  email?: string | null;
  country?: string | null;
  profileImage?: string | null;
};

export type UpdateProfileApiResponse = {
  success: true;
  data: {
    user: {
      id: string;
      name: string;
      email: string | null;
      phone: string;
      country: string | null;
      profileImage: string | null;
      role: string;
      status: string;
      vipLevel: number;
      sessionVersion: number;
    };
  };
};

export type UpdateProfileApiError = {
  success: false;
  error: { code: string; message: string; fields?: Record<string, string> };
};
