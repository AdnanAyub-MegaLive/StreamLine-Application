import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FemaleIcon, MaleIcon } from '../assets';
import { useTheme } from '../theme';
import { scaleFont, scaleModerate } from '../utils';

function ageFromDob(dob) {
  if (!dob) {
    return 0;
  }
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) {
    return 0;
  }
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const hadBirthdayThisYear = now.getMonth() > birthDate.getMonth() || (now.getMonth() === birthDate.getMonth() && now.getDate() >= birthDate.getDate());
  if (!hadBirthdayThisYear) {
    age -= 1;
  }
  return Math.max(age, 0);
}

export function GenderAgeChip({ gender, dob, style }) {
  const theme = useTheme();
  if (!gender) {
    return null;
  }
  const isFemale = gender === 'female';
  const GenderIcon = isFemale ? FemaleIcon : MaleIcon;
  const accentColor = isFemale ? theme.colors.giftAccent : theme.colors.facebookBlue;
  return <View style={[styles.genderAgeChip, { backgroundColor: accentColor }, style]}>
      <GenderIcon size={11} color={theme.cta.primary.text} />
      <Text style={[styles.genderAgeText, { color: theme.cta.primary.text }]}>{ageFromDob(dob)}</Text>
    </View>;
}

const styles = StyleSheet.create({
  genderAgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: scaleModerate(20),
    gap: scaleModerate(4),
    borderRadius: 999,
    paddingHorizontal: scaleModerate(8)
  },
  genderAgeText: {
    fontSize: scaleFont(10.5),
    fontWeight: '700'
  }
});

export default GenderAgeChip;
