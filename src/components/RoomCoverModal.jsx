import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '../theme';
import { scaleFont, scaleModerate } from '../utils';

// Shown once, right after RoomTitleModal, only when the owner's persistent
// room has no coverImageUrl yet (see DiscoverScreen's handleConfirmRoomTitle)
// — this is the Party/Discover card photo (see StreamLine-Portal's
// docs/mobile-audio-room-api.md "Room cover image"), distinct from the
// room's in-session background. The actual upload only happens once
// RoomScreen has a real assigned roomId (the backend requires one), so this
// just hands the picked asset back through navigation params — see
// RoomScreen's pendingCoverImage handling.
export function RoomCoverModal({ visible, onClose, onConfirm }) {
  const theme = useTheme();
  const [asset, setAsset] = React.useState(null);

  React.useEffect(() => {
    if (visible) {
      setAsset(null);
    }
  }, [visible]);

  const handlePickPhoto = async () => {
    const response = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.8 });
    if (response.didCancel) {
      return;
    }
    const picked = response.assets?.[0];
    if (picked?.uri) {
      setAsset(picked);
    }
  };

  const handleContinue = () => {
    onConfirm(asset ? { uri: asset.uri, type: asset.type, fileName: asset.fileName } : null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
          onPress={() => {}}
        >
          <Text style={[styles.title, { color: theme.text.primary }]}>Add a Cover Photo</Text>
          <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
            Shown on your room's card in Party and Live. You can change it anytime from the room menu.
          </Text>

          <Pressable
            onPress={handlePickPhoto}
            style={[styles.preview, { borderColor: theme.colors.cardBorder, backgroundColor: theme.surfaces.page }]}
          >
            {asset?.uri ? (
              <Image source={{ uri: asset.uri }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <Text style={[styles.previewPlaceholder, { color: theme.text.secondary }]}>Tap to choose a photo</Text>
            )}
          </Pressable>

          <Pressable onPress={handleContinue} style={[styles.confirmButton, { backgroundColor: theme.cta.primary.background }]}>
            <Text style={[styles.confirmText, { color: theme.cta.primary.text }]}>{asset ? 'Continue' : 'Skip for Now'}</Text>
          </Pressable>

          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: theme.text.secondary }]}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(24)
  },
  sheet: {
    width: '100%',
    borderRadius: scaleModerate(20),
    borderWidth: 1,
    padding: scaleModerate(20)
  },
  title: {
    fontSize: scaleFont(16),
    fontWeight: '800',
    textAlign: 'center'
  },
  subtitle: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(12),
    textAlign: 'center'
  },
  preview: {
    marginTop: scaleModerate(16),
    height: scaleModerate(150),
    borderRadius: scaleModerate(14),
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  previewImage: {
    width: '100%',
    height: '100%'
  },
  previewPlaceholder: {
    fontSize: scaleFont(13),
    fontWeight: '600'
  },
  confirmButton: {
    marginTop: scaleModerate(16),
    borderRadius: scaleModerate(20),
    paddingVertical: scaleModerate(12),
    alignItems: 'center'
  },
  confirmText: {
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  cancelButton: {
    marginTop: scaleModerate(4),
    paddingVertical: scaleModerate(10),
    alignItems: 'center'
  },
  cancelText: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  }
});

export default RoomCoverModal;
