import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Screen } from '../../components';
import { scaleFont, scaleModerate } from '../../utils';
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
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(18),
    paddingBottom: scaleModerate(28)
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scaleModerate(12)
  },
  headerSpacer: {
    width: scaleModerate(40)
  },
  backButton: {
    width: scaleModerate(40),
    height: scaleModerate(40),
    borderRadius: scaleModerate(20),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  backText: {
    fontSize: scaleFont(22),
    fontWeight: '700',
    lineHeight: 24
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: scaleFont(20),
    fontWeight: '800'
  },
  subtitle: {
    marginTop: scaleModerate(14),
    fontSize: scaleFont(14),
    lineHeight: 20,
    textAlign: 'center'
  },
  card: {
    marginTop: scaleModerate(20),
    borderWidth: 1,
    borderRadius: scaleModerate(24),
    padding: scaleModerate(18)
  },
  sectionTitle: {
    fontSize: scaleFont(16),
    fontWeight: '800',
    marginBottom: scaleModerate(10)
  },
  body: {
    fontSize: scaleFont(13),
    lineHeight: 20,
    marginTop: scaleModerate(8)
  }
});
export default TermsAndConditionsScreen;
