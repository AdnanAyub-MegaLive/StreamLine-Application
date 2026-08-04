import React from 'react';
import { ActivityIndicator, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { AgencyJoinError, fetchMyAgencyDashboard, removeAgencyHost, respondToAgencyJoinRequest, setAgencyMonthlyTarget } from '../../api';
import { Avatar, Screen, showAlert } from '../../components';
import { getSessionSocket } from '../../services/socket';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { scaleFont, scaleModerate } from '../../utils';

const PAGE_WIDTH = Dimensions.get('window').width;

const DASHBOARD_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'hosts', label: 'Hosts' },
  { id: 'requests', label: 'Requests' }
];

function HeroCard({ agency, theme }) {
  return <LinearGradient
      colors={[theme.colors.teal700, theme.colors.tertiary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.heroAvatar}>
        <Text style={styles.heroAvatarText}>{(agency.name || '?').trim().slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.heroBody}>
        <Text style={styles.heroName} numberOfLines={1}>{agency.name}</Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroId}>ID: {agency.id}</Text>
          <View style={styles.heroStatusPill}>
            <Text style={styles.heroStatusText}>{agency.status ?? 'ACTIVE'}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>;
}

function TabBar({ activeTab, onSelectTab, requestCount, theme }) {
  return <View style={[styles.tabBar, { borderBottomColor: theme.colors.cardBorder }]}>
      {DASHBOARD_TABS.map(tab => {
        const active = tab.id === activeTab;
        return <Pressable key={tab.id} onPress={() => onSelectTab(tab.id)} style={styles.tabItem}>
            <View style={styles.tabLabelRow}>
              <Text style={[styles.tabLabel, { color: active ? theme.colors.teal700 : theme.text.secondary }, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {tab.id === 'requests' && requestCount ? <View style={[styles.tabBadge, { backgroundColor: theme.colors.liveBadge }]}>
                  <Text style={styles.tabBadgeText}>{requestCount}</Text>
                </View> : null}
            </View>
            {active ? <View style={[styles.tabIndicator, { backgroundColor: theme.colors.teal700 }]} /> : null}
          </Pressable>;
      })}
    </View>;
}

function StatCard({ icon, label, value, theme, onPress }) {
  const Wrapper = onPress ? Pressable : View;
  return <Wrapper onPress={onPress} style={[styles.statCard, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: theme.text.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.text.secondary }]}>{label}{onPress ? '  ✎' : ''}</Text>
    </Wrapper>;
}

// Collapsed by default — a quick-glance panel (status/created date), not
// something that needs to compete with the stats for space.
function AgencyInfoPanel({ agency, theme }) {
  const [open, setOpen] = React.useState(false);
  return <View style={[styles.infoPanel, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
      <Pressable onPress={() => setOpen(current => !current)} style={styles.infoPanelHeader}>
        <Text style={[styles.infoPanelTitle, { color: theme.text.primary }]}>Agency Information</Text>
        <Text style={[styles.infoPanelChevron, { color: theme.text.secondary }]}>{open ? '︿' : '﹀'}</Text>
      </Pressable>
      {open ? <View style={styles.infoPanelBody}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.text.secondary }]}>Agency ID</Text>
            <Text style={[styles.infoValue, { color: theme.text.primary }]}>{agency.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.text.secondary }]}>Status</Text>
            <Text style={[styles.infoValue, { color: theme.text.primary }]}>{agency.status ?? 'ACTIVE'}</Text>
          </View>
          {agency.createdAt ? <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.text.secondary }]}>Created</Text>
              <Text style={[styles.infoValue, { color: theme.text.primary }]}>{new Date(agency.createdAt).toLocaleDateString()}</Text>
            </View> : null}
        </View> : null}
    </View>;
}

