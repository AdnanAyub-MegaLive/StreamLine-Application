import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { updateProfile, UpdateProfileError } from '../../api';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { AVATAR_PRESETS, Avatar, FormField, getAvatarPresetId, getAvatarPresetValue, PrimaryButton, Screen } from '../../components';
import { scaleFont, scaleModerate } from '../../utils';
import '../../navigation';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;
function formatDobIso(date) {
  return date.toISOString().slice(0, 10);
}
function formatDobDisplay(value) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}
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
  // Only a bundled preset avatar can be chosen here for now — no CDN/upload
  // storage exists yet, see the Onboarding screen's handleNext comment for
  // why real device photos aren't persisted. Defaults to the first preset
  // if nothing was ever saved (e.g. an account created before this shipped).
  const [selectedAvatarId, setSelectedAvatarId] = React.useState(
    getAvatarPresetId(session?.user.profileImage) ?? AVATAR_PRESETS[0].id
  );
  // Gender and date of birth can only ever be set once — see
  // Onboarding/SignupDetails, where they're normally set for the first
  // time. Once the session already has a value, these fields lock: no
  // picker, just a read-only display.
  const isGenderLocked = Boolean(session?.user.gender);
  const isDobLocked = Boolean(session?.user.dob);
  const [gender, setGender] = React.useState(session?.user.gender === 'female' ? 'female' : 'male');
  // Tracks whether the user actually interacted with these pickers this
  // visit — without this, saving an unrelated edit (e.g. just the phone
  // number) would silently resend the untouched default ('male', the first
  // avatar preset) and permanently lock gender to a value the user never
  // chose. See handleSave, which only includes these fields when already
  // locked (harmless — same value round-trips) or actually touched.
  const [genderTouched, setGenderTouched] = React.useState(false);
  const [avatarTouched, setAvatarTouched] = React.useState(false);
  const [dob, setDob] = React.useState(isDobLocked ? new Date(session.user.dob) : null);
  const [isDobPickerVisible, setIsDobPickerVisible] = React.useState(false);
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
        country: form.country.trim().length > 0 ? form.country.trim() : null,
        // profileImage isn't locked, so it's fine to resend once touched
        // (or already set). gender/dob are different: the backend now
        // rejects the request with 409 FIELD_LOCKED whenever the key is
        // merely *present* in the body and already set server-side — it
        // doesn't check whether the value actually changed. So once
        // locked, these must never be included at all, not even
        // unchanged — otherwise every unrelated edit (e.g. just the phone
        // number) would fail outright for any user who already has a
        // gender/dob saved.
        ...(avatarTouched || session?.user.profileImage
          ? { profileImage: getAvatarPresetValue(selectedAvatarId) }
          : {}),
        ...(!isGenderLocked && genderTouched ? { gender } : {}),
        ...(!isDobLocked && dob ? { dob: formatDobIso(dob) } : {})
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
          <Avatar value={getAvatarPresetValue(selectedAvatarId)} fullName={form.fullName} size={scaleModerate(72)} style={styles.avatarPreview} />

          <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Avatar</Text>
          <View style={styles.avatarRow}>
            {AVATAR_PRESETS.map(preset => {
              const avatarTheme = theme.onboarding.avatarStyles[preset.id];
              const selected = selectedAvatarId === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => {
                    setSelectedAvatarId(preset.id);
                    setAvatarTouched(true);
                  }}
                  style={[
                    styles.avatarOption,
                    {
                      backgroundColor: avatarTheme.background,
                      borderColor: selected ? avatarTheme.accent : theme.colors.cardBorder,
                      borderWidth: selected ? 2 : 1
                    }
                  ]}
                >
                  <Text style={styles.avatarOptionEmoji}>{preset.emoji}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, styles.sectionLabelSpacing, { color: theme.text.secondary }]}>Gender</Text>
          {isGenderLocked ? (
            <View style={[styles.lockedField, { backgroundColor: theme.surfaces.page, borderColor: theme.colors.cardBorder }]}>
              <Text style={[styles.lockedFieldText, { color: theme.text.primary }]}>{gender === 'male' ? 'Male' : 'Female'}</Text>
              <Text style={[styles.lockedFieldHint, { color: theme.text.mutedIcon }]}>Can't be changed</Text>
            </View>
          ) : (
            <View style={styles.genderRow}>
              {['male', 'female'].map(option => {
                const selected = gender === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setGender(option);
                      setGenderTouched(true);
                    }}
                    style={[
                      styles.genderOption,
                      {
                        backgroundColor: selected ? theme.cta.primary.background : theme.surfaces.page,
                        borderColor: selected ? theme.cta.primary.background : theme.colors.cardBorder
                      }
                    ]}
                  >
                    <Text style={[styles.genderOptionText, { color: selected ? theme.cta.primary.text : theme.text.secondary }]}>
                      {option === 'male' ? 'Male' : 'Female'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Text style={[styles.sectionLabel, styles.sectionLabelSpacing, { color: theme.text.secondary }]}>Date of Birth</Text>
          {isDobLocked ? (
            <View style={[styles.lockedField, { backgroundColor: theme.surfaces.page, borderColor: theme.colors.cardBorder }]}>
              <Text style={[styles.lockedFieldText, { color: theme.text.primary }]}>{formatDobDisplay(dob)}</Text>
              <Text style={[styles.lockedFieldHint, { color: theme.text.mutedIcon }]}>Can't be changed</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => setIsDobPickerVisible(true)}
              style={[styles.lockedField, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
            >
              <Text style={[styles.lockedFieldText, { color: dob ? theme.text.primary : theme.text.mutedIcon }]}>
                {dob ? formatDobDisplay(dob) : 'Not set — tap to choose'}
              </Text>
            </Pressable>
          )}
          {isDobPickerVisible ? (
            <DateTimePicker
              value={dob ?? new Date()}
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
  avatarPreview: {
    alignSelf: 'center',
    marginBottom: scaleModerate(14)
  },
  sectionLabel: {
    fontSize: scaleFont(12),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: scaleModerate(10)
  },
  sectionLabelSpacing: {
    marginTop: scaleModerate(18)
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: scaleModerate(10),
    columnGap: scaleModerate(10)
  },
  avatarOption: {
    width: scaleModerate(48),
    height: scaleModerate(48),
    borderRadius: scaleModerate(24),
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarOptionEmoji: {
    fontSize: scaleFont(22)
  },
  genderRow: {
    flexDirection: 'row',
    gap: scaleModerate(10)
  },
  genderOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: scaleModerate(14),
    paddingVertical: scaleModerate(12),
    alignItems: 'center'
  },
  genderOptionText: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  lockedField: {
    minHeight: scaleModerate(48),
    borderRadius: scaleModerate(14),
    borderWidth: 1,
    paddingHorizontal: scaleModerate(16),
    justifyContent: 'center'
  },
  lockedFieldText: {
    fontSize: scaleFont(14),
    fontWeight: '600'
  },
  lockedFieldHint: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(10.5)
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
