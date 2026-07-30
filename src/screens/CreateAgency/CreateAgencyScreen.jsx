import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AgencyApplicationError, fetchMyAgencyApplication, submitAgencyApplication } from '../../api';
import { FormField, PrimaryButton, Screen, showAlert } from '../../components';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { routes } from '../../navigation/routes';
import { scaleFont, scaleModerate } from '../../utils';

export function CreateAgencyScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const session = useAppStore(state => state.session);
  const user = session?.user;
  const submittedAt = useAppStore(state => state.agencyApplications?.[user?.publicId]);
  const markAgencyApplicationSubmitted = useAppStore(state => state.markAgencyApplicationSubmitted);
  // Independent of the persisted flag above — just drives which message the
  // submitted view shows. Defaults to PENDING (the only status possible
  // right after this device's own submit/ALREADY_APPLIED); the status-check
  // effect below fills in the real value (PENDING or APPROVED — the backend
  // never returns a REJECTED one here, since that doesn't block reapplying).
  const [applicationStatus, setApplicationStatus] = React.useState('PENDING');

  // Catches an application that exists in the database but this device's
  // local flag doesn't know about yet (submitted from another device,
  // before a reinstall, or added directly for testing) — without this, the
  // form would show as if nothing had ever been applied for. Silently does
  // nothing if the backend doesn't have this endpoint yet
  // (fetchMyAgencyApplication returns null on any failure).
  React.useEffect(() => {
    if (!session?.token || submittedAt) {
      return;
    }
    let cancelled = false;
    fetchMyAgencyApplication(session.token).then(application => {
      if (!cancelled && application) {
        setApplicationStatus(application.status);
        markAgencyApplicationSubmitted(user?.publicId);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session?.token, submittedAt, user?.publicId, markAgencyApplicationSubmitted]);

  const [agencyName, setAgencyName] = React.useState('');
  const [whatsapp, setWhatsapp] = React.useState('');
  const [adminId, setAdminId] = React.useState('');
  const [policiesAccepted, setPoliciesAccepted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const validate = () => {
    if (!agencyName.trim()) {
      showAlert('Missing info', 'Please enter the agency name.');
      return false;
    }
    if (!whatsapp.trim()) {
      showAlert('Missing info', 'Please enter the agency owner\'s WhatsApp number.');
      return false;
    }
    if (!adminId.trim()) {
      showAlert('Missing info', 'Please enter the admin ID.');
      return false;
    }
    if (!policiesAccepted) {
      showAlert('Policies', 'Please read and agree to the policies first.');
      return false;
    }
    return true;
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await submitAgencyApplication(session?.token, {
        agencyName,
        email: user?.email,
        whatsapp,
        bdCode: adminId
      });
      markAgencyApplicationSubmitted(user?.publicId);
      showAlert('Application sent', 'Your agency application has been submitted. We will contact you soon.');
    } catch (error) {
      // The backend allows only one PENDING application per user — a
      // second attempt (e.g. this local flag missing a submission made
      // before this device had it, or a fresh install) comes back as
      // ALREADY_APPLIED rather than a real failure. Treat it the same as
      // success instead of showing an error and leaving the form open to
      // be resubmitted.
      if (error instanceof AgencyApplicationError && error.code === 'ALREADY_APPLIED') {
        markAgencyApplicationSubmitted(user?.publicId);
        showAlert('Already Applied', 'You already have a pending agency application on file.');
      } else {
        showAlert('Submission failed', error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }
    showAlert('Are you sure?', `Submit the agency application for "${agencyName.trim()}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', onPress: submit }
    ]);
  };

  if (submittedAt) {
    const isApproved = applicationStatus === 'APPROVED';
    return <Screen>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text.primary }]}>Create Agency</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.submittedWrap}>
          <View style={[styles.submittedBadge, { backgroundColor: theme.colors.teal50 }]}>
            <Text style={[styles.submittedBadgeTick, { color: theme.colors.teal700 }]}>✓</Text>
          </View>
          <Text style={[styles.submittedTitle, { color: theme.text.primary }]}>
            {isApproved ? 'Application Approved' : 'Application Submitted'}
          </Text>
          <Text style={[styles.submittedSubtitle, { color: theme.text.secondary }]}>
            {isApproved
              ? "Your agency application has been approved. You're all set — there's no need to apply again."
              : "You've already applied to become an agency. We'll get back to you soon — there's no need to apply again."}
          </Text>
        </View>
      </Screen>;
  }

  return <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
          </Pressable>
          <Text style={[styles.title, { color: theme.text.primary }]}>Create Agency</Text>
          <View style={styles.headerSpacer} />
        </View>

        <FormField label="User ID" value={user?.displayId || user?.publicId || '—'} editable={false} icon="user" />
        <FormField label="Country" value={user?.country || 'Not set'} editable={false} />
        <FormField label="Gender" value={user?.gender === 'female' ? 'Female' : user?.gender === 'male' ? 'Male' : 'Not set'} editable={false} />
        <FormField label="Phone Number" value={user?.phone || 'Not set'} editable={false} icon="phone" />
        <FormField label="Admin ID" placeholder="Enter the admin ID" value={adminId} onChangeText={setAdminId} />
        <FormField label="Agency Name" placeholder="Enter your agency name" value={agencyName} onChangeText={setAgencyName} />
        <FormField label="Agency Owner WhatsApp Number" placeholder="e.g. +92 300 1234567" value={whatsapp} onChangeText={setWhatsapp} icon="phone" keyboardType="phone-pad" />

        <View style={styles.policyRow}>
          <Pressable onPress={() => setPoliciesAccepted(current => !current)} style={[styles.checkbox, {
            backgroundColor: policiesAccepted ? theme.cta.primary.background : theme.surfaces.card,
            borderColor: policiesAccepted ? theme.cta.primary.background : theme.colors.cardBorder
          }]}>
            <Text style={[styles.checkboxTick, { color: policiesAccepted ? theme.cta.primary.text : theme.text.secondary }]}>{policiesAccepted ? '✓' : ''}</Text>
          </Pressable>
          <Text style={[styles.policyText, { color: theme.text.secondary }]}>
            I have read and agree to the{' '}
            <Text style={[styles.policyLink, { color: theme.colors.teal700 }]} onPress={() => navigation.navigate(routes.terms)}>
              policies
            </Text>
          </Text>
        </View>

        <PrimaryButton label={submitting ? 'Submitting…' : 'Submit'} onPress={handleSubmit} disabled={submitting} style={styles.submitButton} />
      </ScrollView>
    </Screen>;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(14),
    paddingBottom: scaleModerate(40)
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleModerate(16)
  },
  backChevron: {
    fontSize: scaleFont(28),
    fontWeight: '700'
  },
  headerSpacer: {
    width: scaleModerate(20)
  },
  title: {
    fontSize: scaleFont(20),
    fontWeight: '800'
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(10),
    marginTop: scaleModerate(6),
    marginBottom: scaleModerate(18)
  },
  checkbox: {
    width: scaleModerate(22),
    height: scaleModerate(22),
    borderRadius: scaleModerate(6),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxTick: {
    fontSize: scaleFont(13),
    fontWeight: '800'
  },
  policyText: {
    flex: 1,
    fontSize: scaleFont(13)
  },
  policyLink: {
    fontWeight: '700'
  },
  submitButton: {
    marginTop: scaleModerate(4)
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

export default CreateAgencyScreen;
