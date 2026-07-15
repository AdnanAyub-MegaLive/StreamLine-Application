import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { EmailIcon, EyeIcon, GoogleIcon, LockIcon, PhoneIcon, UserIcon } from '../../assets';
import { loginWithCredentials, signUpWithCredentials } from '../../api';
import { appEnv } from '../../config';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { Screen } from '../../components';
import { routes, type RootStackParamList } from '../../navigation';

type AuthMode = 'login' | 'signup';

type FieldIcon = 'email' | 'phone' | 'lock' | 'user';

type SignupFormState = {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  password: string;
  confirmPassword: string;
};

function getAgeFromDateString(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDelta = today.getMonth() - parsed.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < parsed.getDate())) {
    age -= 1;
  }

  return age;
}

function getPasswordRequirementError(value: string) {
  if (!/[A-Z]/.test(value)) {
    return 'Password must contain an uppercase letter.';
  }

  if (!/[a-z]/.test(value)) {
    return 'Password must contain a lowercase letter.';
  }

  if (!/[0-9]/.test(value)) {
    return 'Password must contain a number.';
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    return 'Password must contain a special character.';
  }

  return null;
}

function Field({
  label,
  placeholder,
  secureTextEntry,
  keyboardType,
  icon,
  value,
  onChangeText,
  rightElement,
}: {
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  icon: FieldIcon;
  value?: string;
  onChangeText?: (text: string) => void;
  rightElement?: React.ReactNode;
}) {
  const theme = useTheme();
  const Icon =
    icon === 'lock'
      ? LockIcon
      : icon === 'phone'
        ? PhoneIcon
        : icon === 'user'
          ? UserIcon
          : EmailIcon;

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>{label}</Text>
      <View style={[styles.field, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
        <Icon size={18} color={theme.text.mutedIcon} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={theme.text.mutedIcon}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
          style={[styles.input, { color: theme.text.primary }]}
        />
        {rightElement ? <View style={styles.fieldAction}>{rightElement}</View> : null}
      </View>
    </View>
  );
}

function SocialButton({ disabled }: { disabled: boolean }) {
  const theme = useTheme();

  return (
    <Pressable
      disabled={disabled}
      style={[
        styles.socialButton,
        {
          backgroundColor: theme.surfaces.card,
          borderColor: theme.colors.cardBorder,
        },
        disabled && styles.socialButtonDisabled,
      ]}
    >
      <GoogleIcon size={22} />
      <Text style={[styles.socialButtonText, { color: disabled ? theme.text.mutedIcon : theme.text.primary }]}>Sign in with Google</Text>
    </Pressable>
  );
}

function TermsAcceptanceRow({
  accepted,
  onToggle,
  onOpenTerms,
}: {
  accepted: boolean;
  onToggle: () => void;
  onOpenTerms: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.termsWrap}>
      <Pressable
        onPress={onToggle}
        style={[
          styles.termsCheckbox,
          {
            backgroundColor: accepted ? theme.cta.primary.background : theme.surfaces.card,
            borderColor: accepted ? theme.cta.primary.background : theme.colors.cardBorder,
          },
        ]}
      >
        <Text style={[styles.termsCheckboxText, { color: accepted ? theme.cta.primary.text : theme.text.secondary }]}>{accepted ? '✓' : ''}</Text>
      </Pressable>

      <Text style={[styles.termsText, { color: theme.text.secondary }]}>
        I am checking these{' '}
        <Text style={[styles.termsLink, { color: theme.colors.teal700 }]} onPress={onOpenTerms}>
          terms and conditions
        </Text>
      </Text>
    </View>
  );
}

