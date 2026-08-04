import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AgencyJoinError, fetchAgencies, fetchMyAgencyJoinRequest, requestJoinAgency } from '../../api';
import { Screen, showAlert } from '../../components';
import { routes } from '../../navigation/routes';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { scaleFont, scaleModerate } from '../../utils';

const SEARCH_DEBOUNCE_MS = 350;

function AgencyRow({ agency, busy, onJoin, theme }) {
  return <View style={[styles.row, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
      <View style={styles.rowBody}>
        <Text style={[styles.rowName, { color: theme.text.primary }]} numberOfLines={1}>{agency.name}</Text>
        <Text style={[styles.rowMeta, { color: theme.text.secondary }]} numberOfLines={1}>
          {typeof agency.hostCount === 'number' ? `${agency.hostCount} hosts` : agency.id}
        </Text>
      </View>
      <Pressable disabled={busy} onPress={onJoin} style={[styles.joinButton, { backgroundColor: theme.colors.teal700, opacity: busy ? 0.7 : 1 }]}>
        {busy ? <ActivityIndicator size="small" color={theme.cta.primary.text} /> : <Text style={[styles.joinButtonText, { color: theme.cta.primary.text }]}>Join</Text>}
      </Pressable>
    </View>;
}

// See docs/join-agency-api-spec.md for GET /api/agencies and
// POST /api/agencies/:agencyId/join.
export function JoinAgencyScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const session = useAppStore(state => state.session);
  const sessionToken = session?.token;

  const [pendingRequest, setPendingRequest] = React.useState(undefined);
  const [query, setQuery] = React.useState('');
  const [agencies, setAgencies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);
  const [joiningAgencyId, setJoiningAgencyId] = React.useState(null);

  useFocusEffect(
    React.useCallback(() => {
      if (!sessionToken) {
        return;
      }
      let cancelled = false;
      fetchMyAgencyJoinRequest(sessionToken).then(request => {
        if (!cancelled) {
          setPendingRequest(request);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [sessionToken])
  );

  React.useEffect(() => {
    if (!sessionToken || pendingRequest) {
      return undefined;
    }
    const trimmed = query.trim();
    setLoading(true);
    setLoadError(false);
    let cancelled = false;
    const timeout = setTimeout(() => {
      fetchAgencies(sessionToken, trimmed || undefined).then(list => {
        if (!cancelled) {
          setAgencies(list);
          setLoading(false);
        }
      }).catch(() => {
        if (!cancelled) {
          setLoadError(true);
          setLoading(false);
        }
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [sessionToken, query, pendingRequest]);

  const handleJoin = agency => {
    showAlert('Request to Join', `Send a request to join "${agency.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Request',
        onPress: async () => {
          setJoiningAgencyId(agency.id);
          try {
            await requestJoinAgency(sessionToken, agency.id);
            setPendingRequest({ agencyId: agency.id, agencyName: agency.name, status: 'PENDING' });
          } catch (error) {
            showAlert('Request Failed', error instanceof AgencyJoinError ? error.message : 'Something went wrong. Please try again.');
          } finally {
            setJoiningAgencyId(null);
          }
        }
      }
    ]);
  };

  if (pendingRequest) {
    const isApproved = pendingRequest.status === 'APPROVED';
    // AgencyChoiceScreen (whichever screen sits right before this one) re-
    // checks status on every focus and immediately replaces itself with
    // this same screen if a pending/approved request still exists — so a
    // plain goBack() here would land on AgencyChoiceScreen just long
    // enough for it to bounce straight back to this exact view. Skip past
    // it instead, straight to whatever's behind it.
    const handleBack = () => {
      const navState = navigation.getState();
      const previousRoute = navState.routes[navState.index - 1];
      if (previousRoute?.name === routes.agencyChoice) {
        navigation.pop(2);
      } else {
        navigation.goBack();
      }
    };
    return <Screen>
        <View style={styles.headerRow}>
          <Pressable onPress={handleBack} hitSlop={10}>
            <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text.primary }]}>Join Agency</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.submittedWrap}>
          <View style={[styles.submittedBadge, { backgroundColor: theme.colors.teal50 }]}>
            <Text style={[styles.submittedBadgeTick, { color: theme.colors.teal700 }]}>✓</Text>
          </View>
          <Text style={[styles.submittedTitle, { color: theme.text.primary }]}>
            {isApproved ? 'Request Approved' : 'Request Sent'}
          </Text>
          <Text style={[styles.submittedSubtitle, { color: theme.text.secondary }]}>
            {isApproved
              ? `You're now a host under ${pendingRequest.agencyName ?? 'this agency'}.`
              : `Your request to join ${pendingRequest.agencyName ?? 'this agency'} is pending approval.`}
          </Text>
        </View>
      </Screen>;
  }

  return <Screen>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text.primary }]}>Join Agency</Text>
        <View style={styles.headerSpacer} />
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search agencies by name"
        placeholderTextColor={theme.text.mutedIcon}
        style={[styles.searchInput, { color: theme.text.primary, backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
      />

      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.teal700} />
      ) : loadError ? (
        <Text style={[styles.emptyText, { color: theme.text.secondary }]}>Unable to load agencies right now. Please try again.</Text>
      ) : (
        <FlatList
          data={agencies}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <AgencyRow agency={item} busy={joiningAgencyId === item.id} onJoin={() => handleJoin(item)} theme={theme} />}
          ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.text.secondary }]}>{query.trim() ? 'No agencies found for that name.' : 'No agencies are available right now.'}</Text>}
        />
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
  searchInput: {
    marginHorizontal: scaleModerate(16),
    borderWidth: 1,
    borderRadius: scaleModerate(12),
    paddingHorizontal: scaleModerate(14),
    paddingVertical: scaleModerate(10),
    fontSize: scaleFont(14)
  },
  loader: {
    marginTop: scaleModerate(24)
  },
  list: {
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(14),
    paddingBottom: scaleModerate(28),
    gap: scaleModerate(10)
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(12),
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    padding: scaleModerate(14)
  },
  rowBody: {
    flex: 1,
    gap: scaleModerate(2)
  },
  rowName: {
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  rowMeta: {
    fontSize: scaleFont(11)
  },
  joinButton: {
    minWidth: scaleModerate(64),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: scaleModerate(16),
    paddingVertical: scaleModerate(9)
  },
  joinButtonText: {
    fontSize: scaleFont(12.5),
    fontWeight: '700'
  },
  emptyText: {
    marginTop: scaleModerate(40),
    paddingHorizontal: scaleModerate(24),
    fontSize: scaleFont(13),
    textAlign: 'center'
  },
  submittedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(32),
    paddingBottom: scaleModerate(60)
  },
  submittedBadge: {
    width: scaleModerate(64),
    height: scaleModerate(64),
    borderRadius: scaleModerate(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleModerate(18)
  },
  submittedBadgeTick: {
    fontSize: scaleFont(28),
    fontWeight: '800'
  },
  submittedTitle: {
    fontSize: scaleFont(20),
    fontWeight: '800'
  },
  submittedSubtitle: {
    marginTop: scaleModerate(8),
    fontSize: scaleFont(14),
    lineHeight: 20,
    textAlign: 'center'
  }
});

export default JoinAgencyScreen;
