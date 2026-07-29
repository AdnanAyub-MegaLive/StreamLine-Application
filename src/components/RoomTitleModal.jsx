import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { useTheme } from '../theme';
import { scaleFont, scaleModerate } from '../utils';

const TITLE_MAX_LENGTH = 60;

// First step of the room-creation flow (before SeatLayoutModal) — the
// owner names the room before confirming its seat count. Prefills with the
// default "{name}'s Room" so tapping Continue immediately still works
// exactly like before this step existed, for anyone who doesn't want to
// bother typing a custom title.
export function RoomTitleModal({ visible, defaultTitle, onClose, onConfirm }) {
  const theme = useTheme();
  const [title, setTitle] = React.useState(defaultTitle);

  React.useEffect(() => {
    if (visible) {
      setTitle(defaultTitle);
    }
  }, [visible, defaultTitle]);

  const handleConfirm = () => {
    const trimmed = title.trim();
    onConfirm(trimmed.length > 0 ? trimmed : defaultTitle);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
          onPress={() => {}}
        >
          <Text style={[styles.title, { color: theme.text.primary }]}>Name Your Room</Text>
          <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
            This is what everyone sees before they join.
          </Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Room title"
            placeholderTextColor={theme.text.mutedIcon}
            maxLength={TITLE_MAX_LENGTH}
            autoFocus
            style={[styles.input, { color: theme.text.primary, borderColor: theme.colors.cardBorder }]}
          />

          <Pressable onPress={handleConfirm} style={[styles.confirmButton, { backgroundColor: theme.cta.primary.background }]}>
            <Text style={[styles.confirmText, { color: theme.cta.primary.text }]}>Continue</Text>
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
  input: {
    marginTop: scaleModerate(16),
    height: scaleModerate(48),
    borderRadius: scaleModerate(12),
    borderWidth: 1,
    paddingHorizontal: scaleModerate(14),
    fontSize: scaleFont(15)
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

export default RoomTitleModal;