function LoginForm() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const setSession = useAppStore(state => state.setSession);
  const [identifier, setIdentifier] = React.useState<string>(appEnv.authEmail);
  const [password, setPassword] = React.useState<string>(appEnv.authPassword);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const errorTextStyle = [styles.errorText, { color: theme.colors.giftAccent }];

  const handleLogin = async () => {
    if (isSubmitting) {
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the terms and conditions to continue.');
      return;
    }

    if (!identifier.trim() || !password.trim()) {
      setError('Enter your email or phone number and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const session = await loginWithCredentials({ identifier, password });
      setSession(session);
      navigation.reset({
        index: 0,
        routes: [{ name: session.onboardingComplete ? routes.home : routes.onboarding }],
      });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Field
        label="Email or Phone Number"
        placeholder="Email or Phone Number"
        keyboardType="default"
        icon="email"
        value={identifier}
        onChangeText={text => setIdentifier(text)}
      />
      <Field
        label="Password"
        placeholder="Password"
        secureTextEntry={!showPassword}
        icon="lock"
        value={password}
        onChangeText={text => setPassword(text)}
        rightElement={
          <Pressable onPress={() => setShowPassword(value => !value)} hitSlop={10}>
            <EyeIcon size={18} color={theme.text.mutedIcon} />
          </Pressable>
        }
      />

      <Pressable style={styles.forgotButton}>
        <Text style={[styles.forgotText, { color: theme.text.secondary }]}>Forgot Password</Text>
      </Pressable>

      <TermsAcceptanceRow
        accepted={termsAccepted}
        onToggle={() => setTermsAccepted(value => !value)}
        onOpenTerms={() => navigation.navigate(routes.terms)}
      />

      <Pressable
        disabled={isSubmitting}
        onPress={handleLogin}
        style={({ pressed }) => [
          styles.primaryButton,
          {
            backgroundColor: theme.cta.primary.background,
            opacity: pressed || isSubmitting ? 0.92 : 1,
          },
        ]}
      >
        <Text style={[styles.primaryButtonText, { color: theme.cta.primary.text }]}>{isSubmitting ? 'Signing In...' : 'Login'}</Text>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.cardBorder }]} />
        <Text style={[styles.dividerText, { color: theme.text.secondary }]}>or login with</Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.cardBorder }]} />
      </View>

      <View style={styles.socialRow}>
        <SocialButton disabled={!termsAccepted} />
      </View>

      {error ? <Text style={errorTextStyle}>{error}</Text> : null}
    </>
  );
}

