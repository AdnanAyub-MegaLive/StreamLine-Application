import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { EyeIcon } from '../../assets';
import { registerUser, RegisterUserError } from '../../api';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { FormField, PrimaryButton, Screen, showAlert, showLocationErrorAlert, TermsCheckbox } from '../../components';
import { routes } from '../../navigation';
import {
  getCachedLocation,
  getCurrentLocation,
  getDeviceCountryName,
  reverseGeocodeCountry,
  scaleFont,
  scaleModerate
} from '../../utils';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;
const MIN_PASSWORD_LENGTH = 8;
const DEFAULT_DOB_AGE_YEARS = 18;
const LOCATION_ERROR_CODES = ['LOCATION_UNAVAILABLE', 'LOCATION_TIMEOUT', 'LOCATION_PERMISSION_DENIED'];
function formatDobIso(date) {
  return date.toISOString().slice(0, 10);
}
function formatDobDisplay(date) {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}
function defaultDobDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - DEFAULT_DOB_AGE_YEARS);
  return date;
}
export function SignupDetailsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const setSession = useAppStore(state => state.setSession);
  const [signup, setSignup] = React.useState({
    fullName: '',
    phone: route.params.phone,
    email: '',
    country: getDeviceCountryName(),
    password: '',
    confirmPassword: ''
  });
  const hasEditedCountryRef = React.useRef(false);
  React.useEffect(() => {
    // The device-locale-based guess (getDeviceCountryName) can be wrong —
    // it's the phone's Region *setting*, not its physical location. Once
    // location permission is granted, override it with the real country
    // from GPS coordinates, but only if the user hasn't already typed their
    // own value into the field in the meantime.
    const applyGpsCountry = async () => {
      const location = getCachedLocation() ?? (await getCurrentLocation());
      if (!location) {
        return;
      }
      const country = await reverseGeocodeCountry(location);
      if (country && !hasEditedCountryRef.current) {
        setSignup(current => ({ ...current, country }));
      }
    };
    applyGpsCountry();
  }, []);
  // Optional — a user who skips it gets DEFAULT_DOB_AGE_YEARS at submit time
  // (see handleCreateAccount). Like gender, date of birth can only be set
  // once (EditProfile locks it after this), so this is worth getting right
  // even though it isn't required.
  const [dob, setDob] = React.useState(null);
  const [isDobPickerVisible, setIsDobPickerVisible] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [fieldErrors, setFieldErrors] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const trimmedEmail = signup.email.trim();
  const isEmailValid = trimmedEmail.length === 0 || EMAIL_PATTERN.test(trimmedEmail);
  const isPhoneValid = PHONE_PATTERN.test(signup.phone.trim());
  const isPasswordValid = signup.password.length >= MIN_PASSWORD_LENGTH;
  const passwordsMatch = signup.password === signup.confirmPassword;
  const signupDisabled = !termsAccepted || signup.fullName.trim().length === 0 || !isPhoneValid || !isEmailValid || !isPasswordValid || !passwordsMatch;
  const handleCreateAccount = async () => {
    if (signupDisabled || isSubmitting) {
      return;
    }
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const session = await registerUser({
        fullName: signup.fullName,
        phone: signup.phone,
        password: signup.password,
        email: trimmedEmail.length > 0 ? trimmedEmail : undefined,
        country: signup.country.trim().length > 0 ? signup.country.trim() : undefined,
        dob: formatDobIso(dob ?? defaultDobDate())
      });
      setSession(session);
      navigation.reset({
        index: 0,
        routes: [{
          name: routes.onboarding
        }]
      });
    } catch (signupError) {
      if (signupError instanceof RegisterUserError && LOCATION_ERROR_CODES.includes(signupError.code)) {
        showLocationErrorAlert(signupError);
      } else if (signupError instanceof RegisterUserError && signupError.code === 'TIMEOUT') {
        setError(signupError.message);
        showAlert('Request Timed Out', signupError.message);
      } else if (signupError instanceof RegisterUserError && signupError.code === 'SERVER_UNREACHABLE') {
        setError(signupError.message);
        showAlert('Unable to Connect', signupError.message);
      } else if (signupError instanceof RegisterUserError) {
        setFieldErrors(signupError.fields ?? {});
        setError(signupError.message);
        showAlert('Sign Up Failed', signupError.message);
      } else {
        setError('Unable to create account. Check your connection and try again.');
        showAlert('Sign Up Failed', 'Unable to create account. Check your connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return <Screen avoidKeyboard>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, {
        color: theme.text.primary
      }]}>Complete Sign Up</Text>
        <Text style={[styles.subtitle, {
        color: theme.text.secondary
      }]}>Fill in the remaining details to continue to onboarding.</Text>

        <View style={[styles.card, {
        backgroundColor: theme.surfaces.card,
        borderColor: theme.colors.cardBorder,
        shadowColor: theme.colors.teal900
      }]}>
          <FormField label="Full Name" placeholder="Full Name" value={signup.fullName} onChangeText={text => setSignup(current => ({
          ...current,
          fullName: text
        }))} icon="user" />
          {fieldErrors.name ? <Text style={[styles.fieldErrorText, {
          color: theme.colors.giftAccent
        }]}>{fieldErrors.name}</Text> : null}

          <FormField label="Phone Number" placeholder="Phone Number" value={signup.phone} onChangeText={text => setSignup(current => ({
          ...current,
          phone: text
        }))} icon="phone" editable={false} />

          <FormField label="Email (optional)" placeholder="Email" value={signup.email} onChangeText={text => setSignup(current => ({
          ...current,
          email: text
        }))} icon="email" keyboardType="email-address" />
          {fieldErrors.email ? <Text style={[styles.fieldErrorText, {
          color: theme.colors.giftAccent
        }]}>{fieldErrors.email}</Text> : null}

          <FormField label="Country (optional)" placeholder="Country" value={signup.country} onChangeText={text => {
          hasEditedCountryRef.current = true;
          setSignup(current => ({
            ...current,
            country: text
          }));
        }} icon="user" />

          <View style={styles.fieldWrap}>
            <Text style={[styles.dobLabel, { color: theme.text.secondary }]}>Date of Birth (optional)</Text>
            <Pressable
              onPress={() => setIsDobPickerVisible(true)}
              style={[styles.dobField, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
            >
              <Text style={[styles.dobFieldText, { color: dob ? theme.text.primary : theme.text.mutedIcon }]}>
                {dob ? formatDobDisplay(dob) : `Not set — defaults to age ${DEFAULT_DOB_AGE_YEARS}`}
              </Text>
            </Pressable>
            <Text style={[styles.dobHint, { color: theme.text.mutedIcon }]}>
              Can only be set once — you won't be able to change it later.
            </Text>
            {fieldErrors.dob ? <Text style={[styles.fieldErrorText, { color: theme.colors.giftAccent }]}>{fieldErrors.dob}</Text> : null}
          </View>
          {isDobPickerVisible ? (
            <DateTimePicker
              value={dob ?? defaultDobDate()}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setIsDobPickerVisible(false);
                if (event.type === 'set' && selectedDate) {
                  setDob(selectedDate);
                }
              }}
            />
          ) : null}

          <FormField label="Set a Password" placeholder="Password" value={signup.password} onChangeText={text => setSignup(current => ({
          ...current,
          password: text
        }))} icon="lock" secureTextEntry={!showPassword} rightElement={<Pressable onPress={() => setShowPassword(value => !value)} hitSlop={10}>
                <EyeIcon size={18} color={theme.text.mutedIcon} />
              </Pressable>} />
          {signup.password.length > 0 && !isPasswordValid ? <Text style={[styles.fieldErrorText, {
          color: theme.colors.giftAccent
        }]}>Password must be at least {MIN_PASSWORD_LENGTH} characters.</Text> : null}

          <FormField label="Confirm Password" placeholder="Confirm Password" value={signup.confirmPassword} onChangeText={text => setSignup(current => ({
          ...current,
          confirmPassword: text
        }))} icon="lock" secureTextEntry={!showConfirmPassword} rightElement={<Pressable onPress={() => setShowConfirmPassword(value => !value)} hitSlop={10}>
                <EyeIcon size={18} color={theme.text.mutedIcon} />
              </Pressable>} />
          {signup.confirmPassword.length > 0 && !passwordsMatch ? <Text style={[styles.fieldErrorText, {
          color: theme.colors.giftAccent
        }]}>Passwords do not match.</Text> : null}

          <TermsCheckbox accepted={termsAccepted} onToggle={() => setTermsAccepted(value => !value)} onOpenTerms={() => navigation.navigate(routes.terms)} style={styles.termsWrap} />

          <PrimaryButton label={isSubmitting ? 'Creating...' : 'Create Account'} onPress={handleCreateAccount} disabled={signupDisabled || isSubmitting} style={styles.button} />

          {error ? <Text style={[styles.errorText, {
          color: theme.colors.giftAccent
        }]}>{error}</Text> : null}
        </View>
      </ScrollView>
    </Screen>;
}
const styles = StyleSheet.create({
  fieldWrap: {
    marginBottom: scaleModerate(14)
  },
  dobLabel: {
    marginBottom: scaleModerate(6),
    paddingLeft: scaleModerate(4),
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  dobField: {
    minHeight: scaleModerate(48),
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: scaleModerate(16),
    justifyContent: 'center'
  },
  dobFieldText: {
    fontSize: scaleFont(15)
  },
  dobHint: {
    marginTop: scaleModerate(6),
    paddingLeft: scaleModerate(4),
    fontSize: scaleFont(10.5)
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(36),
    paddingBottom: scaleModerate(28)
  },
  title: {
    fontSize: scaleFont(28),
    fontWeight: '800',
    textAlign: 'center'
  },
  subtitle: {
    marginTop: scaleModerate(8),
    fontSize: scaleFont(14),
    lineHeight: 20,
    textAlign: 'center'
  },
  card: {
    marginTop: scaleModerate(20),
    borderRadius: scaleModerate(28),
    borderWidth: 1,
    padding: scaleModerate(18),
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10
    },
    elevation: 4
  },
  termsWrap: {
    marginTop: scaleModerate(4),
    marginBottom: scaleModerate(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(10)
  },
  button: {
    marginTop: scaleModerate(4)
  },
  fieldErrorText: {
    marginTop: scaleModerate(-8),
    marginBottom: scaleModerate(10),
    paddingLeft: scaleModerate(4),
    fontSize: scaleFont(11),
    fontWeight: '600'
  },
  errorText: {
    marginTop: scaleModerate(10),
    fontSize: scaleFont(12),
    fontWeight: '600',
    textAlign: 'center'
  }
});
export default SignupDetailsScreen;
