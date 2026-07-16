import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, type NavigationProp, type RouteProp } from '@react-navigation/native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { EyeIcon, UserIcon } from '../../assets';
import { signUpWithCredentials } from '../../api';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { FormField, PrimaryButton, Screen, TermsCheckbox } from '../../components';
import { routes, type RootStackParamList } from '../../navigation';

type SignupDetailsRoute = RouteProp<RootStackParamList, 'SignupDetails'>;

type SignupState = {
  fullName: string;
  phone: string;
  dob: string;
  password: string;
  confirmPassword: string;
};

const MIN_PASSWORD_LENGTH = 8;

function getPasswordRequirementError(value: string) {
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return null;
}

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return new Date(2000, 0, 1);
  }

  return parsed;
}

function DobPickerField({
  value,
  onChange,
  visible,
  onToggleVisible,
}: {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  const theme = useTheme();
  const selectedDate = parseDate(value);

  const handleDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      onToggleVisible();
    }

    if (date) {
      onChange(formatDate(date));
    }
  };

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: theme.text.secondary }]}>Date of Birth</Text>
      <Pressable
        onPress={onToggleVisible}
        style={[styles.field, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
      >
        <UserIcon size={18} color={theme.text.mutedIcon} />
        <Text style={[styles.dobValue, { color: value ? theme.text.primary : theme.text.mutedIcon }]}>{value || 'YYYY-MM-DD'}</Text>
        <View style={styles.fieldAction}>
          <Text style={[styles.pickButtonText, { color: theme.colors.teal700 }]}>Pick</Text>
        </View>
      </Pressable>

      {visible ? (
        <View style={[styles.pickerWrap, { borderColor: theme.colors.cardBorder, backgroundColor: theme.surfaces.page }]}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        </View>
      ) : null}
    </View>
  );
}

export function SignupDetailsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<SignupDetailsRoute>();
  const setSession = useAppStore(state => state.setSession);
  const [signup, setSignup] = React.useState<SignupState>({
    fullName: '',
    phone: route.params.phone,
    dob: '',
    password: '',
    confirmPassword: '',
  });
  const [termsAccepted, setTermsAccepted] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [showDobPicker, setShowDobPicker] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const passwordRequirementError = getPasswordRequirementError(signup.password);
  const passwordsMismatch = signup.password.length > 0 && signup.confirmPassword.length > 0 && signup.password !== signup.confirmPassword;
  const signupDisabled =
    !termsAccepted ||
    Boolean(passwordRequirementError) ||
    passwordsMismatch ||
    signup.fullName.trim().length === 0 ||
    signup.dob.trim().length === 0 ||
    signup.password.trim().length === 0 ||
    signup.confirmPassword.trim().length === 0;

  const handleCreateAccount = async () => {
    if (signupDisabled || isSubmitting) {
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
    <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Complete Sign Up</Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>Fill in the remaining details to continue to onboarding.</Text>

        <View style={[styles.card, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder, shadowColor: theme.colors.teal900 }]}>
          <FormField label="Full Name" placeholder="Full Name" value={signup.fullName} onChangeText={text => setSignup(current => ({ ...current, fullName: text }))} icon="user" />
          <FormField label="Phone Number" placeholder="Phone Number" value={signup.phone} onChangeText={text => setSignup(current => ({ ...current, phone: text }))} icon="phone" editable={false} />
          <DobPickerField value={signup.dob} onChange={dob => setSignup(current => ({ ...current, dob }))} visible={showDobPicker} onToggleVisible={() => setShowDobPicker(value => !value)} />
          <FormField
            label="Password"
            placeholder="Password"
            value={signup.password}
            onChangeText={text => setSignup(current => ({ ...current, password: text }))}
            icon="lock"
            secureTextEntry={!showPassword}
            rightElement={
              <Pressable onPress={() => setShowPassword(value => !value)} hitSlop={10}>
                <EyeIcon size={18} color={theme.text.mutedIcon} />
              </Pressable>
            }
          />
          <FormField
            label="Confirm Password"
            placeholder="Confirm Password"
            value={signup.confirmPassword}
            onChangeText={text => setSignup(current => ({ ...current, confirmPassword: text }))}
            icon="lock"
            secureTextEntry={!showConfirmPassword}
            rightElement={
              <Pressable onPress={() => setShowConfirmPassword(value => !value)} hitSlop={10}>
                <EyeIcon size={18} color={theme.text.mutedIcon} />
              </Pressable>
            }
          />

          <TermsCheckbox
            accepted={termsAccepted}
            onToggle={() => setTermsAccepted(value => !value)}
            onOpenTerms={() => navigation.navigate(routes.terms)}
            style={styles.termsWrap}
          />

          <PrimaryButton
            label={isSubmitting ? 'Creating...' : 'Create Account'}
            onPress={handleCreateAccount}
            disabled={signupDisabled || isSubmitting}
            style={styles.button}
          />

          {passwordRequirementError ? <Text style={[styles.errorText, { color: theme.colors.giftAccent }]}>{passwordRequirementError}</Text> : null}
          {passwordsMismatch ? <Text style={[styles.errorText, { color: theme.colors.giftAccent }]}>Passwords do not match.</Text> : null}
          {error ? <Text style={[styles.errorText, { color: theme.colors.giftAccent }]}>{error}</Text> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  card: {
    marginTop: 20,
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 6,
    paddingLeft: 4,
    fontSize: 12,
    fontWeight: '700',
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
  dobValue: {
    flex: 1,
    fontSize: 15,
  },
  pickButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fieldAction: {
    marginLeft: 8,
  },
  pickerWrap: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  termsWrap: {
    marginTop: 4,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  button: {
    marginTop: 4,
  },
  errorText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default SignupDetailsScreen;
