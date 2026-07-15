import React, { useEffect } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '../../store';
import { useTheme } from '../../theme';
import { BrandMark, Screen } from '../../components';
import { routes, type RootStackParamList } from '../../navigation';

type SplashScreenProps = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen(_: SplashScreenProps) {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const loadingProgress = React.useRef(new Animated.Value(0)).current;
  const hasHydrated = useAppStore(state => state.hasHydrated);
  const session = useAppStore(state => state.session);

  useEffect(() => {
    if (!hasHydrated) {
      return undefined;
    }

    const animation = Animated.timing(loadingProgress, {
      toValue: 1,
      duration: 1800,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    animation.start();

    const timer = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: session?.onboardingComplete ? routes.home : session ? routes.onboarding : routes.auth }],
      });
    }, 1800);

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [hasHydrated, loadingProgress, navigation, session]);

  const loadingWidth = loadingProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['12%', '100%'],
  });

  return (
    <Screen>
      <View style={styles.backdrop} pointerEvents="none">
        <View style={[styles.glowOne, { backgroundColor: theme.state.soft }]} />
        <View style={[styles.glowTwo, { backgroundColor: theme.colors.teal100 }]} />
      </View>

      <View style={styles.content}>
        <BrandMark />
        <Text style={[styles.title, { color: theme.text.primary }]}>Streamline</Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary }]}>Connecting players in a premium lounge experience.</Text>

        <View style={styles.loadingArea}>
          <View style={[styles.loadingTrack, { backgroundColor: theme.colors.teal50, borderColor: theme.colors.cardBorder }]}>
            <Animated.View
              style={[
                styles.loadingFill,
                {
                  backgroundColor: theme.colors.teal700,
                  width: loadingWidth,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  glowOne: {
    position: 'absolute',
    top: -80,
    left: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.45,
  },
  glowTwo: {
    position: 'absolute',
    right: -80,
    bottom: 120,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.28,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    marginTop: 24,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 260,
  },
  loadingArea: {
    alignItems: 'center',
    width: '100%',
    marginTop: 32,
    paddingHorizontal: 24,
  },
  loadingTrack: {
    width: '60%',
    height: 8,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  loadingFill: {
    height: '100%',
    borderRadius: 999,
  },
});

export default SplashScreen;
