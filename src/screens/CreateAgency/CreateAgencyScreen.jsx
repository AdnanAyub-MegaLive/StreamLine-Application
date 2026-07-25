import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { submitAgencyApplication } from '../../api';
import { FormField, PrimaryButton, Screen, showAlert } from '../../components';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { routes } from '../../navigation/routes';
import { scaleFont, scaleModerate } from '../../utils';

// One CNIC side (front/back) — tap to pick from the gallery, shows the
// picked photo as a preview inside the box.
function CnicUploadBox({ label, asset, onPick }) {
  const theme = useTheme();
  return <View style={styles.cnicBoxWrap}>
      <Text style={[styles.cnicLabel, { color: theme.text.secondary }]}>{label}</Text>
      <Pressable onPress={onPick} style={[styles.cnicBox, {
        backgroundColor: theme.surfaces.card,
        borderColor: theme.colors.cardBorder
      }]}>
        {asset
          ? <Image source={{ uri: asset.uri }} style={styles.cnicPreview} resizeMode="cover" />
          : <>
              <Text style={[styles.cnicPlus, { color: theme.colors.teal700 }]}>+</Text>
              <Text style={[styles.cnicHint, { color: theme.text.mutedIcon }]}>Tap to upload</Text>
            </>}
      </Pressable>
    </View>;
}

export function CreateAgencyScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const session = useAppStore(state => state.session);
  const user = session?.user;

  const [agencyName, setAgencyName] = React.useState('');
  // Email comes from the account when it exists; otherwise the user types
  // one here.
  const hasDbEmail = Boolean(user?.email);
  const [email, setEmail] = React.useState(user?.email ?? '');
  const [whatsapp, setWhatsapp] = React.useState('');
  const [bdCode, setBdCode] = React.useState('');
  const [cnicFront, setCnicFront] = React.useState(null);
  const [cnicBack, setCnicBack] = React.useState(null);
  const [policiesAccepted, setPoliciesAccepted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const pickCnic = async setter => {
    const response = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      includeBase64: false,
      quality: 0.8
    });
    if (response.didCancel) {
      return;
    }
    const asset = response.assets?.[0];
    if (!asset?.uri) {
      showAlert('Photo not selected', 'Please choose a photo from your device.');
      return;
    }
    setter(asset);
  };

  const validate = () => {
    if (!agencyName.trim()) {
      showAlert('Missing info', 'Please enter the agency name.');
      return false;
    }
    if (!email.trim()) {
      showAlert('Missing info', 'Please enter an email address.');
      return false;
    }
    if (!whatsapp.trim()) {
      showAlert('Missing info', 'Please enter your WhatsApp number.');
      return false;
    }
    if (!cnicFront || !cnicBack) {
      showAlert('Missing info', 'Please upload both sides of your CNIC.');
      return false;
    }
    if (!bdCode.trim()) {
      showAlert('Missing info', 'Please enter your BD code.');
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
        email,
        whatsapp,
        bdCode,
        cnicFront,
        cnicBack
      });
      showAlert('Application sent', 'Your agency application has been submitted. We will contact you soon.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      showAlert('Submission failed', error.message);
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
        <FormField label="Agency Name" placeholder="Enter your agency name" value={agencyName} onChangeText={setAgencyName} />
        <FormField label="Country" value={user?.country || 'Not set'} editable={false} />
        <FormField label="Email" placeholder="Enter your email" value={email} onChangeText={setEmail} editable={!hasDbEmail} icon="email" keyboardType="email-address" />
        <FormField label="WhatsApp Number" placeholder="e.g. +92 300 1234567" value={whatsapp} onChangeText={setWhatsapp} icon="phone" keyboardType="phone-pad" />

        <Text style={[styles.sectionLabel, { color: theme.text.secondary }]}>CNIC (both sides)</Text>
        <View style={styles.cnicRow}>
          <CnicUploadBox label="Front side" asset={cnicFront} onPick={() => pickCnic(setCnicFront)} />
          <CnicUploadBox label="Back side" asset={cnicBack} onPick={() => pickCnic(setCnicBack)} />
        </View>

        <FormField label="Your BD Code" placeholder="Enter your BD code" value={bdCode} onChangeText={setBdCode} />

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
  sectionLabel: {
    marginTop: scaleModerate(4),
    marginBottom: scaleModerate(8),
    paddingLeft: scaleModerate(4),
    fontSize: scaleFont(12),
    fontWeight: '700'
  },
  cnicRow: {
    flexDirection: 'row',
    gap: scaleModerate(12),
    marginBottom: scaleModerate(14)
  },
  cnicBoxWrap: {
    flex: 1
  },
  cnicLabel: {
    marginBottom: scaleModerate(6),
    paddingLeft: scaleModerate(4),
    fontSize: scaleFont(11),
    fontWeight: '700'
  },
  cnicBox: {
    height: scaleModerate(110),
    borderRadius: scaleModerate(14),
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  cnicPreview: {
    width: '100%',
    height: '100%'
  },
  cnicPlus: {
    fontSize: scaleFont(26),
    fontWeight: '700'
  },
  cnicHint: {
    fontSize: scaleFont(11)
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
  }
});

export default CreateAgencyScreen;
