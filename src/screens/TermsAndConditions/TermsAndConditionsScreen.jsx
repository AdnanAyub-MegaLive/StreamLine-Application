import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Screen } from '../../components';
import '../../navigation';
export function TermsAndConditionsScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  return <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.backButton, {
          backgroundColor: theme.surfaces.card,
          borderColor: theme.colors.cardBorder
        }]}>
            <Text style={[styles.backText, {
            color: theme.text.primary
          }]}>←</Text>
          </Pressable>
          <Text style={[styles.title, {
          color: theme.text.primary
        }]}>Terms and Conditions</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={[styles.subtitle, {
        color: theme.text.secondary
      }]}>Temporary placeholder page for the terms link.</Text>

        <View style={[styles.card, {
        backgroundColor: theme.surfaces.card,
        borderColor: theme.colors.cardBorder
      }]}>
          <Text style={[styles.sectionTitle, {
          color: theme.text.primary
        }]}>Dummy Terms</Text>
          <Text style={[styles.body, {
          color: theme.text.secondary
        }]}>1. This is a temporary terms page used for navigation testing.</Text>
          <Text style={[styles.body, {
          color: theme.text.secondary
        }]}>2. Replace this copy with your real legal text later.</Text>
          <Text style={[styles.body, {
          color: theme.text.secondary
        }]}>3. By using this screen, the checkbox link can navigate here for now.</Text>
        </View>
      </ScrollView>
    </Screen>;
}
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  headerSpacer: {
    width: 40
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  backText: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800'
  },
  subtitle: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
  },
  card: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 24,
    padding: 18
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8
  }
});
export default TermsAndConditionsScreen;
