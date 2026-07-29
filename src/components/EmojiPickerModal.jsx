import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { scaleFont, scaleModerate } from '../utils';

// A grid of commonly-used emoji, grouped loosely by mood/reaction/gesture —
// enough variety for a room chat without pulling in a full emoji-data
// package. Opened from the bottom bar's Mood button in both RoomScreen and
// DemoRoomScreen; picking one appends it to the caller's chat draft rather
// than sending immediately, so multiple emoji (or emoji + text) can still
// be combined before hitting Send.
const EMOJIS = [
  '😀', '😂', '😍', '🥳', '😎', '🤩', '😴', '🤔',
  '😢', '😡', '😱', '🙄', '😇', '🤗', '🤝', '👏',
  '👍', '👎', '🙏', '💪', '✌️', '🤟', '👋', '🔥',
  '❤️', '💯', '⭐', '🎉', '🎁', '🎶', '☕', '💤'
];

export function EmojiPickerModal({ visible, onClose, onSelectEmoji }) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          <Text style={[styles.title, { color: theme.text.primary }]}>Emoji</Text>
          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {EMOJIS.map(emoji => (
              <Pressable
                key={emoji}
                onPress={() => onSelectEmoji(emoji)}
                style={styles.emojiButton}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end'
  },
  sheet: {
    borderTopLeftRadius: scaleModerate(24),
    borderTopRightRadius: scaleModerate(24),
    borderWidth: 1,
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(10),
    paddingBottom: scaleModerate(24),
    maxHeight: scaleModerate(340)
  },
  handle: {
    alignSelf: 'center',
    width: scaleModerate(36),
    height: scaleModerate(4),
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginBottom: scaleModerate(10)
  },
  title: {
    fontSize: scaleFont(14),
    fontWeight: '800',
    marginBottom: scaleModerate(10)
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  emojiButton: {
    width: '12.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emojiText: {
    fontSize: scaleFont(24)
  }
});

export default EmojiPickerModal;
