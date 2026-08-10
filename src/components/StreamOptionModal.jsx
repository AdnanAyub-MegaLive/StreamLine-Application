import React from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme';
import { scaleFont, scaleModerate } from '../utils';

function MicIcon({ size = 24, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15.5a3.5 3.5 0 0 0 3.5-3.5V6.5a3.5 3.5 0 0 0-7 0V12a3.5 3.5 0 0 0 3.5 3.5Z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M7 11v1a5 5 0 0 0 10 0v-1" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M12 18.5V21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function VideoIcon({ size = 24, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Path d="M15 10.5 21 7v10l-6-3.5" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
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

// Shown when the navbar's center "+" button is tapped — lets the user pick
// between starting an audio-only room or a live video stream. Animates in
// as if emerging from that button (scale + rise up) and shrinks back into
// it when dismissed, instead of a plain fade.
export function StreamOptionModal({ visible, onClose, onSelectAudio, onSelectVideo }) {
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
            <OptionButton label="Audio Room" color={theme.colors.teal700} onPress={onSelectAudio}>
              <MicIcon color={theme.cta.primary.text} />
            </OptionButton>

            <OptionButton label="Live Video" color={theme.colors.giftAccent} onPress={onSelectVideo}>
              <VideoIcon color={theme.cta.primary.text} />
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

export default StreamOptionModal;
