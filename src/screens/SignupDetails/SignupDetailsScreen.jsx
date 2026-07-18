import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { EyeIcon } from '../../assets';
import { registerUser, RegisterUserError } from '../../api';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { FormField, PrimaryButton, Screen, TermsCheckbox } from '../../components';
import { routes } from '../../navigation';
import { getDeviceCountryName } from '../../utils';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;
const MIN_PASSWORD_LENGTH = 8;
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
        country: signup.country.trim().length > 0 ? signup.country.trim() : undefined
      });
      setSession(session);
      navigation.reset({
        index: 0,
        routes: [{
          name: routes.onboarding
        }]
      });
    } catch (signupError) {
      if (signupError instanceof RegisterUserError) {
        setFieldErrors(signupError.fields ?? {});
        setError(signupError.message);
      } else {
        setError('Unable to create account. Check your connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return <Screen>
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

          <FormField label="Country (optional)" placeholder="Country" value={signup.country} onChangeText={text => setSignup(current => ({
          ...current,
          country: text
        }))} icon="user" />

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
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 28
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center'
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
  },
  card: {
    marginTop: 20,
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10
    },
    elevation: 4
  },
  termsWrap: {
    marginTop: 4,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  button: {
    marginTop: 4
  },
  fieldErrorText: {
    marginTop: -8,
    marginBottom: 10,
    paddingLeft: 4,
    fontSize: 11,
    fontWeight: '600'
  },
  errorText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  }
});
export default SignupDetailsScreen;
