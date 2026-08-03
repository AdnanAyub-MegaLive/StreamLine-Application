import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AgencyJoinError, fetchMyAgencyDashboard, respondToAgencyJoinRequest } from '../../api';
import { Screen, showAlert } from '../../components';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { scaleFont, scaleModerate } from '../../utils';

function StatCard({ label, value, theme }) {
  return <View style={[styles.statCard, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
      <Text style={[styles.statValue, { color: theme.text.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.text.secondary }]}>{label}</Text>
    </View>;
}

function HostRow({ host, theme }) {
  return <View style={[styles.hostRow, { borderColor: theme.colors.cardBorder }]}>
      <View style={styles.hostBody}>
        <Text style={[styles.hostName, { color: theme.text.primary }]} numberOfLines={1}>{host.name}</Text>
        <Text style={[styles.hostMeta, { color: theme.text.secondary }]} numberOfLines={1}>ID: {host.id}</Text>
      </View>
      <Text style={[styles.hostSalary, { color: theme.colors.vipGoldText }]}>🪙 {host.salaryCoinBalance ?? 0}</Text>
    </View>;
}

function JoinRequestRow({ request, busy, onRespond, theme }) {
  return <View style={[styles.requestRow, { borderColor: theme.colors.cardBorder }]}>
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

// Shown once a user actually owns an approved agency — reached from either
// CreateAgencyScreen or JoinAgencyScreen's "Approved" state. See
// docs/agency-dashboard-api-spec.md — GET /api/agencies/mine and the
// join-request respond endpoint don't exist on StreamLine-Portal yet, so
// this renders a "couldn't load" state until the backend ships them.
export function AgencyDashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const sessionToken = useAppStore(state => state.session?.token);
  const [agency, setAgency] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [respondingId, setRespondingId] = React.useState(null);

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

  const handleRespond = (request, accept) => {
    setRespondingId(request.id);
    respondToAgencyJoinRequest(sessionToken, request.id, accept)
      .then(() => reload())
      .catch(error => {
        showAlert('Unable to Respond', error instanceof AgencyJoinError ? error.message : 'Something went wrong. Please try again.');
      })
      .finally(() => setRespondingId(null));
  };

  return <Screen>
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
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.agencyName, { color: theme.text.primary }]}>{agency.name}</Text>
          <Text style={[styles.agencyId, { color: theme.text.secondary }]}>ID: {agency.id}</Text>

          <View style={styles.statsRow}>
            <StatCard label="Commission" value={`🪙 ${agency.commissionCoinBalance ?? 0}`} theme={theme} />
            <StatCard label="Hosts" value={String(agency.hosts?.length ?? 0)} theme={theme} />
          </View>

          {agency.pendingJoinRequests?.length ? (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Join Requests</Text>
              <View style={styles.list}>
                {agency.pendingJoinRequests.map(request => (
                  <JoinRequestRow key={request.id} request={request} busy={respondingId === request.id} onRespond={handleRespond} theme={theme} />
                ))}
              </View>
            </>
          ) : null}

          <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Hosts</Text>
          <View style={styles.list}>
            {agency.hosts?.length ? agency.hosts.map(host => <HostRow key={host.id} host={host} theme={theme} />) : (
              <Text style={[styles.emptyText, { color: theme.text.secondary }]}>No hosts under this agency yet.</Text>
            )}
          </View>
        </ScrollView>
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
  content: {
    paddingHorizontal: scaleModerate(16),
    paddingBottom: scaleModerate(28)
  },
  agencyName: {
    fontSize: scaleFont(20),
    fontWeight: '800'
  },
  agencyId: {
    marginTop: scaleModerate(2),
    fontSize: scaleFont(12)
  },
  statsRow: {
    flexDirection: 'row',
    gap: scaleModerate(12),
    marginTop: scaleModerate(16)
  },
  statCard: {
    flex: 1,
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    padding: scaleModerate(14),
    alignItems: 'center'
  },
  statValue: {
    fontSize: scaleFont(16),
    fontWeight: '800'
  },
  statLabel: {
    marginTop: scaleModerate(4),
    fontSize: scaleFont(11)
  },
  sectionTitle: {
    marginTop: scaleModerate(22),
    marginBottom: scaleModerate(10),
    fontSize: scaleFont(15),
    fontWeight: '800'
  },
  list: {
    gap: scaleModerate(10)
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  }
});

export default AgencyDashboardScreen;
