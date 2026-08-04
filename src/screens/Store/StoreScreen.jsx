import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { AssetPreview, Screen, showAlert } from '../../components';
import { equipProp, fetchMyProps, fetchStoreCatalog, purchaseStoreAsset, unequipProp } from '../../api';
import { getSessionSocket } from '../../services/socket';
import { useAppStore } from '../../store';
import { scaleFont, scaleModerate } from '../../utils';

const CATEGORIES = [
  { key: 'FRAMES', label: '🖼️ Frames' },
  { key: 'ENTRANCES', label: '🚪 Entrances' },
  { key: 'RIDES', label: '🏎️ Rides' },
  { key: 'TAIL_LIGHTS', label: '🚗 Tail Lights' },
  { key: 'BADGES', label: '🎖️ Badges' },
  { key: 'CHAT_BOXES', label: '💬 Chat Boxes' },
  { key: 'ROOM_BACKGROUNDS', label: '🖼️ Room BGs' }
];

function CategoryChip({ category, active, onPress }) {
  const theme = useTheme();
  return <Pressable onPress={onPress} style={[styles.categoryChip, {
      backgroundColor: active ? theme.colors.teal700 : theme.surfaces.card,
      borderColor: active ? theme.colors.teal700 : theme.colors.cardBorder
    }]}>
      <Text style={[styles.categoryChipText, { color: active ? theme.cta.primary.text : theme.text.secondary }]}>{category.label}</Text>
    </Pressable>;
}

