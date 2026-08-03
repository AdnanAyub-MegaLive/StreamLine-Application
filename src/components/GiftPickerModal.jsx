import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { fetchGiftCatalog } from '../api';
import { AssetPreview } from './AssetPreview';
import { scaleFont, scaleModerate } from '../utils';

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 999;

function CategoryChip({ category, active, onPress, theme }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.categoryChip, {
        backgroundColor: active ? theme.colors.teal700 : theme.surfaces.page,
        borderColor: active ? theme.colors.teal700 : theme.colors.cardBorder
      }]}
    >
      <Text style={[styles.categoryChipText, { color: active ? theme.cta.primary.text : theme.text.secondary }]}>{category.name}</Text>
    </Pressable>
  );
}

function GiftTile({ gift, onPress, theme }) {
  return (
    <Pressable onPress={onPress} style={[styles.tile, { backgroundColor: theme.surfaces.page, borderColor: theme.colors.cardBorder }]}>
      <View style={[styles.tileMediaWrap, { backgroundColor: theme.state.soft }]}>
        <AssetPreview uri={gift.mediaUrl} mimeType={gift.mimeType} style={styles.tileMedia} fallbackStyle={styles.tileFallback} interactive={false} />
      </View>
      <Text style={[styles.tileName, { color: theme.text.primary }]} numberOfLines={1}>{gift.name}</Text>
      <Text style={[styles.tilePrice, { color: theme.colors.vipGoldText }]}>🪙 {gift.coinPrice}</Text>
    </Pressable>
  );
}

