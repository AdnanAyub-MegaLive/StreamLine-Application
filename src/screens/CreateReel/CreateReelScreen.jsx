import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import Video from 'react-native-video';
import { PrimaryButton, Screen, showAlert } from '../../components';
import { useTheme } from '../../theme';
import { scaleFont, scaleModerate } from '../../utils';

const PRIVACY_OPTIONS = [
  { key: 'public', emoji: '🌍', label: 'Public' },
  { key: 'friends', emoji: '👥', label: 'Friends Only' },
  { key: 'private', emoji: '🔒', label: 'Only Me' }
];

// Opened from Discover's "+" → Create Reel choice (see CustomTabBar's
// CreateContentModal). No Reels model/endpoint exists on the backend yet
// (Discover's Reels tab is still DUMMY_REELS-only), so this screen is
// fully built out — pick a video, caption it, choose who can see it —
// but posting ends in a "Coming Soon" notice instead of a real upload,
// same as other not-yet-backed features in this app.
export function CreateReelScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const [video, setVideo] = React.useState(null);
  const [paused, setPaused] = React.useState(false);
  const [caption, setCaption] = React.useState('');
  const [privacy, setPrivacy] = React.useState('public');
  const [posting, setPosting] = React.useState(false);

  const handlePickVideo = async () => {
    const response = await launchImageLibrary({ mediaType: 'video', selectionLimit: 1 });
    if (response.didCancel) {
      return;
    }
    const asset = response.assets?.[0];
    if (!asset?.uri) {
      showAlert('Video not selected', 'Please choose a video from your device.');
      return;
    }
    setVideo(asset);
    setPaused(false);
  };

  const handleRemoveVideo = () => {
    setVideo(null);
  };

  const handlePost = () => {
    if (!video) {
      showAlert('Nothing to post', 'Add a video first.');
      return;
    }
    setPosting(true);
    setTimeout(() => {
      setPosting(false);
      showAlert('Coming Soon', "Reel posting isn't available yet — check back soon!");
    }, 400);
  };

  return <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text.primary }]}>Create Reel</Text>
          <View style={styles.headerSpacer} />
        </View>

        {video ? <Pressable onPress={() => setPaused(value => !value)} style={styles.videoWrap}>
            <Video source={{ uri: video.uri }} style={styles.video} resizeMode="cover" repeat paused={paused} />
            {paused ? <View style={styles.playOverlay}>
                <Text style={styles.playGlyph}>▶</Text>
              </View> : null}
            <Pressable onPress={handleRemoveVideo} style={[styles.removeButton, { backgroundColor: theme.colors.liveBadge }]}>
              <Text style={styles.removeButtonText}>✕</Text>
            </Pressable>
          </Pressable> : <Pressable onPress={handlePickVideo} style={[styles.uploadBox, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
            <Text style={[styles.uploadPlus, { color: theme.colors.tertiary }]}>+</Text>
            <Text style={[styles.uploadHint, { color: theme.text.mutedIcon }]}>Select a video from your gallery</Text>
            <Text style={[styles.uploadSubHint, { color: theme.text.mutedIcon }]}>Vertical videos work best</Text>
          </Pressable>}

        {video ? <Pressable onPress={handlePickVideo}>
            <Text style={[styles.changeVideoLink, { color: theme.colors.tertiary }]}>Choose a different video</Text>
          </Pressable> : null}

        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Write a caption…"
          placeholderTextColor={theme.text.mutedIcon}
          multiline
          style={[styles.input, { color: theme.text.primary, backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
        />

        <Pressable style={[styles.soundRow, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]} onPress={() => showAlert('Coming Soon', "Adding music isn't available yet — check back soon!")}>
          <Text style={styles.soundEmoji}>🎵</Text>
          <Text style={[styles.soundLabel, { color: theme.text.primary }]}>Add music or sound</Text>
          <Text style={[styles.soundChevron, { color: theme.text.secondary }]}>›</Text>
        </Pressable>

        <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>Who can watch this reel?</Text>
        <View style={styles.privacyRow}>
          {PRIVACY_OPTIONS.map(option => <Pressable
              key={option.key}
              onPress={() => setPrivacy(option.key)}
              style={[styles.privacyChip, {
                borderColor: privacy === option.key ? theme.colors.tertiary : theme.colors.cardBorder,
                backgroundColor: privacy === option.key ? `${theme.colors.tertiary}22` : theme.surfaces.card
              }]}
            >
              <Text style={styles.privacyEmoji}>{option.emoji}</Text>
              <Text style={[styles.privacyLabel, { color: privacy === option.key ? theme.colors.tertiary : theme.text.secondary }]}>{option.label}</Text>
            </Pressable>)}
        </View>

        <PrimaryButton
          label={posting ? 'Posting…' : 'Post Reel'}
          onPress={handlePost}
          disabled={posting}
          style={styles.postButton}
        />
      </ScrollView>
    </Screen>;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(14),
    paddingBottom: scaleModerate(40)
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
  uploadBox: {
    height: scaleModerate(220),
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleModerate(4)
  },
  uploadPlus: {
    fontSize: scaleFont(30),
    fontWeight: '700'
  },
  uploadHint: {
    fontSize: scaleFont(12),
    fontWeight: '600'
  },
  uploadSubHint: {
    fontSize: scaleFont(10)
  },
  videoWrap: {
    height: scaleModerate(360),
    borderRadius: scaleModerate(16),
    overflow: 'hidden',
    backgroundColor: '#000000'
  },
  video: {
    width: '100%',
    height: '100%'
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  playGlyph: {
    color: '#FFFFFF',
    fontSize: scaleFont(34)
  },
  removeButton: {
    position: 'absolute',
    top: scaleModerate(10),
    right: scaleModerate(10),
    width: scaleModerate(26),
    height: scaleModerate(26),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(13),
    fontWeight: '800'
  },
  changeVideoLink: {
    marginTop: scaleModerate(8),
    fontSize: scaleFont(12),
    fontWeight: '700',
    textAlign: 'center'
  },
  input: {
    minHeight: scaleModerate(80),
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    padding: scaleModerate(14),
    marginTop: scaleModerate(16),
    fontSize: scaleFont(14),
    textAlignVertical: 'top'
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(10),
    borderRadius: scaleModerate(14),
    borderWidth: 1,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(12),
    marginTop: scaleModerate(14)
  },
  soundEmoji: {
    fontSize: scaleFont(18)
  },
  soundLabel: {
    flex: 1,
    fontSize: scaleFont(13),
    fontWeight: '600'
  },
  soundChevron: {
    fontSize: scaleFont(18),
    fontWeight: '700'
  },
  sectionLabel: {
    marginTop: scaleModerate(18),
    marginBottom: scaleModerate(8),
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  privacyRow: {
    flexDirection: 'row',
    gap: scaleModerate(8)
  },
  privacyChip: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: scaleModerate(12),
    paddingVertical: scaleModerate(10)
  },
  privacyEmoji: {
    fontSize: scaleFont(16)
  },
  privacyLabel: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(10.5),
    fontWeight: '700',
    textAlign: 'center'
  },
  postButton: {
    marginTop: scaleModerate(24)
  }
});

export default CreateReelScreen;
