import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { scaleFont, scaleModerate } from '../utils';

// The 4 fixed room-size tiers requested: each entry is a list of seat-row
// sizes (e.g. [2, 3] means a 2-seat front row plus a 3-seat second row).
export const SEAT_LAYOUT_OPTIONS = [
  { id: 'layout-2', groups: [2] },
  { id: 'layout-2-3', groups: [2, 3] },
  { id: 'layout-2-3-5-5', groups: [2, 3, 5, 5] },
  { id: 'layout-2-3-5-5-5-5', groups: [2, 3, 5, 5, 5, 5] }
];

function totalSeats(groups) {
  return groups.reduce((sum, count) => sum + count, 0);
}

function LayoutPreview({ groups, color }) {
  return (
    <View style={styles.previewStack}>
      {groups.map((count, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.previewRow}>
          {Array.from({ length: count }).map((_, dotIndex) => (
            <View key={`dot-${rowIndex}-${dotIndex}`} style={[styles.previewDot, { backgroundColor: color }]} />
          ))}
        </View>
      ))}
    </View>
  );
}

function LayoutOption({ option, selected, onSelect, theme }) {
  return (
    <Pressable
      onPress={() => onSelect(option.id)}
      style={[
        styles.optionRow,
        {
          backgroundColor: selected ? theme.state.soft : theme.surfaces.page,
          borderColor: selected ? theme.colors.teal700 : theme.colors.cardBorder
        }
      ]}
    >
      <LayoutPreview groups={option.groups} color={selected ? theme.colors.teal700 : theme.text.mutedIcon} />
      <View style={styles.optionTextWrap}>
        <Text style={[styles.optionTitle, { color: theme.text.primary }]}>{totalSeats(option.groups)} Seats</Text>
        <Text style={[styles.optionSubtitle, { color: theme.text.secondary }]}>{option.groups.join(' + ')}</Text>
      </View>
      <View style={[styles.radioOuter, { borderColor: selected ? theme.colors.teal700 : theme.colors.cardBorder }]}>
        {selected ? <View style={[styles.radioInner, { backgroundColor: theme.colors.teal700 }]} /> : null}
      </View>
    </Pressable>
  );
}

// Second step of the Audio Room creation flow — pick one of the 4 seat
// layouts, then confirm to create the room with that structure.
export function SeatLayoutModal({ visible, onClose, onConfirm }) {
  const theme = useTheme();
  const [selectedId, setSelectedId] = React.useState(SEAT_LAYOUT_OPTIONS[0].id);

  const handleConfirm = () => {
    const option = SEAT_LAYOUT_OPTIONS.find(item => item.id === selectedId);
    if (option) {
      onConfirm(option.groups);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
          onPress={() => {}}
        >
          <Text style={[styles.title, { color: theme.text.primary }]}>Choose Room Size</Text>
          <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
            Select how many seats this audio room should have.
          </Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {SEAT_LAYOUT_OPTIONS.map(option => (
              <LayoutOption
                key={option.id}
                option={option}
                selected={option.id === selectedId}
                onSelect={setSelectedId}
                theme={theme}
              />
            ))}
          </ScrollView>

          <Pressable onPress={handleConfirm} style={[styles.confirmButton, { backgroundColor: theme.cta.primary.background }]}>
            <Text style={[styles.confirmText, { color: theme.cta.primary.text }]}>Create Room</Text>
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
    justifyContent: 'flex-end'
  },
  sheet: {
    borderTopLeftRadius: scaleModerate(28),
    borderTopRightRadius: scaleModerate(28),
    borderWidth: 1,
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(20),
    paddingBottom: scaleModerate(28),
    maxHeight: '80%'
  },
  title: {
    fontSize: scaleFont(18),
    fontWeight: '800',
    textAlign: 'center'
  },
  subtitle: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(12),
    textAlign: 'center'
  },
  list: {
    marginTop: scaleModerate(16)
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scaleModerate(16),
    borderWidth: 1.5,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(12),
    marginBottom: scaleModerate(10),
    gap: scaleModerate(12)
  },
  previewStack: {
    gap: scaleModerate(3),
    minWidth: scaleModerate(56)
  },
  previewRow: {
    flexDirection: 'row',
    gap: scaleModerate(3)
  },
  previewDot: {
    width: scaleModerate(7),
    height: scaleModerate(7),
    borderRadius: scaleModerate(4)
  },
  optionTextWrap: {
    flex: 1
  },
  optionTitle: {
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  optionSubtitle: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(11)
  },
  radioOuter: {
    width: scaleModerate(20),
    height: scaleModerate(20),
    borderRadius: scaleModerate(10),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioInner: {
    width: scaleModerate(10),
    height: scaleModerate(10),
    borderRadius: scaleModerate(5)
  },
  confirmButton: {
    marginTop: scaleModerate(16),
    height: scaleModerate(48),
    borderRadius: scaleModerate(24),
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmText: {
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  cancelButton: {
    marginTop: scaleModerate(10),
    alignItems: 'center',
    paddingVertical: scaleModerate(8)
  },
  cancelText: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  }
});

export default SeatLayoutModal;
