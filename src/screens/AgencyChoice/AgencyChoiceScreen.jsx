import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { fetchMyAgencyApplication, fetchMyAgencyJoinRequest } from '../../api';
import { Screen } from '../../components';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { routes } from '../../navigation/routes';
import { scaleFont, scaleModerate } from '../../utils';

function OptionCard({ emoji, title, subtitle, onPress, theme }) {
  return (
    <Pressable onPress={onPress} style={[styles.card, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}>
      <View style={[styles.cardIcon, { backgroundColor: theme.state.soft }]}>
        <Text style={styles.cardEmoji}>{emoji}</Text>
      </View>
      <View style={styles.cardTextWrap}>
        <Text style={[styles.cardTitle, { color: theme.text.primary }]}>{title}</Text>
        <Text style={[styles.cardSubtitle, { color: theme.text.secondary }]}>{subtitle}</Text>
      </View>
      <Text style={[styles.cardChevron, { color: theme.text.mutedIcon }]}>›</Text>
    </Pressable>
  );
}

// Entry point for the "Agency" tool on Profile — a user either wants to
// start their own agency (goes through the existing application form) or
// join one that already exists (browse/search + request to join). Both
// paths need admin/owner approval before anything actually takes effect.
//
// Someone who already has an application/request on file (pending OR
// approved, either the create-your-own or join-an-existing kind) never
// sees these two choices at all — they're sent straight to whichever
// screen already reflects their real status (which itself shows the
// pending/approved view, and for Create, the dashboard link), since
// showing "Create Agency"/"Join Agency" again to someone who already has
// one doesn't make sense.
export function AgencyChoiceScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const sessionToken = useAppStore(state => state.session?.token);
  const [checking, setChecking] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      if (!sessionToken) {
        setChecking(false);
        return undefined;
      }
      let cancelled = false;
      setChecking(true);
      Promise.all([
        fetchMyAgencyApplication(sessionToken),
        fetchMyAgencyJoinRequest(sessionToken)
      ]).then(([application, joinRequest]) => {
        if (cancelled) {
          return;
        }
        if (application) {
          navigation.replace(application.status === 'APPROVED' ? routes.agencyDashboard : routes.createAgency);
          return;
        }
        if (joinRequest) {
          navigation.replace(routes.joinAgency);
          return;
        }
        setChecking(false);
      });
      return () => {
        cancelled = true;
      };
    }, [sessionToken, navigation])
  );

  if (checking) {
    return <Screen>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={theme.colors.teal700} />
        </View>
      </Screen>;
  }

  return <Screen>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text.primary }]}>Agency</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <OptionCard
          emoji="🏢"
          title="Create Agency"
          subtitle="Apply to start your own agency and manage hosts under it."
          onPress={() => navigation.navigate(routes.createAgency)}
          theme={theme}
        />
        <OptionCard
          emoji="🤝"
          title="Join Agency"
          subtitle="Browse existing agencies and request to join one as a host."
          onPress={() => navigation.navigate(routes.joinAgency)}
          theme={theme}
        />
      </View>
    </Screen>;
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
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
  content: {
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(20),
    gap: scaleModerate(14)
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(14),
    borderRadius: scaleModerate(20),
    borderWidth: 1,
    padding: scaleModerate(16)
  },
  cardIcon: {
    width: scaleModerate(52),
    height: scaleModerate(52),
    borderRadius: scaleModerate(16),
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardEmoji: {
    fontSize: scaleFont(26)
  },
  cardTextWrap: {
    flex: 1,
    gap: scaleModerate(4)
  },
  cardTitle: {
    fontSize: scaleFont(15),
    fontWeight: '800'
  },
  cardSubtitle: {
    fontSize: scaleFont(12),
    lineHeight: 17
  },
  cardChevron: {
    fontSize: scaleFont(24),
    fontWeight: '700'
  }
});

export default AgencyChoiceScreen;
