import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { EyeIcon } from '../../assets';
import { LoginUserError, loginWithPassword, verifyPhoneOtp } from '../../api';
import { appEnv } from '../../config';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { FormField, PrimaryButton, Screen, showAlert } from '../../components';
import { routes } from '../../navigation';
import { openLocationSettings, scaleFont, scaleModerate } from '../../utils';
const TEMP_OTP = '123456';
export function PhoneAuthScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const setSession = useAppStore(state => state.setSession);
  const [phone, setPhone] = React.useState(route.params?.phone || appEnv.authPhone);
  const [otp, setOtp] = React.useState('123456');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // Set by AuthScreen after checking whether this number already has an
  // account (checkPhoneRegistered) — defaults to 'signup' so a direct deep
  // link or missing param behaves like today's only path did.
  const isLoginMode = route.params?.mode === 'login';

  // A real, existing account still only has a password to authenticate
  // with — the backend has no OTP-based login endpoint (only OTP-gated
  // sign-up, which is entirely local/demo). So for a recognized number,
  // OTP here is just an extra local gate in front of the same real
  // loginWithPassword() call the Username tab uses, not a replacement for
  // the password.
  const handleVerifyLogin = async () => {
    if (isSubmitting) {
      return;
    }
    if (otp.trim() !== TEMP_OTP) {
      setError(`Use OTP ${TEMP_OTP} for this demo flow.`);
      return;
    }
    if (password.trim().length === 0) {
      setError('Enter your password to log in.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const session = await loginWithPassword({ phone, password });
      setSession(session);
      navigation.reset({
        index: 0,
        routes: [{ name: session.onboardingComplete ? routes.home : routes.onboarding }]
      });
    } catch (loginError) {
      if (loginError instanceof LoginUserError && loginError.code === 'LOCATION_UNAVAILABLE') {
        showAlert('Turn On Location', 'Please turn on location services to log in, then try again.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openLocationSettings() }
        ]);
      } else if (loginError instanceof LoginUserError && loginError.code === 'DEVICE_BANNED') {
        const reason = loginError.details?.reason;
        showAlert('Device Banned', reason ? `This device has been banned.\nReason: ${reason}` : 'This device has been banned.');
      } else if (loginError instanceof LoginUserError) {
        setError(loginError.message);
      } else {
        setError('Unable to log in.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySignup = async () => {
    if (isSubmitting) {
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const session = await verifyPhoneOtp(phone, otp);
      const cleanedPhone = phone.replace(/\D/g, '');
      if (session && !appEnv.demoVisualizeFullFlow) {
        setSession(session);
        navigation.reset({
          index: 0,
          routes: [{
            name: routes.home
          }]
        });
        return;
      }
      if (session) {
        setSession(session);
      }
      navigation.reset({
        index: 0,
        routes: [{
          name: routes.signupDetails,
          params: {
            phone: cleanedPhone
          }
        }]
      });
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Unable to verify OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = isLoginMode ? handleVerifyLogin : handleVerifySignup;

  return <Screen avoidKeyboard>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, {
        color: theme.text.primary
      }]}>{isLoginMode ? 'Welcome Back' : 'Verify Phone Number'}</Text>
        <Text style={[styles.subtitle, {
        color: theme.text.secondary
      }]}>
          {isLoginMode
            ? `This number already has an account. Use OTP ${TEMP_OTP} and your password to log in.`
            : `Use OTP ${TEMP_OTP} for this demo flow.`}
        </Text>

        <View style={[styles.card, {
        backgroundColor: theme.surfaces.card,
        borderColor: theme.colors.cardBorder,
        shadowColor: theme.colors.teal900
      }]}>
          <FormField label="Phone Number" placeholder="Phone Number" value={phone} onChangeText={setPhone} icon="phone" keyboardType="phone-pad" editable={!isLoginMode} />
          <FormField label="OTP" placeholder="Enter OTP" value={otp} onChangeText={setOtp} icon="lock" keyboardType="number-pad" />

          {isLoginMode ? (
            <FormField
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              icon="lock"
              secureTextEntry={!showPassword}
              rightElement={
                <Pressable onPress={() => setShowPassword(value => !value)} hitSlop={10}>
                  <EyeIcon size={18} color={theme.text.mutedIcon} />
                </Pressable>
              }
            />
          ) : null}

          <PrimaryButton label={isSubmitting ? 'Verifying...' : isLoginMode ? 'Log In' : 'Verify OTP'} onPress={handleVerify} disabled={isSubmitting} style={styles.button} />

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
  button: {
    marginTop: scaleModerate(4)
  },
  errorText: {
    marginTop: scaleModerate(12),
    fontSize: scaleFont(12),
    fontWeight: '600',
    textAlign: 'center'
  }
});
export default PhoneAuthScreen;
