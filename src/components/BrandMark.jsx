import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { streamlineLogo } from '../assets';
import { scaleModerate } from '../utils';
export function BrandMark({
  size = 118
}) {
  return <Image source={streamlineLogo} style={[styles.logo, {
    width: size,
    height: size
  }]} resizeMode="contain" />;
}
const styles = StyleSheet.create({
  logo: {
    borderRadius: scaleModerate(30)
  }
});
export default BrandMark;
