import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { updateProfile, UpdateProfileError } from '../../api';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { AVATAR_PRESETS, Avatar, getAvatarPresetId, getAvatarPresetValue, PrimaryButton, Screen, showAlert } from '../../components';
import { useAssignedFrame } from '../../hooks';
import { scaleFont, scaleModerate } from '../../utils';

// Opened by tapping the profile picture on the Profile screen. Offers the
// same bundled avatar presets as Onboarding, plus picking a photo from the
// gallery. There's still no CDN/file storage for avatars — a gallery photo
// is resized down by the picker (256px, includeBase64) and stored as a
// data: URI in the existing profileImage string field, which the Avatar
// component already renders like any other image URI.
export function ChangeAvatarScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const session = useAppStore(state => state.session);
  const frameUri = useAssignedFrame();
  const setSession = useAppStore(state => state.setSession);
  const savedPresetId = getAvatarPresetId(session?.user.profileImage);
  const [selectedAvatarId, setSelectedAvatarId] = React.useState(savedPresetId ?? AVATAR_PRESETS[0].id);
  // When set, the picked gallery photo (as a data: URI) wins over the
  // preset selection — starts out holding an already-saved photo, if any.
  const [photoUri, setPhotoUri] = React.useState(savedPresetId ? null : session?.user.profileImage ?? null);
  const [error, setError] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const selectedValue = photoUri ?? getAvatarPresetValue(selectedAvatarId);

  const handlePickPhoto = async () => {
    const response = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      includeBase64: true,
      maxWidth: 256,
      maxHeight: 256,
      quality: 0.7
    });
    if (response.didCancel) {
      return;
    }
    const asset = response.assets?.[0];
    if (!asset?.base64) {
      showAlert('Photo not selected', 'Please choose a photo from your device.');
      return;
    }
    setPhotoUri(`data:${asset.type ?? 'image/jpeg'};base64,${asset.base64}`);
  };

  const handleSave = async () => {
    if (isSubmitting || !session) {
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const updatedUser = await updateProfile(session.token, {
        profileImage: selectedValue
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
      setError(updateError instanceof UpdateProfileError
        ? updateError.message
        : 'Unable to update avatar. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text.primary }]}>Change Avatar</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Avatar value={selectedValue} fullName={session?.user.fullName} size={scaleModerate(96)} style={styles.preview} frameUri={frameUri} />

        <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Upload a photo</Text>
        <Pressable onPress={handlePickPhoto} style={[styles.uploadBox, {
          backgroundColor: theme.surfaces.card,
          borderColor: photoUri ? theme.colors.teal700 : theme.colors.cardBorder
        }]}>
          <Text style={[styles.uploadPlus, { color: theme.colors.teal700 }]}>+</Text>
          <Text style={[styles.uploadHint, { color: theme.text.mutedIcon }]}>
            {photoUri ? 'Photo selected — tap to change' : 'Choose from gallery'}
          </Text>
        </Pressable>

        <Text style={[styles.sectionLabel, styles.sectionSpacing, { color: theme.text.secondary }]}>Or choose an avatar</Text>
        <View style={styles.avatarGrid}>
          {AVATAR_PRESETS.map(preset => {
            const avatarTheme = theme.onboarding.avatarStyles[preset.id];
            const selected = !photoUri && selectedAvatarId === preset.id;
            return (
              <Pressable
                key={preset.id}
                onPress={() => {
                  setPhotoUri(null);
                  setSelectedAvatarId(preset.id);
                }}
                style={[styles.avatarOption, {
                  backgroundColor: avatarTheme.background,
                  borderColor: selected ? avatarTheme.accent : theme.colors.cardBorder
                }, selected ? styles.avatarOptionSelected : styles.avatarOptionUnselected]}
              >
                <Text style={styles.avatarOptionEmoji}>{preset.emoji}</Text>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton label={isSubmitting ? 'Saving...' : 'Save'} onPress={handleSave} disabled={isSubmitting} style={styles.button} />
        {error ? <Text style={[styles.errorText, { color: theme.colors.giftAccent }]}>{error}</Text> : null}
      </ScrollView>
    </Screen>;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(14),
    paddingBottom: scaleModerate(28)
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleModerate(18)
  },
  backChevron: {
    fontSize: scaleFont(28),
    fontWeight: '700'
  },
  headerSpacer: {
    width: scaleModerate(20)
  },
  title: {
    fontSize: scaleFont(20),
    fontWeight: '800'
  },
  preview: {
    alignSelf: 'center',
    marginBottom: scaleModerate(20)
  },
  sectionLabel: {
    fontSize: scaleFont(12),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: scaleModerate(12)
  },
  uploadBox: {
    height: scaleModerate(84),
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadPlus: {
    fontSize: scaleFont(26),
    fontWeight: '700'
  },
  uploadHint: {
    fontSize: scaleFont(11)
  },
  sectionSpacing: {
    marginTop: scaleModerate(18)
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: scaleModerate(14),
    columnGap: scaleModerate(14)
  },
  avatarOption: {
    width: scaleModerate(64),
    height: scaleModerate(64),
    borderRadius: scaleModerate(32),
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarOptionSelected: {
    borderWidth: 2
  },
  avatarOptionUnselected: {
    borderWidth: 1
  },
  avatarOptionEmoji: {
    fontSize: scaleFont(28)
  },
  button: {
    marginTop: scaleModerate(24)
  },
  errorText: {
    marginTop: scaleModerate(10),
    fontSize: scaleFont(12),
    fontWeight: '600',
    textAlign: 'center'
  }
});

export default ChangeAvatarScreen;
