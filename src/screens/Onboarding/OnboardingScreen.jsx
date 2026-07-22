import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { FemaleIcon, MaleIcon } from '../../assets';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { Screen, showAlert } from '../../components';
import { routes } from '../../navigation';
import { scaleFont, scaleModerate } from '../../utils';
const avatars = [{
  id: 'a1',
  label: 'Ranger',
  emoji: '🕵️',
  themeKey: 'ranger'
}, {
  id: 'a2',
  label: 'Hero',
  emoji: '🦸',
  themeKey: 'hero'
}, {
  id: 'a3',
  label: 'Nova',
  emoji: '🪐',
  themeKey: 'nova'
}, {
  id: 'a4',
  label: 'More',
  emoji: '⋯',
  themeKey: 'more'
}];
function StepIndicator() {
  const theme = useTheme();
  return <View style={styles.stepWrap}>
      <View style={[styles.stepDot, {
      backgroundColor: theme.onboarding.stepIndicator.mutedDot
    }]} />
      <View style={[styles.stepPill, {
      backgroundColor: theme.onboarding.stepIndicator.activePill
    }]} />
      <View style={[styles.stepDot, {
      backgroundColor: theme.onboarding.stepIndicator.mutedDot
    }]} />
    </View>;
}
function AvatarCard({
  item,
  selected,
  onPress
}) {
  const theme = useTheme();
  const avatarTheme = theme.onboarding.avatarStyles[item.themeKey];
  return <Pressable onPress={onPress} style={[styles.avatarCard, {
    backgroundColor: theme.surfaces.card,
    borderColor: selected ? avatarTheme.accent : theme.colors.cardBorder,
    shadowColor: theme.colors.teal900
  }, selected && styles.avatarCardSelected]}>
      <View style={[styles.avatarCircle, {
      backgroundColor: avatarTheme.background,
      borderColor: selected ? avatarTheme.accent : theme.colors.cardBorder
    }]}>
        <Text style={styles.avatarEmoji}>{item.emoji}</Text>
      </View>
      <Text style={[styles.avatarLabel, {
      color: theme.text.primary
    }]}>{item.label}</Text>
      {selected ? <Text style={[styles.avatarSelected, {
      color: avatarTheme.accent
    }]}>Selected</Text> : null}
    </Pressable>;
}
function GenderChoice({
  gender,
  active,
  onPress
}) {
  const theme = useTheme();
  const Icon = gender === 'boy' ? MaleIcon : FemaleIcon;
  const genderBadgeStyle = active ? {
    backgroundColor: theme.onboarding.gender.activeBackground,
    borderColor: theme.onboarding.gender.activeBorder
  } : {
    backgroundColor: 'transparent',
    borderColor: theme.onboarding.gender.inactiveBorder
  };
  return <Pressable onPress={onPress} style={[styles.genderChoice, {
    backgroundColor: active ? theme.surfaces.card : theme.surfaces.page,
    borderColor: active ? theme.onboarding.gender.activeBorder : theme.onboarding.gender.inactiveBorder,
    shadowColor: theme.colors.teal900
  }]}>
      <View style={styles.genderTitleRow}>
        <Icon size={22} color={active ? theme.onboarding.gender.activeBorder : theme.text.secondary} />
        <Text style={[styles.genderTitle, {
        color: theme.text.primary
      }]}>{gender === 'boy' ? 'Boy' : 'Girl'}</Text>
      </View>
      <Text style={[styles.genderSubtitle, {
      color: active ? theme.onboarding.gender.activeBorder : theme.text.secondary
    }]}>{active ? 'Selected' : 'Choose'}</Text>
      <View style={[styles.genderBadge, genderBadgeStyle]}>
        <Icon size={16} color={active ? theme.cta.primary.text : theme.text.secondary} />
      </View>
    </Pressable>;
}
function DeviceAvatarPicker({
  imageUri,
  onPress
}) {
  const theme = useTheme();
  return <View style={styles.deviceAvatarSection}>
      <Text style={[styles.deviceAvatarHeading, {
      color: theme.text.primary
    }]}>Or choose from your device</Text>
      <Text style={[styles.deviceAvatarCopy, {
      color: theme.text.secondary
    }]}>This only shows a local preview for now.</Text>

      <Pressable onPress={onPress} style={[styles.deviceAvatarButton, {
      backgroundColor: theme.surfaces.page,
      borderColor: imageUri ? theme.onboarding.gender.activeBorder : theme.onboarding.deviceAvatar.border
    }]}>
        {imageUri ? <Image source={{
        uri: imageUri
      }} style={styles.deviceAvatarImage} /> : <View style={[styles.deviceAvatarPlaceholder, {
        backgroundColor: theme.onboarding.deviceAvatar.placeholder
      }]}>
            <Text style={[styles.deviceAvatarPlaceholderText, {
          color: theme.text.secondary
        }]}>Tap to choose photo</Text>
          </View>}

        <View style={[styles.deviceAvatarAddBadge, {
        backgroundColor: theme.onboarding.deviceAvatar.addBadge,
        shadowColor: theme.colors.teal900
      }]}>
          <Text style={[styles.deviceAvatarAddBadgeText, {
          color: theme.cta.primary.text
        }]}>+</Text>
        </View>
      </Pressable>
    </View>;
}
export function OnboardingScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const completeOnboarding = useAppStore(state => state.completeOnboarding);
  const [selectedAvatar, setSelectedAvatar] = React.useState(avatars[1].id);
  const [selectedGender, setSelectedGender] = React.useState('boy');
  const [deviceAvatarUri, setDeviceAvatarUri] = React.useState(null);
  const handleChooseDeviceAvatar = async () => {
    const response = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      includeBase64: false,
      quality: 0.8
    });
    if (response.didCancel) {
      return;
    }
    const pickedUri = response.assets?.[0]?.uri;
    if (!pickedUri) {
      showAlert('Photo not selected', 'Please choose a photo from your device.');
      return;
    }
    setDeviceAvatarUri(pickedUri);
  };
  const handleNext = () => {
    completeOnboarding();
    navigation.reset({
      index: 0,
      routes: [{
        name: routes.home
      }]
    });
  };
  return <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => {
          navigation.reset({
            index: 0,
            routes: [{
              name: routes.auth
            }]
          });
        }} style={[styles.backButton, {
          backgroundColor: theme.onboarding.backButton.background,
          borderColor: theme.onboarding.backButton.border
        }]}>
            <Text style={[styles.backButtonText, {
            color: theme.onboarding.backButton.text
          }]}>←</Text>
          </Pressable>
          <StepIndicator />
          <View style={styles.topBarSpacer} />
        </View>

        <Text style={[styles.title, {
        color: theme.text.primary
      }]}>Choose Your Avatar</Text>
        <Text style={[styles.subtitle, {
        color: theme.text.secondary
      }]}>Select an avatar and gender to represent you in the lounge.</Text>

        <View style={[styles.avatarPanel, {
        backgroundColor: theme.surfaces.card,
        borderColor: theme.colors.cardBorder,
        shadowColor: theme.colors.teal900
      }]}>
          <DeviceAvatarPicker imageUri={deviceAvatarUri} onPress={handleChooseDeviceAvatar} />
          <Text style={[styles.sectionLabel, styles.sectionLabelSpacing, {
          color: theme.text.secondary
        }]}>Choose your avatar</Text>
          <View style={styles.avatarRow}>
            {avatars.map(item => <AvatarCard key={item.id} item={item} selected={selectedAvatar === item.id} onPress={() => setSelectedAvatar(item.id)} />)}
          </View>
        </View>

        <View style={styles.genderSection}>
          <Text style={[styles.genderHeading, {
          color: theme.text.primary
        }]}>Gender</Text>
          <Text style={[styles.genderCopy, {
          color: theme.text.secondary
        }]}>Choose one below your avatar.</Text>

          <View style={styles.genderRow}>
            <GenderChoice gender="boy" active={selectedGender === 'boy'} onPress={() => setSelectedGender('boy')} />
            <GenderChoice gender="girl" active={selectedGender === 'girl'} onPress={() => setSelectedGender('girl')} />
          </View>
        </View>

        <Pressable onPress={handleNext} style={({
        pressed
      }) => [styles.nextButton, {
        backgroundColor: theme.cta.primary.background,
        opacity: pressed ? 0.92 : 1
      }]}>
          <Text style={[styles.nextButtonText, {
          color: theme.cta.primary.text
        }]}>Next →</Text>
        </Pressable>
      </ScrollView>
    </Screen>;
}
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(18),
    paddingBottom: scaleModerate(28)
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  topBarSpacer: {
    width: scaleModerate(24)
  },
  backButton: {
    width: scaleModerate(40),
    height: scaleModerate(40),
    borderRadius: scaleModerate(20),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  backButtonText: {
    fontSize: scaleFont(22),
    fontWeight: '700',
    lineHeight: 24
  },
  stepWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(6)
  },
  stepDot: {
    width: scaleModerate(7),
    height: scaleModerate(7),
    borderRadius: 999
  },
  stepPill: {
    width: scaleModerate(28),
    height: scaleModerate(8),
    borderRadius: 999
  },
  title: {
    marginTop: scaleModerate(34),
    textAlign: 'center',
    fontSize: scaleFont(26),
    fontWeight: '800',
    letterSpacing: -0.3
  },
  subtitle: {
    marginTop: scaleModerate(8),
    textAlign: 'center',
    fontSize: scaleFont(14),
    lineHeight: 20,
    maxWidth: 280,
    alignSelf: 'center'
  },
  avatarPanel: {
    marginTop: scaleModerate(34),
    borderRadius: scaleModerate(24),
    borderWidth: 1,
    padding: scaleModerate(16),
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8
    },
    elevation: 3
  },
  sectionLabel: {
    fontSize: scaleFont(12),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: scaleModerate(12)
  },
  sectionLabelSpacing: {
    marginTop: scaleModerate(18)
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scaleModerate(10)
  },
  avatarCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: scaleModerate(20),
    paddingVertical: scaleModerate(14),
    alignItems: 'center',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6
    },
    elevation: 2
  },
  avatarCardSelected: {
    transform: [{
      translateY: -2
    }]
  },
  avatarCircle: {
    width: scaleModerate(54),
    height: scaleModerate(54),
    borderRadius: scaleModerate(27),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleModerate(8)
  },
  avatarEmoji: {
    fontSize: scaleFont(24)
  },
  avatarLabel: {
    fontSize: scaleFont(12),
    fontWeight: '800'
  },
  avatarSelected: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  deviceAvatarSection: {
    marginTop: scaleModerate(18),
    alignItems: 'center'
  },
  deviceAvatarHeading: {
    fontSize: scaleFont(16),
    fontWeight: '800',
    textAlign: 'center'
  },
  deviceAvatarCopy: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(12),
    textAlign: 'center'
  },
  deviceAvatarButton: {
    marginTop: scaleModerate(14),
    width: scaleModerate(140),
    height: scaleModerate(140),
    borderRadius: scaleModerate(70),
    borderWidth: 2,
    padding: scaleModerate(8),
    alignItems: 'center',
    justifyContent: 'center'
  },
  deviceAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: scaleModerate(62)
  },
  deviceAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: scaleModerate(62),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(16)
  },
  deviceAvatarPlaceholderText: {
    fontSize: scaleFont(13),
    fontWeight: '700',
    textAlign: 'center'
  },
  deviceAvatarAddBadge: {
    position: 'absolute',
    right: scaleModerate(6),
    bottom: scaleModerate(6),
    width: scaleModerate(34),
    height: scaleModerate(34),
    borderRadius: scaleModerate(17),
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4
    },
    elevation: 4
  },
  deviceAvatarAddBadgeText: {
    fontSize: scaleFont(24),
    lineHeight: 26,
    fontWeight: '700',
    marginTop: scaleModerate(-2)
  },
  genderSection: {
    marginTop: scaleModerate(22)
  },
  genderHeading: {
    fontSize: scaleFont(18),
    fontWeight: '800'
  },
  genderCopy: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(13)
  },
  genderRow: {
    marginTop: scaleModerate(14),
    flexDirection: 'row',
    gap: scaleModerate(12)
  },
  genderChoice: {
    flex: 1,
    minHeight: scaleModerate(112),
    borderRadius: scaleModerate(22),
    borderWidth: 1,
    padding: scaleModerate(16),
    justifyContent: 'space-between',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 6
    },
    elevation: 2
  },
  genderTitle: {
    fontSize: scaleFont(20),
    fontWeight: '800'
  },
  genderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(8)
  },
  genderSubtitle: {
    fontSize: scaleFont(12),
    fontWeight: '600'
  },
  genderBadge: {
    alignSelf: 'flex-end',
    width: scaleModerate(30),
    height: scaleModerate(30),
    borderRadius: scaleModerate(15),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  nextButton: {
    marginTop: scaleModerate(28),
    minHeight: scaleModerate(52),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  nextButtonText: {
    fontSize: scaleFont(16),
    fontWeight: '800'
  }
});
export default OnboardingScreen;
