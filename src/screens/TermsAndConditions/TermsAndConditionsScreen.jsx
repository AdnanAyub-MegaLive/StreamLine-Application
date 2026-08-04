import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Screen } from '../../components';
import { scaleFont, scaleModerate } from '../../utils';
import '../../navigation';

// Covers every feature currently shipped in the app — kept as one ordered
// list of sections so a new feature just needs a new entry here, not a
// restructure of the screen itself.
const POLICY_SECTIONS = [
  {
    title: '1. Account & Eligibility',
    body: [
      'You must provide accurate signup details (name, phone number, date of birth, gender) and keep them up to date from Edit Profile.',
      'Accounts found to be underage, impersonating another person, or created to evade a ban may be suspended or permanently banned.',
      'The blue "Official" checkmark is granted only by Streamline admins and may be revoked at any time — it is separate from agency verification.'
    ]
  },
  {
    title: '2. Live Audio & Video Rooms',
    body: [
      'Each user may own one persistent room. Starting a new room while an existing one is live resumes it instead of replacing it.',
      'Room owners and moderators are responsible for the conduct of everyone on their seats and in their chat, and may remove or block participants.',
      'Entrance effects, Ride effects, room backgrounds, frames, and badges shown in a room are cosmetic items assigned to your account and may be changed or removed by an admin.',
      'Video rooms are still in development — features shown as "coming soon" are not yet available.'
    ]
  },
  {
    title: '3. Gifts & Coins',
    body: [
      'Coins are a virtual, non-refundable currency used to send gifts and cannot be exchanged for cash directly.',
      'Sending a gift is final once confirmed. Gift prices and catalog availability (Classic, Premium, VIP tiers) are set by Streamline and may change.',
      'A host must be linked to an active agency to receive gift earnings — coins sent to a host without one are not credited until they join an agency.',
      'Earnings are split automatically between the host, their agency, and Streamline according to the settlement rules in effect at the time the gift is sent.'
    ]
  },
  {
    title: '4. Agencies & Hosts',
    body: [
      'Creating an agency requires submitting an Admin ID, agency name, and owner WhatsApp number for review; approval is at Streamline\'s discretion.',
      'Agency owners are responsible for reviewing and responding to join requests from hosts, and for the conduct of hosts under their agency.',
      'A host may belong to only one agency at a time. Leaving or being removed from an agency stops future gift earnings from being routed to it.',
      'Agencies found submitting false information, or engaging in coin fraud, are subject to suspension of the agency and its hosts.'
    ]
  },
  {
    title: '5. Discover Feed & Posts',
    body: [
      'Posts you publish to Discover (description and/or photo) are visible to other users and may be liked, commented on, shared, and saved by them.',
      'Do not post content that is illegal, harassing, sexually explicit involving minors, or that infringes someone else\'s copyright — such posts will be removed and may result in a ban.',
      'You are responsible for the photos you upload — only post images you own or have permission to share.',
      'Streamline may remove any post or restrict the Discover feature for an account that violates these policies.'
    ]
  },
  {
    title: '6. Messaging & Friends',
    body: [
      'Direct messages and World Chat are intended for respectful communication — harassment, spam, or unsolicited explicit content is not allowed.',
      'Friend requests can be accepted or declined at any time; blocking a user stops them from messaging you or seeing your live status.',
      'Message content may be reviewed if reported for abuse, in line with applicable law.'
    ]
  },
  {
    title: '7. Store & Purchases',
    body: [
      'Items in the Store (frames, entrance effects, ride effects, badges, room backgrounds) are cosmetic and tied to your account — they cannot be transferred to another user.',
      'Equipping, unequipping, or removing an owned item is instant and does not refund its cost.'
    ]
  },
  {
    title: '8. Conduct & Enforcement',
    body: [
      'Harassment, hate speech, impersonation, spamming, and attempts to circumvent bans are prohibited across every feature — rooms, chat, Discover, and gifting alike.',
      'Violations may result in a warning, temporary suspension, or permanent ban, at Streamline\'s discretion, without a refund of spent coins.'
    ]
  },
  {
    title: '9. Changes to This Policy',
    body: [
      'These policies may be updated as new features ship. Continued use of the app after an update means you accept the revised terms.'
    ]
  }
];

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
      }]}>These policies cover every feature currently available in the app. By continuing to use Streamline, you agree to them.</Text>

        {POLICY_SECTIONS.map(section => <View key={section.title} style={[styles.card, {
        backgroundColor: theme.surfaces.card,
        borderColor: theme.colors.cardBorder
      }]}>
            <Text style={[styles.sectionTitle, {
            color: theme.text.primary
          }]}>{section.title}</Text>
            {section.body.map(paragraph => <Text key={paragraph} style={[styles.body, {
            color: theme.text.secondary
          }]}>{paragraph}</Text>)}
          </View>)}
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
    marginTop: scaleModerate(16),
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
