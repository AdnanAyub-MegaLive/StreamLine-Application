import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { VerifiedTick } from './VerifiedTick';
import { scaleModerate } from '../utils';

// Single place that decides how the official checkmark sits next to a
// name — every screen that shows a user's name renders this instead of
// hand-placing <Text>{name}</Text> plus a VerifiedTick sibling itself.
export function VerifiedName({ name, isOfficial, style, textStyle, numberOfLines = 1, tickSize = 13 }) {
  return <View style={[styles.row, style]}>
      <Text style={[styles.text, textStyle]} numberOfLines={numberOfLines}>{name}</Text>
      {isOfficial ? <VerifiedTick size={tickSize} /> : null}
    </View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(4)
  },
  text: {
    flexShrink: 1
  }
});

export default VerifiedName;