// Two steps: pick a gift from the real backend catalog (grouped into
// Classic/Premium/VIP tabs), then choose a quantity (1-999) and confirm —
// see StreamLine-Portal/docs/gift-profit-rules-api.md, which explicitly
// calls for "explicit confirmation" rather than a tap-to-send-instantly
// flow, since the backend authoritatively prices coinPrice × quantity.
export function GiftPickerModal({ visible, onClose, onConfirmSend, recipientName, sending, sessionToken }) {
  const theme = useTheme();
  const [categories, setCategories] = React.useState([]);
  const [activeCategoryId, setActiveCategoryId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);
  const [selectedGift, setSelectedGift] = React.useState(null);
  const [quantity, setQuantity] = React.useState(1);

  React.useEffect(() => {
    if (!visible) {
      setSelectedGift(null);
      setQuantity(1);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    fetchGiftCatalog(sessionToken).then(data => {
      if (cancelled) {
        return;
      }
      const nonEmpty = data.categories.filter(category => category.gifts.length > 0);
      setCategories(nonEmpty);
      setActiveCategoryId(nonEmpty[0]?.id ?? null);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setLoadError(true);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [visible, sessionToken]);

  const activeCategory = categories.find(category => category.id === activeCategoryId);
  const totalCoins = selectedGift ? Number(selectedGift.coinPrice) * quantity : 0;

  const adjustQuantity = delta => {
    setQuantity(current => Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, current + delta)));
  };

  const handleClose = () => {
    if (sending) {
      return;
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
          onPress={() => {}}
        >
          {selectedGift ? (
            <>
              <Text style={[styles.title, { color: theme.text.primary }]}>{selectedGift.name}</Text>
              {recipientName ? <Text style={[styles.subtitle, { color: theme.text.secondary }]}>to {recipientName}</Text> : null}

              <View style={[styles.previewWrap, { backgroundColor: theme.state.soft }]}>
                <AssetPreview uri={selectedGift.mediaUrl} mimeType={selectedGift.mimeType} style={styles.previewMedia} fallbackStyle={styles.previewFallback} interactive={false} />
              </View>

              <View style={styles.quantityRow}>
                <Pressable disabled={sending} onPress={() => adjustQuantity(-1)} style={[styles.quantityButton, { borderColor: theme.colors.cardBorder }]}>
                  <Text style={[styles.quantityButtonText, { color: theme.text.primary }]}>−</Text>
                </Pressable>
                <Text style={[styles.quantityValue, { color: theme.text.primary }]}>{quantity}</Text>
                <Pressable disabled={sending} onPress={() => adjustQuantity(1)} style={[styles.quantityButton, { borderColor: theme.colors.cardBorder }]}>
                  <Text style={[styles.quantityButtonText, { color: theme.text.primary }]}>+</Text>
                </Pressable>
              </View>

              <Text style={[styles.totalText, { color: theme.colors.vipGoldText }]}>🪙 {totalCoins} total</Text>

              <Pressable
                disabled={sending}
                onPress={() => onConfirmSend(selectedGift, quantity)}
                style={[styles.confirmButton, { backgroundColor: theme.colors.teal700, opacity: sending ? 0.7 : 1 }]}
              >
                {sending ? <ActivityIndicator color={theme.cta.primary.text} /> : <Text style={[styles.confirmText, { color: theme.cta.primary.text }]}>Send Gift</Text>}
              </Pressable>

              <Pressable disabled={sending} onPress={() => setSelectedGift(null)} style={styles.cancelButton}>
                <Text style={[styles.cancelText, { color: theme.text.secondary }]}>Back</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: theme.text.primary }]}>Send a Gift</Text>
              {recipientName ? <Text style={[styles.subtitle, { color: theme.text.secondary }]}>to {recipientName}</Text> : null}

              {loading ? (
                <ActivityIndicator style={styles.loader} color={theme.colors.teal700} />
              ) : loadError ? (
                <Text style={[styles.emptyText, { color: theme.text.secondary }]}>Unable to load gifts right now. Please try again.</Text>
              ) : categories.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.text.secondary }]}>No gifts are available right now.</Text>
              ) : (
                <>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                    {categories.map(category => (
                      <CategoryChip key={category.id} category={category} active={category.id === activeCategoryId} onPress={() => setActiveCategoryId(category.id)} theme={theme} />
                    ))}
                  </ScrollView>

                  <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
                    {(activeCategory?.gifts ?? []).map(gift => (
                      <GiftTile key={gift.id} gift={gift} onPress={() => setSelectedGift(gift)} theme={theme} />
                    ))}
                  </ScrollView>
                </>
              )}

              <Pressable onPress={handleClose} style={styles.cancelButton}>
                <Text style={[styles.cancelText, { color: theme.text.secondary }]}>Cancel</Text>
              </Pressable>
            </>
          )}
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
    maxHeight: '75%'
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
  loader: {
    marginTop: scaleModerate(24)
  },
  emptyText: {
    marginTop: scaleModerate(24),
    fontSize: scaleFont(13),
    textAlign: 'center'
  },
  categoryRow: {
    marginTop: scaleModerate(14),
    gap: scaleModerate(8)
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(7)
  },
  categoryChipText: {
    fontSize: scaleFont(12.5),
    fontWeight: '700'
  },
  grid: {
    marginTop: scaleModerate(14),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleModerate(12),
    paddingBottom: scaleModerate(8)
  },
  tile: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'center',
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    padding: scaleModerate(10),
    gap: scaleModerate(4)
  },
  tileMediaWrap: {
    width: scaleModerate(56),
    height: scaleModerate(56),
    borderRadius: scaleModerate(12),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  tileMedia: {
    width: '100%',
    height: '100%'
  },
  tileFallback: {
    fontSize: scaleFont(24)
  },
  tileName: {
    fontSize: scaleFont(12.5),
    fontWeight: '700'
  },
  tilePrice: {
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  previewWrap: {
    alignSelf: 'center',
    marginTop: scaleModerate(16),
    width: scaleModerate(120),
    height: scaleModerate(120),
    borderRadius: scaleModerate(20),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  previewMedia: {
    width: '100%',
    height: '100%'
  },
  previewFallback: {
    fontSize: scaleFont(40)
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleModerate(20),
    marginTop: scaleModerate(18)
  },
  quantityButton: {
    width: scaleModerate(38),
    height: scaleModerate(38),
    borderRadius: scaleModerate(19),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quantityButtonText: {
    fontSize: scaleFont(20),
    fontWeight: '700'
  },
  quantityValue: {
    fontSize: scaleFont(18),
    fontWeight: '800',
    minWidth: scaleModerate(40),
    textAlign: 'center'
  },
  totalText: {
    marginTop: scaleModerate(10),
    fontSize: scaleFont(14),
    fontWeight: '800',
    textAlign: 'center'
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

export default GiftPickerModal;
