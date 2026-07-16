import React, { useEffect } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '../../store';
import { BrandMark, Screen } from '../../components';
import { routes, type RootStackParamList } from '../../navigation';

type SplashScreenProps = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen(_: SplashScreenProps) {
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
    <Screen transparent>
      <View style={styles.content}>
        <BrandMark size={144} />
        <Text style={styles.title}>Streamline</Text>
        <Text style={styles.subtitle}>Connecting players in a premium lounge experience.</Text>

        <View style={styles.loadingArea}>
          <View style={styles.loadingTrack}>
            <Animated.View style={[styles.loadingFill, { width: loadingWidth }]} />
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 160,
  },
  title: {
    marginTop: 18,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 260,
    color: 'rgba(255, 255, 255, 0.85)',
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
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  loadingFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
});

export default SplashScreen;
