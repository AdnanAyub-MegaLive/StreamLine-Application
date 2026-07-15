export type AuthMethod = 'email' | 'phone';

export type AuthUser = {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  method: AuthMethod;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
  onboardingComplete: boolean;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

export type SignupInput = {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  password: string;
  confirmPassword: string;
};
