import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Screen } from '../../components';
import { scaleFont, scaleModerate } from '../../utils';

// Opened when a Party tab banner is tapped. Placeholder content for now —
// custom content per banner will be added here later.
export function BannerDetailScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { uri, title, subtitle } = route.params ?? {};

  return <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
      </View>
      {uri ? <Image source={{ uri }} style={styles.image} resizeMode="cover" /> : null}
      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.text.primary }]}>{title || 'Banner'}</Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>{subtitle || 'More coming soon.'}</Text>
      </View>
    </Screen>;
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(14)
  },
  backChevron: {
    fontSize: scaleFont(28),
    fontWeight: '700'
  },
  image: {
    width: '100%',
    height: scaleModerate(220),
    marginTop: scaleModerate(12)
  },
  body: {
    paddingHorizontal: scaleModerate(20),
    paddingTop: scaleModerate(16)
  },
  title: {
    fontSize: scaleFont(20),
    fontWeight: '800'
  },
  subtitle: {
    marginTop: scaleModerate(6),
    fontSize: scaleFont(14)
  }
});

export default BannerDetailScreen;
