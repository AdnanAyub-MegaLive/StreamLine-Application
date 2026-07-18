import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { Screen } from '../../components';
export function MessageScreen() {
  const theme = useTheme();
  return <Screen>
      <View style={styles.container}>
        <Text style={[styles.title, {
        color: theme.text.primary
      }]}>Messages</Text>
        <Text style={[styles.subtitle, {
        color: theme.text.secondary
      }]}>Your conversations and notifications will show up here.</Text>
      </View>
    </Screen>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  title: {
    fontSize: 28,
    fontWeight: '800'
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    textAlign: 'center'
  }
});
export default MessageScreen;
