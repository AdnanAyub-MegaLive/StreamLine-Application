import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { createPost, CreatePostError, updatePost } from '../../api';
import { PrimaryButton, Screen, showAlert } from '../../components';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { scaleFont, scaleModerate } from '../../utils';

// Opened from the Discover tab's "+" button (see CustomTabBar's
// handleCenterPress) instead of the usual create-room flow — a description
// plus an optional photo, Facebook-post style. See
// docs/discover-posts-api-spec.md for the POST /api/posts endpoint this
// needs.
//
// Also doubles as the edit screen — DiscoverScreen's "⋮" menu on your own
// post navigates here with { postId, initialDescription, initialImageUrl }
// (see docs/discover-posts-edit-delete-spec.md's PATCH endpoint), pre-
// filling the form and switching the Post button to Save.
export function CreatePostScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { postId, initialDescription, initialImageUrl } = route.params ?? {};
  const isEditing = Boolean(postId);
  const sessionToken = useAppStore(state => state.session?.token);
  const [description, setDescription] = React.useState(initialDescription ?? '');
  const [photo, setPhoto] = React.useState(null);
  // Only meaningful while editing — the existing image shown until the
  // user picks a new one or explicitly removes it; distinct from `photo`
  // (a freshly-picked local file) so the screen knows whether to send a
  // new image, keep the current one, or clear it.
  const [existingImageUrl, setExistingImageUrl] = React.useState(initialImageUrl ?? null);
  const [posting, setPosting] = React.useState(false);

  const handlePickPhoto = async () => {
    const response = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.8 });
    if (response.didCancel) {
      return;
    }
    const asset = response.assets?.[0];
    if (!asset?.uri) {
      showAlert('Photo not selected', 'Please choose a photo from your device.');
      return;
    }
    setPhoto(asset);
    setExistingImageUrl(null);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setExistingImageUrl(null);
  };

  const handlePost = async () => {
    if (!description.trim() && !photo && !existingImageUrl) {
      showAlert('Nothing to post', 'Add a description or a photo first.');
      return;
    }
    setPosting(true);
    try {
      if (isEditing) {
        await updatePost(sessionToken, postId, {
          description,
          imageUri: photo?.uri,
          imageType: photo?.type,
          imageFileName: photo?.fileName,
          removeImage: !photo && !existingImageUrl
        });
      } else {
        await createPost(sessionToken, {
          description,
          imageUri: photo?.uri,
          imageType: photo?.type,
          imageFileName: photo?.fileName
        });
      }
      navigation.goBack();
    } catch (error) {
      showAlert(isEditing ? "Couldn't save changes" : "Couldn't post", error instanceof CreatePostError ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const previewUri = photo?.uri ?? existingImageUrl;

  return <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text.primary }]}>{isEditing ? 'Edit Post' : 'Create Post'}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What's on your mind?"
          placeholderTextColor={theme.text.mutedIcon}
          multiline
          style={[styles.input, { color: theme.text.primary, backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
        />

        {previewUri ? <View>
            <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" />
            <Pressable onPress={handleRemovePhoto} style={[styles.removePhotoButton, { backgroundColor: theme.colors.liveBadge }]}>
              <Text style={styles.removePhotoText}>✕</Text>
            </Pressable>
          </View> : null}

        <Pressable onPress={handlePickPhoto} style={[styles.uploadBox, { backgroundColor: theme.surfaces.card, borderColor: previewUri ? theme.colors.teal700 : theme.colors.cardBorder }]}>
          <Text style={[styles.uploadPlus, { color: theme.colors.teal700 }]}>+</Text>
          <Text style={[styles.uploadHint, { color: theme.text.mutedIcon }]}>{previewUri ? 'Photo selected — tap to change' : 'Add a photo'}</Text>
        </Pressable>

        <PrimaryButton
          label={posting ? (isEditing ? 'Saving…' : 'Posting…') : (isEditing ? 'Save' : 'Post')}
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
  input: {
    minHeight: scaleModerate(120),
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    padding: scaleModerate(14),
    fontSize: scaleFont(15),
    textAlignVertical: 'top'
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: scaleModerate(16),
    marginTop: scaleModerate(16)
  },
  removePhotoButton: {
    position: 'absolute',
    top: scaleModerate(26),
    right: scaleModerate(10),
    width: scaleModerate(26),
    height: scaleModerate(26),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },
  removePhotoText: {
    color: '#FFFFFF',
    fontSize: scaleFont(13),
    fontWeight: '800'
  },
  uploadBox: {
    height: scaleModerate(84),
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleModerate(16)
  },
  uploadPlus: {
    fontSize: scaleFont(26),
    fontWeight: '700'
  },
  uploadHint: {
    fontSize: scaleFont(11)
  },
  postButton: {
    marginTop: scaleModerate(24)
  }
});

export default CreatePostScreen;
