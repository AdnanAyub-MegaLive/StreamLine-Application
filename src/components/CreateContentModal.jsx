import React from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme } from '../theme';
import { scaleFont, scaleModerate } from '../utils';

function PostIcon({ size = 24, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2.5" stroke={color} strokeWidth="1.8" />
      <Path d="M3 15l4.5-4.5a1.5 1.5 0 0 1 2.1 0L13 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13 13.5l1.6-1.6a1.5 1.5 0 0 1 2.1 0L21 15.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.5 8.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" fill={color} />
    </Svg>
  );
}

function ReelIcon({ size = 24, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3.5" width="18" height="17" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M8 3.5v17M16 3.5v17M3 9h5M16 9h5M3 15h5M16 15h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M10.5 10.7v2.6l2.2-1.3-2.2-1.3Z" fill={color} />
    </Svg>
  );
}

function OptionButton({ label, color, onPress, children }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.optionColumn}>
      <Animated.View style={[styles.optionCircle, { backgroundColor: color, borderColor: theme.colors.secondary, shadowColor: theme.colors.secondary }]}>{children}</Animated.View>
      <Text style={[styles.optionLabel, { color: theme.text.primary }]}>{label}</Text>
    </Pressable>
  );
}

// Shown when the navbar's center "+" button is tapped while on the
// Discover tab — lets the user pick between a static feed post or a
// short-form reel, same rise-from-the-button animation as
// StreamOptionModal's Audio/Live picker.
export function CreateContentModal({ visible, onClose, onSelectPost, onSelectReel }) {
  const theme = useTheme();
  const [mounted, setMounted] = React.useState(visible);
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(progress, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 60
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      }).start(({ finished }) => {
        if (finished) {
          setMounted(false);
        }
      });
    }
  }, [visible, progress]);

  if (!mounted) {
    return null;
  }

  const animatedStyle = {
    opacity: progress,
    transform: [
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [90, 0] }) }
    ]
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={animatedStyle}>
          <Pressable style={styles.row} onPress={() => {}}>
            <OptionButton label="Create Post" color={theme.colors.teal700} onPress={onSelectPost}>
              <PostIcon color={theme.cta.primary.text} />
            </OptionButton>

            <OptionButton label="Create Reel" color={theme.colors.tertiary} onPress={onSelectReel}>
              <ReelIcon color={theme.cta.primary.text} />
            </OptionButton>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: scaleModerate(150)
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(56)
  },
  optionColumn: {
    alignItems: 'center',
    gap: scaleModerate(8)
  },
  optionCircle: {
    width: scaleModerate(58),
    height: scaleModerate(58),
    borderRadius: scaleModerate(29),
    borderWidth: scaleModerate(3),
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: scaleModerate(14),
    elevation: 10
  },
  optionLabel: {
    fontSize: scaleFont(12),
    fontWeight: '600'
  }
});

export default CreateContentModal;
