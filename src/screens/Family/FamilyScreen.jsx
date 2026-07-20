import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { Screen } from '../../components';
import { scaleFont, scaleModerate } from '../../utils';
export function FamilyScreen() {
  const theme = useTheme();
  return <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, {
        color: theme.text.primary
      }]}>Family</Text>
        <Text style={[styles.subtitle, {
        color: theme.text.secondary
      }]}>Your family, badges, and shared perks will show up here.</Text>
      </View>
    </Screen>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scaleModerate(24)
  },
  title: {
    fontSize: scaleFont(28),
    fontWeight: '800'
  },
  subtitle: {
    marginTop: scaleModerate(10),
    fontSize: scaleFont(15),
    textAlign: 'center'
  }
});
export default FamilyScreen;
