import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { updateProfile, UpdateProfileError } from '../../api';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { FormField, PrimaryButton, Screen } from '../../components';
import { scaleFont, scaleModerate } from '../../utils';
import '../../navigation';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;
export function EditProfileScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const session = useAppStore(state => state.session);
  const setSession = useAppStore(state => state.setSession);
  const [form, setForm] = React.useState({
    fullName: session?.user.fullName ?? '',
    phone: session?.user.phone ?? '',
    email: session?.user.email ?? '',
    country: session?.user.country ?? ''
  });
  const [error, setError] = React.useState(null);
  const [fieldErrors, setFieldErrors] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const trimmedEmail = form.email.trim();
  const isEmailValid = trimmedEmail.length === 0 || EMAIL_PATTERN.test(trimmedEmail);
  const isPhoneValid = PHONE_PATTERN.test(form.phone.trim());
  const isNameValid = form.fullName.trim().length >= 2;
  const saveDisabled = !isNameValid || !isPhoneValid || !isEmailValid || isSubmitting;
  const handleSave = async () => {
    if (saveDisabled || !session) {
      return;
    }
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const updatedUser = await updateProfile(session.token, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: trimmedEmail.length > 0 ? trimmedEmail : null,
        country: form.country.trim().length > 0 ? form.country.trim() : null
      });
      setSession({
        ...session,
        user: {
          ...session.user,
          ...updatedUser
        }
      });
      navigation.goBack();
    } catch (updateError) {
      if (updateError instanceof UpdateProfileError) {
        setFieldErrors(updateError.fields ?? {});
        setError(updateError.message);
      } else {
        setError('Unable to update profile. Check your connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return <Screen avoidKeyboard>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, {
        color: theme.text.primary
      }]}>Edit Profile</Text>
        <Text style={[styles.subtitle, {
        color: theme.text.secondary
      }]}>Update your account details.</Text>

        <View style={[styles.card, {
        backgroundColor: theme.surfaces.card,
        borderColor: theme.colors.cardBorder,
        shadowColor: theme.colors.teal900
      }]}>
          <FormField label="Full Name" placeholder="Full Name" value={form.fullName} onChangeText={text => setForm(current => ({
          ...current,
          fullName: text
        }))} icon="user" />
          {fieldErrors.name ? <Text style={[styles.fieldErrorText, {
          color: theme.colors.giftAccent
        }]}>{fieldErrors.name}</Text> : null}

          <FormField label="Phone Number" placeholder="Phone Number" value={form.phone} onChangeText={text => setForm(current => ({
          ...current,
          phone: text
        }))} icon="phone" keyboardType="phone-pad" />
          {fieldErrors.phone ? <Text style={[styles.fieldErrorText, {
          color: theme.colors.giftAccent
        }]}>{fieldErrors.phone}</Text> : null}

          <FormField label="Email (optional)" placeholder="Email" value={form.email} onChangeText={text => setForm(current => ({
          ...current,
          email: text
        }))} icon="email" keyboardType="email-address" />
          {fieldErrors.email ? <Text style={[styles.fieldErrorText, {
          color: theme.colors.giftAccent
        }]}>{fieldErrors.email}</Text> : null}

          <FormField label="Country (optional)" placeholder="Country" value={form.country} onChangeText={text => setForm(current => ({
          ...current,
          country: text
        }))} icon="user" />
          {fieldErrors.country ? <Text style={[styles.fieldErrorText, {
          color: theme.colors.giftAccent
        }]}>{fieldErrors.country}</Text> : null}

          <PrimaryButton label={isSubmitting ? 'Saving...' : 'Save Changes'} onPress={handleSave} disabled={saveDisabled} style={styles.button} />

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
export default EditProfileScreen;
