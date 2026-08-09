import React from 'react';
import { Animated, Easing, Pressable, Text, TextInput, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BellIcon, SearchIcon } from '../../../assets';

function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  return `rgba(${parseInt(clean.substring(0, 2), 16)}, ${parseInt(clean.substring(2, 4), 16)}, ${parseInt(clean.substring(4, 6), 16)}, ${alpha})`;
}

function HeaderGlassButton({ theme, onPress, children, style, styles }) {
  return <Pressable onPress={onPress} style={[styles.headerButton, style]}>
      <LinearGradient colors={[hexToRgba(theme.surfaces.card, 0.6), hexToRgba(theme.surfaces.card, 0.4)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerButtonGradient}>
        <LinearGradient colors={[hexToRgba(theme.colors.secondary, 0.14), hexToRgba(theme.colors.tertiary, 0.14)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerButtonTint} pointerEvents="none" />
        {children}
      </LinearGradient>
    </Pressable>;
}

export function DiscoverHeader({ theme, onOpenNotifications, hasUnreadNotifications, searchActive, searchQuery, onChangeSearchQuery, onOpenSearch, onCloseSearch, styles }) {
  const searchAnim = React.useRef(new Animated.Value(searchActive ? 1 : 0)).current;
  const searchInputRef = React.useRef(null);

  React.useEffect(() => {
    Animated.timing(searchAnim, { toValue: searchActive ? 1 : 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    if (searchActive) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [searchActive, searchAnim]);

  const titleOpacity = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const titleTranslateX = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -24] });
  const searchTranslateX = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] });

  return <View style={styles.headerBar}>
      <Animated.View pointerEvents={searchActive ? 'none' : 'auto'} style={[styles.headerBarRow, { opacity: titleOpacity, transform: [{ translateX: titleTranslateX }] }]}>
        <Text style={[styles.screenTitle, { color: theme.text.primary }]}>Discover</Text>
        <View style={styles.headerActions}>
          <HeaderGlassButton theme={theme} onPress={onOpenSearch} styles={styles}><SearchIcon size={19} color={theme.text.primary} /></HeaderGlassButton>
          <HeaderGlassButton theme={theme} onPress={onOpenNotifications} styles={styles}>
            <BellIcon size={19} color={theme.text.primary} />
            {hasUnreadNotifications ? <View style={[styles.headerDot, { backgroundColor: theme.colors.liveBadge, borderColor: theme.surfaces.card }]} /> : null}
          </HeaderGlassButton>
        </View>
      </Animated.View>
      <Animated.View pointerEvents={searchActive ? 'auto' : 'none'} style={[styles.headerBarRow, styles.headerBarRowAbsolute, { opacity: searchAnim, transform: [{ translateX: searchTranslateX }] }]}>
        <View style={styles.searchBarWrap}>
          <LinearGradient colors={[hexToRgba(theme.surfaces.card, 0.7), hexToRgba(theme.surfaces.card, 0.45)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.searchBar}>
            <SearchIcon size={16} color={theme.text.secondary} />
            <TextInput ref={searchInputRef} value={searchQuery} onChangeText={onChangeSearchQuery} placeholder="Search by name…" placeholderTextColor={theme.text.secondary} style={[styles.searchInput, { color: theme.text.primary }]} returnKeyType="search" />
          </LinearGradient>
        </View>
        <Pressable onPress={onCloseSearch} hitSlop={10}><Text style={[styles.searchCancel, { color: theme.colors.teal700 }]}>Cancel</Text></Pressable>
      </Animated.View>
    </View>;
}
