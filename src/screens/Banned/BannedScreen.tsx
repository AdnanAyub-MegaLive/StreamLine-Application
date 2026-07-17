import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { Screen } from '../../components';
import { useAppStore } from '../../store';

function formatRemaining(msRemaining: number) {
  if (msRemaining <= 0) {
    return null;
  }

  const totalMinutes = Math.ceil(msRemaining / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

  return parts.join(' ');
}

export function BannedScreen() {
  const theme = useTheme();
  const banInfo = useAppStore(state => state.banInfo);
  const [remainingLabel, setRemainingLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!banInfo?.expiresAt) {
      setRemainingLabel(null);
      return undefined;
    }

    const expiresAt = new Date(banInfo.expiresAt).getTime();

    const tick = () => {
      setRemainingLabel(formatRemaining(expiresAt - Date.now()));
    };

    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [banInfo?.expiresAt]);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.giftAccent }]}>Account Suspended</Text>
        <Text style={[styles.reason, { color: theme.text.primary }]}>{banInfo?.reason || 'Your account has been suspended by an administrator.'}</Text>

        {banInfo?.expiresAt ? (
          remainingLabel ? (
            <Text style={[styles.remaining, { color: theme.text.secondary }]}>Time remaining: {remainingLabel}</Text>
          ) : (
            <Text style={[styles.remaining, { color: theme.text.secondary }]}>This suspension has expired. Please restart the app.</Text>
          )
        ) : (
          <Text style={[styles.remaining, { color: theme.text.secondary }]}>This suspension is permanent. Contact support for assistance.</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  reason: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  remaining: {
    marginTop: 20,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default BannedScreen;