function HostRow({ host, theme, busy, onRemove }) {
  return <View style={[styles.hostRow, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
      <Avatar value={host.profileImage} fullName={host.name} size={scaleModerate(38)} />
      <View style={styles.hostBody}>
        <Text style={[styles.hostName, { color: theme.text.primary }]} numberOfLines={1}>{host.name}</Text>
        <Text style={[styles.hostMeta, { color: theme.text.secondary }]} numberOfLines={1}>ID: {host.id}</Text>
      </View>
      <Text style={[styles.hostSalary, { color: theme.colors.vipGoldText }]}>🪙 {host.salaryCoinBalance ?? 0}</Text>
      <Pressable disabled={busy} onPress={() => onRemove(host)} hitSlop={8} style={styles.removeButton}>
        {busy ? <ActivityIndicator size="small" color={theme.colors.liveBadge} /> : <Text style={[styles.removeButtonText, { color: theme.colors.liveBadge }]}>✕</Text>}
      </Pressable>
    </View>;
}

function JoinRequestRow({ request, busy, onRespond, theme }) {
  return <View style={[styles.requestRow, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
      <Avatar value={request.userProfileImage} fullName={request.userName} size={scaleModerate(38)} />
      <View style={styles.hostBody}>
        <Text style={[styles.hostName, { color: theme.text.primary }]} numberOfLines={1}>{request.userName}</Text>
        <Text style={[styles.hostMeta, { color: theme.text.secondary }]} numberOfLines={1}>ID: {request.userId}</Text>
      </View>
      <View style={styles.requestActions}>
        <Pressable disabled={busy} onPress={() => onRespond(request, false)} style={[styles.requestButton, { backgroundColor: theme.colors.cardBorder }]}>
          <Text style={[styles.requestButtonText, { color: theme.text.secondary }]}>Reject</Text>
        </Pressable>
        <Pressable disabled={busy} onPress={() => onRespond(request, true)} style={[styles.requestButton, { backgroundColor: theme.colors.teal700 }]}>
          {busy ? <ActivityIndicator size="small" color={theme.cta.primary.text} /> : <Text style={[styles.requestButtonText, { color: theme.cta.primary.text }]}>Accept</Text>}
        </Pressable>
      </View>
    </View>;
}

function EditTargetModal({ visible, initialValue, onClose, onConfirm }) {
  const theme = useTheme();
  const [value, setValue] = React.useState(String(initialValue ?? 0));

  React.useEffect(() => {
    if (visible) {
      setValue(String(initialValue ?? 0));
    }
  }, [visible, initialValue]);

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]} onPress={() => {}}>
          <Text style={[styles.modalTitle, { color: theme.text.primary }]}>Monthly Target</Text>
          <TextInput
            value={value}
            onChangeText={text => setValue(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="Coins"
            placeholderTextColor={theme.text.mutedIcon}
            autoFocus
            style={[styles.modalInput, { color: theme.text.primary, borderColor: theme.colors.cardBorder }]}
          />
          <Pressable onPress={() => onConfirm(Number(value) || 0)} style={[styles.modalConfirm, { backgroundColor: theme.cta.primary.background }]}>
            <Text style={[styles.modalConfirmText, { color: theme.cta.primary.text }]}>Save</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.modalCancel}>
            <Text style={[styles.modalCancelText, { color: theme.text.secondary }]}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>;
}

// Shown once a user actually owns an approved agency — reached from either
// CreateAgencyScreen or JoinAgencyScreen's "Approved" state. See
// docs/agency-dashboard-api-spec.md for GET /api/agencies/mine and the
// join-request respond endpoint, and
// docs/agency-dashboard-extended-spec.md for the monthly target, monthly
// salary, total recharge, total gifting fields and the host-removal
// endpoint used below. Organized into Overview / Hosts / Requests tabs so
// the stats, host list, and join requests don't all compete for space in
// one long scroll.
export function AgencyDashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const sessionToken = useAppStore(state => state.session?.token);
  const [agency, setAgency] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('overview');
  const scrollRef = React.useRef(null);
  const [respondingId, setRespondingId] = React.useState(null);
  const [removingHostId, setRemovingHostId] = React.useState(null);
  const [hostQuery, setHostQuery] = React.useState('');
  const [targetModalVisible, setTargetModalVisible] = React.useState(false);
  const [savingTarget, setSavingTarget] = React.useState(false);

  const reload = React.useCallback(async () => {
    if (!sessionToken) {
      return;
    }
    const data = await fetchMyAgencyDashboard(sessionToken);
    setAgency(data);
    setLoading(false);
  }, [sessionToken]);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      reload();
    }, [reload])
  );

  // Real-time instead of polling — see
  // docs/agency-dashboard-extended-spec.md's "push a socket event when a
  // join request is created" section. Only listens while this screen is
  // focused; a request that arrives while the owner is elsewhere is just
  // picked up by the useFocusEffect reload above when they come back.
  useFocusEffect(
    React.useCallback(() => {
      const socket = getSessionSocket();
      const handleJoinRequested = () => reload();
      socket?.on('agency:join-requested', handleJoinRequested);
      return () => socket?.off('agency:join-requested', handleJoinRequested);
    }, [reload])
  );

  const handleRespond = (request, accept) => {
    setRespondingId(request.id);
    respondToAgencyJoinRequest(sessionToken, request.id, accept)
      .then(() => reload())
      .catch(error => {
        showAlert('Unable to Respond', error instanceof AgencyJoinError ? error.message : 'Something went wrong. Please try again.');
      })
      .finally(() => setRespondingId(null));
  };

  const handleRemoveHost = host => {
    showAlert('Remove Host', `Remove ${host.name} from your agency?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setRemovingHostId(host.id);
          removeAgencyHost(sessionToken, host.id)
            .then(() => reload())
            .catch(error => {
              showAlert('Unable to Remove', error instanceof AgencyJoinError ? error.message : 'Something went wrong. Please try again.');
            })
            .finally(() => setRemovingHostId(null));
        }
      }
    ]);
  };

  const handleSaveTarget = targetCoins => {
    setSavingTarget(true);
    setAgencyMonthlyTarget(sessionToken, targetCoins)
      .then(() => {
        setTargetModalVisible(false);
        reload();
      })
      .catch(error => {
        showAlert('Unable to Save', error instanceof AgencyJoinError ? error.message : 'Something went wrong. Please try again.');
      })
      .finally(() => setSavingTarget(false));
  };

  const handleSelectTab = tabId => {
    const index = DASHBOARD_TABS.findIndex(tab => tab.id === tabId);
    setActiveTab(tabId);
    scrollRef.current?.scrollTo({ x: index * PAGE_WIDTH, animated: true });
  };

  const handleMomentumScrollEnd = event => {
    const index = Math.round(event.nativeEvent.contentOffset.x / PAGE_WIDTH);
    setActiveTab(DASHBOARD_TABS[index]?.id ?? DASHBOARD_TABS[0].id);
  };

  const trimmedHostQuery = hostQuery.trim().toLowerCase();
  const filteredHosts = agency?.hosts?.filter(host =>
    !trimmedHostQuery || host.name.toLowerCase().includes(trimmedHostQuery) || host.id.toLowerCase().includes(trimmedHostQuery)
  ) ?? [];
  const requestCount = agency?.pendingJoinRequests?.length ?? 0;

  return <Screen>
      <EditTargetModal
        visible={targetModalVisible}
        initialValue={agency?.monthlyTargetCoins}
        onClose={() => !savingTarget && setTargetModalVisible(false)}
        onConfirm={handleSaveTarget}
      />
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text.primary }]}>Agency Dashboard</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.teal700} />
      ) : !agency ? (
        <Text style={[styles.emptyText, { color: theme.text.secondary }]}>Unable to load your agency right now. Please try again.</Text>
      ) : (
        <>
          <View style={styles.heroWrap}>
            <HeroCard agency={agency} theme={theme} />
          </View>

          <TabBar activeTab={activeTab} onSelectTab={handleSelectTab} requestCount={requestCount} theme={theme} />

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumScrollEnd}
          >
            <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.statsGrid}>
                <StatCard icon="🪙" label="Commission" value={agency.commissionCoinBalance ?? 0} theme={theme} />
                <StatCard icon="👥" label="Hosts" value={agency.hosts?.length ?? 0} theme={theme} />
                <StatCard icon="🎯" label="Monthly Target" value={agency.monthlyTargetCoins ?? 0} theme={theme} onPress={() => setTargetModalVisible(true)} />
                <StatCard icon="💰" label="Monthly Salary" value={agency.monthlySalaryCoins ?? 0} theme={theme} />
                <StatCard icon="⚡" label="Total Recharge" value={agency.totalRechargeCoins ?? 0} theme={theme} />
                <StatCard icon="🎁" label="Total Gifting" value={agency.totalGiftingCoins ?? 0} theme={theme} />
              </View>

              <AgencyInfoPanel agency={agency} theme={theme} />
            </ScrollView>

            <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <TextInput
                value={hostQuery}
                onChangeText={setHostQuery}
                placeholder="Search hosts by name or ID"
                placeholderTextColor={theme.text.mutedIcon}
                style={[styles.searchInput, { color: theme.text.primary, backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
              />
              <View style={styles.list}>
                {filteredHosts.length ? filteredHosts.map(host => (
                  <HostRow key={host.id} host={host} theme={theme} busy={removingHostId === host.id} onRemove={handleRemoveHost} />
                )) : (
                  <Text style={[styles.emptyText, { color: theme.text.secondary }]}>
                    {trimmedHostQuery ? 'No hosts match that search.' : 'No hosts under this agency yet.'}
                  </Text>
                )}
              </View>
            </ScrollView>

            <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.list}>
                {requestCount ? agency.pendingJoinRequests.map(request => (
                  <JoinRequestRow key={request.id} request={request} busy={respondingId === request.id} onRespond={handleRespond} theme={theme} />
                )) : (
                  <Text style={[styles.emptyText, { color: theme.text.secondary }]}>No pending join requests.</Text>
                )}
              </View>
            </ScrollView>
          </ScrollView>
        </>
      )}
    </Screen>;
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(14),
    paddingBottom: scaleModerate(10)
  },
  backChevron: {
    fontSize: scaleFont(28),
    fontWeight: '700'
  },
  headerSpacer: {
    width: scaleModerate(20)
  },
  title: {
    fontSize: scaleFont(18),
    fontWeight: '800'
  },
  loader: {
    marginTop: scaleModerate(40)
  },
  emptyText: {
    marginTop: scaleModerate(24),
    paddingHorizontal: scaleModerate(24),
    fontSize: scaleFont(13),
    textAlign: 'center'
  },
  heroWrap: {
    paddingHorizontal: scaleModerate(16)
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(14),
    borderRadius: scaleModerate(22),
    padding: scaleModerate(18)
  },
  heroAvatar: {
    width: scaleModerate(54),
    height: scaleModerate(54),
    borderRadius: scaleModerate(27),
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroAvatarText: {
    color: '#FFFFFF',
    fontSize: scaleFont(22),
    fontWeight: '800'
  },
  heroBody: {
    flex: 1,
    gap: scaleModerate(6)
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: scaleFont(18),
    fontWeight: '800'
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(8)
  },
  heroId: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: scaleFont(11.5)
  },
  heroStatusPill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    paddingHorizontal: scaleModerate(8),
    paddingVertical: scaleModerate(2)
  },
  heroStatusText: {
    color: '#FFFFFF',
    fontSize: scaleFont(10),
    fontWeight: '800'
  },
  tabBar: {
    flexDirection: 'row',
    gap: scaleModerate(22),
    marginTop: scaleModerate(16),
    paddingHorizontal: scaleModerate(16),
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  tabItem: {
    alignItems: 'center',
    paddingBottom: scaleModerate(10)
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(6)
  },
  tabLabel: {
    fontSize: scaleFont(14),
    fontWeight: '600'
  },
  tabLabelActive: {
    fontWeight: '800'
  },
  tabBadge: {
    minWidth: scaleModerate(17),
    height: scaleModerate(17),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(4)
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: scaleFont(9.5),
    fontWeight: '800'
  },
  tabIndicator: {
    marginTop: scaleModerate(6),
    height: scaleModerate(2.5),
    width: '100%',
    borderRadius: 999
  },
  page: {
    width: PAGE_WIDTH
  },
  content: {
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(16),
    paddingBottom: scaleModerate(28)
  },
  infoPanel: {
    marginTop: scaleModerate(16),
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    overflow: 'hidden'
  },
  infoPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scaleModerate(14)
  },
  infoPanelTitle: {
    fontSize: scaleFont(13.5),
    fontWeight: '700'
  },
  infoPanelChevron: {
    fontSize: scaleFont(12)
  },
  infoPanelBody: {
    paddingHorizontal: scaleModerate(14),
    paddingBottom: scaleModerate(14),
    gap: scaleModerate(8)
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  infoLabel: {
    fontSize: scaleFont(12)
  },
  infoValue: {
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scaleModerate(12)
  },
  statCard: {
    flexBasis: '31%',
    flexGrow: 1,
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    padding: scaleModerate(12),
    alignItems: 'center'
  },
  statIcon: {
    fontSize: scaleFont(18),
    marginBottom: scaleModerate(2)
  },
  statValue: {
    fontSize: scaleFont(14),
    fontWeight: '800'
  },
  statLabel: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(10.5),
    textAlign: 'center'
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: scaleModerate(12),
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(10),
    fontSize: scaleFont(13),
    marginBottom: scaleModerate(12)
  },
  list: {
    gap: scaleModerate(10)
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(10),
    borderRadius: scaleModerate(14),
    borderWidth: 1,
    padding: scaleModerate(12)
  },
  hostBody: {
    flex: 1,
    gap: scaleModerate(2)
  },
  hostName: {
    fontSize: scaleFont(13.5),
    fontWeight: '700'
  },
  hostMeta: {
    fontSize: scaleFont(11)
  },
  hostSalary: {
    fontSize: scaleFont(12.5),
    fontWeight: '700'
  },
  removeButton: {
    width: scaleModerate(26),
    height: scaleModerate(26),
    alignItems: 'center',
    justifyContent: 'center'
  },
  removeButtonText: {
    fontSize: scaleFont(15),
    fontWeight: '800'
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scaleModerate(14),
    borderWidth: 1,
    padding: scaleModerate(12),
    gap: scaleModerate(10)
  },
  requestActions: {
    flexDirection: 'row',
    gap: scaleModerate(8)
  },
  requestButton: {
    minWidth: scaleModerate(64),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(8)
  },
  requestButtonText: {
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(24)
  },
  modalSheet: {
    width: '100%',
    borderRadius: scaleModerate(20),
    borderWidth: 1,
    padding: scaleModerate(20)
  },
  modalTitle: {
    fontSize: scaleFont(16),
    fontWeight: '800',
    textAlign: 'center'
  },
  modalInput: {
    marginTop: scaleModerate(16),
    height: scaleModerate(48),
    borderRadius: scaleModerate(12),
    borderWidth: 1,
    paddingHorizontal: scaleModerate(14),
    fontSize: scaleFont(15)
  },
  modalConfirm: {
    marginTop: scaleModerate(16),
    borderRadius: scaleModerate(20),
    paddingVertical: scaleModerate(12),
    alignItems: 'center'
  },
  modalConfirmText: {
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  modalCancel: {
    marginTop: scaleModerate(4),
    paddingVertical: scaleModerate(10),
    alignItems: 'center'
  },
  modalCancelText: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  }
});

export default AgencyDashboardScreen;
