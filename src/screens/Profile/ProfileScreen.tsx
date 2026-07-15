import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { Screen } from '../../components';

export function ProfileScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Profile</Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>Account settings and user details belong here.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    textAlign: 'center',
  },
});

export default ProfileScreen;
