import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { EyeIcon, FacebookIcon, GoogleIcon } from '../../assets';
import { loginWithPassword, LoginUserError } from '../../api';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { BrandMark, FormField, PrimaryButton, Screen, TermsCheckbox } from '../../components';
import { routes } from '../../navigation';
function createDummySocialSession(provider) {
  return {
    token: `${provider}-${Date.now()}`,
    onboardingComplete: true,
    user: {
      fullName: 'Streamline User',
      email: provider === 'google' ? 'google@streamline.demo' : 'facebook@streamline.demo',
      phone: '0000000000',
      dob: '2000-01-01',
      method: 'email'
    }
  };
}
function SocialButton({
  provider,
  disabled,
  onPress
}) {
  const theme = useTheme();
  const label = provider === 'google' ? 'Sign in with Google' : 'Sign in with Facebook';
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.socialButton, {
    backgroundColor: theme.surfaces.card,
    borderColor: theme.colors.cardBorder
  }, disabled && styles.socialButtonDisabled]}>
      {provider === 'google' ? <GoogleIcon size={22} /> : <FacebookIcon size={22} />}
      <Text style={[styles.socialButtonText, {
      color: disabled ? theme.text.mutedIcon : theme.text.primary
    }]}>{label}</Text>
    </Pressable>;
}
function TabSwitcher({
  active,
  onChange
}) {
  const theme = useTheme();
  return <View style={[styles.tabSwitcher, {
    backgroundColor: theme.surfaces.page,
    borderColor: theme.colors.cardBorder
  }]}>
      {['phone', 'username'].map(tab => {
      const isActive = tab === active;
      return <Pressable key={tab} onPress={() => onChange(tab)} style={[styles.tabButton, isActive && {
        backgroundColor: theme.cta.primary.background
      }]}>
            <Text style={[styles.tabButtonText, {
          color: isActive ? theme.cta.primary.text : theme.text.secondary
        }]}>
              {tab === 'phone' ? 'Phone Number' : 'Username'}
            </Text>
          </Pressable>;
    })}
    </View>;
}
function RememberMeCheckbox({
  checked,
  onToggle
}) {
  const theme = useTheme();
  return <Pressable onPress={onToggle} style={styles.rememberMeRow}>
      <View style={[styles.rememberMeBox, {
      backgroundColor: checked ? theme.cta.primary.background : theme.surfaces.card,
      borderColor: checked ? theme.cta.primary.background : theme.colors.cardBorder
    }]}>
        <Text style={[styles.rememberMeCheck, {
        color: theme.cta.primary.text
      }]}>{checked ? '✓' : ''}</Text>
      </View>
      <Text style={[styles.rememberMeText, {
      color: theme.text.secondary
    }]}>Remember me</Text>
    </Pressable>;
}
export function AuthScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const setSession = useAppStore(state => state.setSession);
  const [activeTab, setActiveTab] = React.useState('phone');
  const [termsAccepted, setTermsAccepted] = React.useState(true);
  const [phone, setPhone] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const handleSocialLogin = provider => {
    if (!termsAccepted) {
      return;
    }
    setSession(createDummySocialSession(provider));
    navigation.reset({
      index: 0,
      routes: [{
        name: routes.home
      }]
    });
  };
  const handlePhoneContinue = () => {
    if (!termsAccepted) {
      return;
    }
    navigation.navigate(routes.phoneAuth, phone.trim().length > 0 ? {
      phone: phone.trim()
    } : undefined);
  };
  const handleUsernameLogin = async () => {
    if (!termsAccepted || isSubmitting || username.trim().length === 0 || password.trim().length === 0) {
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      // The backend has no separate username field — accounts are looked up
      // by phone number only, so whatever is entered here is treated as one.
      const session = await loginWithPassword({
        phone: username,
        password
      });
      setSession(session);
      navigation.reset({
        index: 0,
        routes: [{
          name: session.onboardingComplete ? routes.home : routes.onboarding
        }]
      });
    } catch (loginError) {
      if (loginError instanceof LoginUserError) {
        setError(loginError.message);
      } else {
        setError('Unable to log in.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return <Screen transparent>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <BrandMark size={96} />
          <Text style={styles.title}>Hello!</Text>
          <Text style={styles.subtitle}>Welcome back to Streamline</Text>
        </View>

        <View style={[styles.card, {
        backgroundColor: theme.surfaces.card,
        borderColor: theme.colors.cardBorder,
        shadowColor: theme.colors.teal900
      }]}>
          <TabSwitcher active={activeTab} onChange={setActiveTab} />

          {activeTab === 'phone' ? <View style={styles.tabContent}>
              <FormField label="Phone Number" placeholder="Enter your phone number" value={phone} onChangeText={setPhone} icon="phone" keyboardType="phone-pad" />

              <PrimaryButton label="Continue" onPress={handlePhoneContinue} disabled={!termsAccepted} style={styles.actionButton} />
            </View> : <View style={styles.tabContent}>
              <FormField label="Username" placeholder="Enter your registered phone number" value={username} onChangeText={setUsername} icon="user" keyboardType="phone-pad" />

              <FormField label="Password" placeholder="Enter your password" value={password} onChangeText={setPassword} icon="lock" secureTextEntry={!showPassword} rightElement={<Pressable onPress={() => setShowPassword(value => !value)} hitSlop={10}>
                    <EyeIcon size={18} color={theme.text.mutedIcon} />
                  </Pressable>} />

              <View style={styles.optionsRow}>
                <RememberMeCheckbox checked={rememberMe} onToggle={() => setRememberMe(value => !value)} />
                <Pressable>
                  <Text style={[styles.forgotPasswordText, {
                color: theme.colors.teal700
              }]}>Forgot Password?</Text>
                </Pressable>
              </View>

              <PrimaryButton label={isSubmitting ? 'Logging in...' : 'Login'} onPress={handleUsernameLogin} disabled={!termsAccepted || isSubmitting || username.trim().length === 0 || password.trim().length === 0} style={styles.actionButton} />

              {error ? <Text style={[styles.errorText, {
            color: theme.colors.giftAccent
          }]}>{error}</Text> : null}
            </View>}

          <View style={styles.divider}>
            <View style={[styles.dividerLine, {
            backgroundColor: theme.colors.cardBorder
          }]} />
            <Text style={[styles.dividerText, {
            color: theme.text.mutedIcon
          }]}>or continue with</Text>
            <View style={[styles.dividerLine, {
            backgroundColor: theme.colors.cardBorder
          }]} />
          </View>

          <SocialButton provider="google" disabled={!termsAccepted} onPress={() => handleSocialLogin('google')} />
          <SocialButton provider="facebook" disabled={!termsAccepted} onPress={() => handleSocialLogin('facebook')} />

          <TermsCheckbox accepted={termsAccepted} onToggle={() => setTermsAccepted(value => !value)} onOpenTerms={() => navigation.navigate(routes.terms)} style={styles.termsWrap} />
        </View>
      </ScrollView>
    </Screen>;
}
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 34
  },
  hero: {
    paddingTop: 20,
    paddingBottom: 18,
    alignItems: 'center'
  },
  title: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.85)'
  },
  card: {
    marginTop: 70,
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10
    },
    elevation: 4,
    gap: 13
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
    gap: 4
  },
  tabButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700'
  },
  tabContent: {
    gap: 13
  },
  actionButton: {
    marginTop: 2
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  rememberMeBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rememberMeCheck: {
    fontSize: 11,
    fontWeight: '800'
  },
  rememberMeText: {
    fontSize: 12,
    fontWeight: '600'
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '700'
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2
  },
  dividerLine: {
    flex: 1,
    height: 1
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600'
  },
  socialButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  socialButtonDisabled: {
    opacity: 0.45
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '700'
  },
  termsWrap: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  errorText: {
    marginTop: -6,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  }
});
export default AuthScreen;