function SignupForm() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const setSession = useAppStore(state => state.setSession);
  const [signup, setSignup] = React.useState<SignupFormState>({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const errorTextStyle = [styles.errorText, { color: theme.colors.giftAccent }];

  const age = getAgeFromDateString(signup.dob);
  const isUnderAge = age !== null && age < 12;
  const dobHintStyle = [styles.dobHint, { color: isUnderAge ? theme.colors.giftAccent : theme.text.secondary }];
  const passwordRequirementError = getPasswordRequirementError(signup.password);
  const passwordsMismatch =
    signup.password.length > 0 &&
    signup.confirmPassword.length > 0 &&
    signup.password !== signup.confirmPassword;
  const signupDisabled =
    isUnderAge ||
    Boolean(passwordRequirementError) ||
    passwordsMismatch ||
    signup.fullName.trim().length === 0 ||
    (signup.email.trim().length === 0 && signup.phone.trim().length === 0) ||
    signup.confirmPassword.trim().length === 0;
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSignup = async () => {
    if (signupDisabled || isSubmitting) {
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the terms and conditions to continue.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const session = await signUpWithCredentials(signup);
      setSession(session);
      navigation.reset({ index: 0, routes: [{ name: routes.onboarding }] });
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : 'Unable to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Field
        label="Full Name"
        placeholder="Full Name"
        icon="user"
        value={signup.fullName}
        onChangeText={text => setSignup(current => ({ ...current, fullName: text }))}
      />

      <Field
        label="Email"
        placeholder="Email"
        keyboardType="email-address"
        icon="email"
        value={signup.email}
        onChangeText={text => setSignup(current => ({ ...current, email: text }))}
      />

      <View style={[styles.orDivider, { backgroundColor: theme.colors.cardBorder }]}>
        <Text style={[styles.orDividerText, { color: theme.text.secondary }]}>or</Text>
      </View>

      <Field
        label="Phone Number"
        placeholder="Phone Number"
        keyboardType="phone-pad"
        icon="phone"
        value={signup.phone}
        onChangeText={text => setSignup(current => ({ ...current, phone: text }))}
      />

      <Field
        label="Date of Birth"
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        icon="user"
        value={signup.dob}
        onChangeText={text => setSignup(current => ({ ...current, dob: text }))}
      />
      <Text style={dobHintStyle}>Age 12+ required.</Text>

      <Field
        label="Password"
        placeholder="Password"
        secureTextEntry={!showPassword}
        icon="lock"
        value={signup.password}
        onChangeText={text => setSignup(current => ({ ...current, password: text }))}
        rightElement={
          <Pressable onPress={() => setShowPassword(value => !value)} hitSlop={10}>
            <EyeIcon size={18} color={theme.text.mutedIcon} />
          </Pressable>
        }
      />

      <Field
        label="Confirm Password"
        placeholder="Confirm Password"
        secureTextEntry={!showConfirmPassword}
        icon="lock"
        value={signup.confirmPassword}
        onChangeText={text => setSignup(current => ({ ...current, confirmPassword: text }))}
        rightElement={
          <Pressable onPress={() => setShowConfirmPassword(value => !value)} hitSlop={10}>
            <EyeIcon size={18} color={theme.text.mutedIcon} />
          </Pressable>
        }
      />

      <Text style={[styles.passwordHint, { color: theme.text.secondary }]}>Example: Abc@1234</Text>
      <Text style={[styles.passwordHint, { color: theme.text.secondary }]}>Use uppercase, lowercase, number, and special character.</Text>

      <TermsAcceptanceRow
        accepted={termsAccepted}
        onToggle={() => setTermsAccepted(value => !value)}
        onOpenTerms={() => navigation.navigate(routes.terms)}
      />

      <Pressable
        disabled={signupDisabled}
        onPress={handleSignup}
        style={({ pressed }) => [
          styles.primaryButton,
          {
            backgroundColor: signupDisabled ? theme.colors.teal100 : theme.cta.primary.background,
            opacity: pressed || isSubmitting ? 0.92 : 1,
          },
        ]}
      >
        <Text style={[styles.primaryButtonText, { color: theme.cta.primary.text }]}>{isSubmitting ? 'Creating...' : 'Create Account'}</Text>
      </Pressable>

      {passwordRequirementError ? <Text style={errorTextStyle}>{passwordRequirementError}</Text> : null}
      {passwordsMismatch ? <Text style={errorTextStyle}>Passwords do not match.</Text> : null}
      {error ? <Text style={errorTextStyle}>{error}</Text> : null}
    </>
  );
}

function ModeSwitch({ mode, onChange }: { mode: AuthMode; onChange: (mode: AuthMode) => void }) {
  const theme = useTheme();

  return (
    <View style={[styles.modeSwitch, { backgroundColor: theme.surfaces.page, borderColor: theme.colors.cardBorder }]}>
      <Pressable
        onPress={() => onChange('login')}
        style={[
          styles.modeChip,
          mode === 'login' && { backgroundColor: theme.cta.primary.background },
        ]}
      >
        <Text style={[styles.modeChipText, { color: mode === 'login' ? theme.cta.primary.text : theme.text.secondary }]}>Login</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange('signup')}
        style={[
          styles.modeChip,
          mode === 'signup' && { backgroundColor: theme.cta.primary.background },
        ]}
      >
        <Text style={[styles.modeChipText, { color: mode === 'signup' ? theme.cta.primary.text : theme.text.secondary }]}>Sign Up</Text>
      </Pressable>
    </View>
  );
}

export function AuthScreen() {
  const theme = useTheme();
  const [mode, setMode] = React.useState<AuthMode>('login');

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={[styles.hero, { backgroundColor: theme.colors.teal700 }]}>
            <View style={[styles.heroBlobTop, { backgroundColor: theme.colors.teal100 }]} />
            <View style={[styles.heroBlobSide, { backgroundColor: theme.colors.teal50 }]} />
            <View style={styles.heroTextWrap}>
              <Text style={[styles.heroTitle, { color: theme.surfaces.card }]}>Hello!</Text>
              <Text style={[styles.heroSubtitle, { color: theme.colors.teal50 }]}>Welcome to Streamline</Text>
            </View>
          </View>

          <View style={styles.cardShell}>
            <View style={[styles.card, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
              <ModeSwitch mode={mode} onChange={setMode} />
              {mode === 'login' ? (
                <LoginForm />
              ) : (
                <SignupForm />
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  hero: {
    minHeight: 240,
    paddingTop: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
  },
  heroBlobTop: {
    position: 'absolute',
    top: -24,
    left: -24,
    width: 110,
    height: 110,
    borderRadius: 55,
    opacity: 0.55,
  },
  heroBlobSide: {
    position: 'absolute',
    right: -10,
    top: 16,
    width: 78,
    height: 180,
    borderTopLeftRadius: 56,
    borderBottomLeftRadius: 56,
    opacity: 0.32,
    transform: [{ rotate: '8deg' }],
  },
  heroTextWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 24,
  },
  heroTitle: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  cardShell: {
    marginTop: -24,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
    shadowColor: '#04342C',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  orDivider: {
    alignSelf: 'center',
    minWidth: 54,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: -4,
    marginBottom: 10,
  },
  orDividerText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modeSwitch: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  modeChip: {
    flex: 1,
    minHeight: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    paddingLeft: 4,
  },
  field: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldAction: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -2,
    marginBottom: 16,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dobHint: {
    marginTop: -6,
    marginBottom: 14,
    fontSize: 12,
    fontWeight: '600',
    paddingLeft: 4,
  },
  passwordHint: {
    marginTop: -6,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
    paddingLeft: 4,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 18,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  termsWrap: {
    marginTop: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  termsCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  termsCheckboxText: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  termsLink: {
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  errorText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AuthScreen;