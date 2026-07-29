import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../theme';
import { Screen } from '../../components';
import { scaleFont, scaleModerate } from '../../utils';

// Opened when a banner's actionUrl (see StreamLine-Portal's
// docs/mobile-upload-catalog-api.md) is tapped — keeps the user inside the
// app instead of handing off to the system browser. Replaces the earlier
// Linking.openURL fallback, which was only ever a stopgap until
// react-native-webview was installed (needed a native rebuild, done now).
export function InAppBrowserScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { url, title } = route.params ?? {};
  const webViewRef = React.useRef(null);
  const [loading, setLoading] = React.useState(true);
  const [pageTitle, setPageTitle] = React.useState(title || '');
  const [canGoBack, setCanGoBack] = React.useState(false);

  const handleClose = () => navigation.goBack();
  // Back button first tries to step back through the page's own history
  // (like a real browser's back button) — only leaves the screen once
  // there's nowhere left to go back to inside the WebView itself.
  const handleBackPress = () => {
    if (canGoBack) {
      webViewRef.current?.goBack();
      return;
    }
    navigation.goBack();
  };

  if (!url) {
    return <Screen>
        <View style={styles.header}>
          <Pressable onPress={handleClose} hitSlop={10}>
            <Text style={[styles.chevron, { color: theme.text.primary }]}>‹</Text>
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.text.secondary }]}>Nothing to show.</Text>
        </View>
      </Screen>;
  }

  return <Screen>
      <View style={[styles.header, { borderBottomColor: theme.colors.cardBorder }]}>
        <Pressable onPress={handleBackPress} hitSlop={10} style={styles.headerButton}>
          <Text style={[styles.chevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]} numberOfLines={1}>
            {pageTitle || 'Loading…'}
          </Text>
          <Text style={[styles.headerUrl, { color: theme.text.mutedIcon }]} numberOfLines={1}>{url}</Text>
        </View>
        <Pressable onPress={handleClose} hitSlop={10} style={styles.headerButton}>
          <Text style={[styles.closeIcon, { color: theme.text.primary }]}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.webviewWrap}>
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={state => {
            setCanGoBack(state.canGoBack);
            if (state.title) {
              setPageTitle(state.title);
            }
          }}
          startInLoadingState
          style={styles.webview}
        />
        {loading ? (
          <View style={[styles.loadingOverlay, { backgroundColor: theme.surfaces.page }]}>
            <ActivityIndicator size="large" color={theme.colors.teal700} />
          </View>
        ) : null}
      </View>
    </Screen>;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(10),
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(10),
    paddingBottom: scaleModerate(10),
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  headerButton: {
    padding: scaleModerate(4)
  },
  chevron: {
    fontSize: scaleFont(28),
    fontWeight: '700'
  },
  closeIcon: {
    fontSize: scaleFont(16),
    fontWeight: '700'
  },
  headerTextWrap: {
    flex: 1
  },
  headerTitle: {
    fontSize: scaleFont(14),
    fontWeight: '700'
  },
  headerUrl: {
    marginTop: scaleModerate(1),
    fontSize: scaleFont(11)
  },
  webviewWrap: {
    flex: 1
  },
  webview: {
    flex: 1
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    fontSize: scaleFont(14)
  }
});

export default InAppBrowserScreen;
