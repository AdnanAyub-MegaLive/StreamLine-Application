import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { FacebookIcon, GoogleIcon, PhoneIcon } from '../../assets';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { BrandMark, Screen, TermsCheckbox } from '../../components';
import { routes, type RootStackParamList } from '../../navigation';

type SocialProvider = 'google' | 'facebook';

function createDummySocialSession(provider: SocialProvider) {
  return {
    token: `${provider}-${Date.now()}`,
    onboardingComplete: true,
    user: {
      fullName: 'Streamline User',
      email: provider === 'google' ? 'google@streamline.demo' : 'facebook@streamline.demo',
      phone: '0000000000',
      dob: '2000-01-01',
      method: 'email' as const,
    },
  };
}

function SocialButton({ provider, disabled, onPress }: { provider: SocialProvider; disabled: boolean; onPress: () => void }) {
  const theme = useTheme();
  const label = provider === 'google' ? 'Sign in with Google' : 'Sign in with Facebook';

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.socialButton,
        {
          backgroundColor: theme.surfaces.card,
          borderColor: theme.colors.cardBorder,
        },
        disabled && styles.socialButtonDisabled,
      ]}
    >
      {provider === 'google' ? <GoogleIcon size={22} /> : <FacebookIcon size={22} />}
      <Text style={[styles.socialButtonText, { color: disabled ? theme.text.mutedIcon : theme.text.primary }]}>{label}</Text>
    </Pressable>
  );
}

export function AuthScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const setSession = useAppStore(state => state.setSession);
  const [termsAccepted, setTermsAccepted] = React.useState(true);

  const handleSocialLogin = (provider: SocialProvider) => {
    if (!termsAccepted) {
      return;
    }

    setSession(createDummySocialSession(provider));
    navigation.reset({ index: 0, routes: [{ name: routes.home }] });
  };

  const handlePhoneLogin = () => {
    if (!termsAccepted) {
      return;
    }

    navigation.navigate(routes.phoneAuth);
  };

  return (
    <Screen transparent>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <BrandMark size={96} />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Choose how you want to continue.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder, shadowColor: theme.colors.teal900 }]}>
          <SocialButton provider="google" disabled={!termsAccepted} onPress={() => handleSocialLogin('google')} />
          <SocialButton provider="facebook" disabled={!termsAccepted} onPress={() => handleSocialLogin('facebook')} />

          <Pressable
            disabled={!termsAccepted}
            onPress={handlePhoneLogin}
            style={[
              styles.phoneButton,
              {
                backgroundColor: theme.cta.primary.background,
              },
              !termsAccepted && styles.phoneButtonDisabled,
            ]}
          >
            <PhoneIcon size={20} color={theme.cta.primary.text} />
            <Text style={[styles.phoneButtonText, { color: theme.cta.primary.text }]}>Continue with Phone No</Text>
          </Pressable>

          <TermsCheckbox
            accepted={termsAccepted}
            onToggle={() => setTermsAccepted(value => !value)}
            onOpenTerms={() => navigation.navigate(routes.terms)}
            style={styles.termsWrap}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 34,
  },
  hero: {
    paddingTop: 20,
    paddingBottom: 18,
    alignItems: 'center',
  },
  title: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  card: {
    marginTop: 115,
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    gap: 13,
  },
  socialButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialButtonDisabled: {
    opacity: 0.45,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  phoneButton: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  phoneButtonDisabled: {
    opacity: 0.45,
  },
  phoneButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  termsWrap: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

export default AuthScreen;