function StoreAssetCard({ asset, busy, onBuy, onEquip }) {
  const theme = useTheme();
  return <View style={[styles.assetCard, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
      <View style={[styles.assetImageWrap, { backgroundColor: theme.state.soft, borderColor: theme.colors.cardBorder }]}>
        <AssetPreview uri={asset.url} mimeType={asset.mimeType} style={styles.assetImage} fallbackStyle={styles.assetImageFallback} />
      </View>
      <Text style={[styles.assetName, { color: theme.text.primary }]} numberOfLines={1}>{asset.name}</Text>

      {asset.owned ? <Pressable
          disabled={busy || asset.equipped}
          onPress={onEquip}
          style={[styles.assetButton, { backgroundColor: asset.equipped ? theme.colors.cardBorder : theme.colors.teal700 }]}
        >
          <Text style={[styles.assetButtonText, { color: asset.equipped ? theme.text.secondary : theme.cta.primary.text }]}>
            {asset.equipped ? 'Equipped' : 'Equip'}
          </Text>
        </Pressable> : asset.canPurchase ? <Pressable disabled={busy} onPress={onBuy} style={[styles.assetButton, { backgroundColor: theme.colors.followOrange }]}>
          <Text style={styles.assetButtonText}>{busy ? '…' : `Buy — ${asset.price}`}</Text>
        </Pressable> : <View style={[styles.assetButton, { backgroundColor: theme.colors.cardBorder }]}>
          <Text style={[styles.assetButtonText, { color: theme.text.secondary }]} numberOfLines={1}>{asset.lockedReason ?? 'Locked'}</Text>
        </View>}
    </View>;
}

function MyPropRow({ prop, busy, onEquip, onRemove }) {
  const theme = useTheme();
  return <View style={[styles.propRow, { borderColor: theme.colors.cardBorder }]}>
      <View style={[styles.propImageWrap, { backgroundColor: theme.state.soft, borderColor: theme.colors.cardBorder }]}>
        <AssetPreview uri={prop.url} mimeType={prop.mimeType} style={styles.propImage} fallbackStyle={styles.propImageFallback} fallbackEmoji={prop.mimeType?.startsWith('video/') ? '🎬' : '🖼️'} interactive={false} />
      </View>
      <View style={styles.propBody}>
        <Text style={[styles.propName, { color: theme.text.primary }]} numberOfLines={1}>{prop.name}</Text>
        <Text style={[styles.propMeta, { color: theme.text.secondary }]}>{prop.category} · {prop.source}{prop.expiresAt ? ` · expires ${new Date(prop.expiresAt).toLocaleDateString()}` : ''}</Text>
      </View>
      <Pressable disabled={busy} onPress={prop.equipped ? onRemove : onEquip} style={[styles.propButton, {
        backgroundColor: prop.equipped ? theme.colors.cardBorder : theme.colors.teal700
      }]}>
        <Text style={[styles.propButtonText, { color: prop.equipped ? theme.text.secondary : theme.cta.primary.text }]}>
          {prop.equipped ? 'Remove' : 'Equip'}
        </Text>
      </Pressable>
    </View>;
}

export function StoreScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const sessionToken = useAppStore(state => state.session?.token);
  const [tab, setTab] = React.useState('store');
  const [category, setCategory] = React.useState('FRAMES');
  const [catalog, setCatalog] = React.useState(null);
  const [myProps, setMyProps] = React.useState({ props: [], equipped: {} });
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState(null);

  // Read via a ref (not a dependency) so switching categories doesn't
  // change this function's identity — it used to include `category`
  // directly, which made useFocusEffect below re-run (and flip
  // `loading` back to true) on every category tap, unmounting and
  // remounting both FlatLists and resetting their scroll position back
  // to the start. Category switches are handled by their own lightweight
  // effect further down instead, which only updates `catalog` in place.
  const categoryRef = React.useRef(category);
  React.useEffect(() => {
    categoryRef.current = category;
  }, [category]);

  const reload = React.useCallback(async () => {
    if (!sessionToken) {
      return;
    }
    const [storeData, propsData] = await Promise.all([
      fetchStoreCatalog(sessionToken, categoryRef.current),
      fetchMyProps(sessionToken)
    ]);
    setCatalog(storeData);
    setMyProps(propsData);
    setLoading(false);
  }, [sessionToken]);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      setLoading(true);
      reload().catch(() => setLoading(false));
      const socket = getSessionSocket();
      const handleUpdate = () => {
        if (!cancelled) {
          reload().catch(() => {});
        }
      };
      socket?.on('props:granted', handleUpdate);
      socket?.on('props:updated', handleUpdate);
      return () => {
        cancelled = true;
        socket?.off('props:granted', handleUpdate);
        socket?.off('props:updated', handleUpdate);
      };
    }, [reload])
  );

  // Category switch — refetches just the catalog for the new category
  // without touching `loading`, so the category chips and asset grid
  // stay mounted (and keep their scroll position) instead of being torn
  // down by the full-screen spinner. Skips its very first run since the
  // useFocusEffect above already covers the initial load.
  const isFirstCategoryRunRef = React.useRef(true);
  React.useEffect(() => {
    if (isFirstCategoryRunRef.current) {
      isFirstCategoryRunRef.current = false;
      return undefined;
    }
    if (!sessionToken) {
      return undefined;
    }
    let cancelled = false;
    fetchStoreCatalog(sessionToken, category).then(storeData => {
      if (!cancelled) {
        setCatalog(storeData);
      }
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionToken, category]);

  const handleBuy = async asset => {
    setBusyId(asset.id);
    try {
      await purchaseStoreAsset(sessionToken, asset.id);
      await reload();
    } catch (error) {
      showAlert('Purchase Failed', error?.message || 'Unable to buy this item. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleEquip = async asset => {
    setBusyId(asset.id);
    try {
      await equipProp(sessionToken, asset.id);
      await reload();
    } catch (error) {
      showAlert('Equip Failed', error?.response?.data?.error?.message || 'Unable to equip this item. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async prop => {
    setBusyId(prop.id);
    try {
      await unequipProp(sessionToken, prop.category);
      await reload();
    } catch (error) {
      showAlert('Remove Failed', error?.response?.data?.error?.message || 'Unable to remove this item. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  return <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Store</Text>
        <View style={styles.headerSpacer} />
      </View>

      {catalog ? <View style={[styles.balanceCard, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
          <Text style={[styles.balanceLabel, { color: theme.text.secondary }]}>💰 Balance</Text>
          <Text style={[styles.balanceValue, { color: theme.text.primary }]}>{Number(catalog.balance).toLocaleString()} Coins</Text>
        </View> : null}

      <View style={styles.tabRow}>
        <Pressable onPress={() => setTab('store')} style={[styles.tab, tab === 'store' && { borderBottomColor: theme.colors.teal700, borderBottomWidth: 2 }]}>
          <Text style={[styles.tabText, { color: tab === 'store' ? theme.colors.teal700 : theme.text.secondary }]}>Store</Text>
        </Pressable>
        <Pressable onPress={() => setTab('mine')} style={[styles.tab, tab === 'mine' && { borderBottomColor: theme.colors.teal700, borderBottomWidth: 2 }]}>
          <Text style={[styles.tabText, { color: tab === 'mine' ? theme.colors.teal700 : theme.text.secondary }]}>My Props</Text>
        </Pressable>
      </View>

      {loading ? <ActivityIndicator style={styles.loader} color={theme.colors.teal700} /> : tab === 'store' ? <>
          <FlatList
            horizontal
            style={styles.categoryList}
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={item => item.key}
            contentContainerStyle={styles.categoryRow}
            renderItem={({ item }) => <CategoryChip category={item} active={item.key === category} onPress={() => setCategory(item.key)} />}
          />
          <FlatList
            data={catalog?.assets ?? []}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.assetRow}
            contentContainerStyle={styles.assetList}
            renderItem={({ item }) => <StoreAssetCard asset={item} busy={busyId === item.id} onBuy={() => handleBuy(item)} onEquip={() => handleEquip(item)} />}
            ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.text.secondary }]}>No items in this category yet.</Text>}
          />
        </> : <FlatList
          data={myProps.props}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.propList}
          renderItem={({ item }) => <MyPropRow prop={item} busy={busyId === item.id} onEquip={() => handleEquip(item)} onRemove={() => handleRemove(item)} />}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.text.secondary }]}>You don't own any props yet.</Text>}
        />}
    </Screen>;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(14),
    paddingBottom: scaleModerate(6)
  },
  backChevron: {
    fontSize: scaleFont(28),
    fontWeight: '700'
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: '800'
  },
  headerSpacer: {
    width: scaleModerate(20)
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: scaleModerate(16),
    marginBottom: scaleModerate(10),
    borderRadius: scaleModerate(14),
    borderWidth: 1,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(10)
  },
  balanceLabel: {
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  balanceValue: {
    fontSize: scaleFont(15),
    fontWeight: '800'
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: scaleModerate(16),
    gap: scaleModerate(20)
  },
  tab: {
    paddingBottom: scaleModerate(10)
  },
  tabText: {
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  loader: {
    marginTop: scaleModerate(24)
  },
  categoryList: {
    flexGrow: 0,
    flexShrink: 0
  },
  categoryRow: {
    alignItems: 'center',
    paddingHorizontal: scaleModerate(16),
    paddingVertical: scaleModerate(12),
    gap: scaleModerate(8)
  },
  categoryChip: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(8)
  },
  categoryChipText: {
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  assetList: {
    paddingHorizontal: scaleModerate(16),
    paddingBottom: scaleModerate(28)
  },
  assetRow: {
    gap: scaleModerate(12)
  },
  assetCard: {
    flex: 1,
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    padding: scaleModerate(10),
    marginBottom: scaleModerate(12)
  },
  assetImageWrap: {
    height: scaleModerate(120),
    borderWidth: 1,
    borderRadius: scaleModerate(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleModerate(8),
    overflow: 'hidden'
  },
  assetImage: {
    width: '100%',
    height: '100%'
  },
  assetImageFallback: {
    fontSize: scaleFont(32)
  },
  assetName: {
    fontSize: scaleFont(13),
    fontWeight: '700',
    marginBottom: scaleModerate(8)
  },
  assetButton: {
    borderRadius: 999,
    paddingVertical: scaleModerate(8),
    alignItems: 'center'
  },
  assetButtonText: {
    color: '#FFFFFF',
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  propList: {
    paddingHorizontal: scaleModerate(16),
    paddingBottom: scaleModerate(28)
  },
  propRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: scaleModerate(10)
  },
  propImageWrap: {
    width: scaleModerate(48),
    height: scaleModerate(48),
    borderWidth: 1,
    borderRadius: scaleModerate(10),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  propImage: {
    width: '100%',
    height: '100%'
  },
  propImageFallback: {
    fontSize: scaleFont(18)
  },
  propBody: {
    flex: 1,
    gap: scaleModerate(2)
  },
  propName: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  },
  propMeta: {
    fontSize: scaleFont(11)
  },
  propButton: {
    borderRadius: 999,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(8)
  },
  propButtonText: {
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: scaleModerate(32),
    fontSize: scaleFont(13)
  }
});

export default StoreScreen;
