import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { verifyPhoneOtp } from '../../api';
import { appEnv } from '../../config';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { FormField, PrimaryButton, Screen } from '../../components';
import { routes } from '../../navigation';
export function PhoneAuthScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const setSession = useAppStore(state => state.setSession);
  const [phone, setPhone] = React.useState(route.params?.phone || appEnv.authPhone);
  const [otp, setOtp] = React.useState('123456');
  const [error, setError] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const handleVerify = async () => {
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
  return <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, {
        color: theme.text.primary
      }]}>Verify Phone Number</Text>
        <Text style={[styles.subtitle, {
        color: theme.text.secondary
      }]}>Use OTP 123456 for this demo flow.</Text>

        <View style={[styles.card, {
        backgroundColor: theme.surfaces.card,
        borderColor: theme.colors.cardBorder,
        shadowColor: theme.colors.teal900
      }]}>
          <FormField label="Phone Number" placeholder="Phone Number" value={phone} onChangeText={setPhone} icon="phone" keyboardType="phone-pad" />
          <FormField label="OTP" placeholder="Enter OTP" value={otp} onChangeText={setOtp} icon="lock" keyboardType="number-pad" />

          <PrimaryButton label="Verify OTP" onPress={handleVerify} disabled={isSubmitting} style={styles.button} />

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
  button: {
    marginTop: 4
  },
  errorText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  }
});
export default PhoneAuthScreen;
