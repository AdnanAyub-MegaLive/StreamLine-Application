import React from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { scaleFont, scaleModerate } from '../utils';

// Module-level bridge so showAlert() can be called from anywhere — event
// handlers, async catch blocks, hooks — exactly like the native Alert.alert
// it replaces, without needing a hook/context at every call site. Set by
// the single <ThemedAlertHost /> mounted once in App.jsx.
let showHandler = null;

// Drop-in replacement for Alert.alert(title, message, buttons) that renders
// using the app theme instead of the native OS dialog. Calls are queued —
// if one alert is already showing, a second call waits its turn instead of
// silently replacing the first before the user ever saw/dismissed it.
export function showAlert(title, message, buttons) {
  showHandler?.(title, message, buttons);
}

// Uses a real <Modal>, not a plain absolutely-positioned overlay — a plain
// overlay was tried here once and reverted: screens using react-navigation
// (react-native-screens) each get their own native Android surface, and a
// same-tree overlay's touches weren't reliably dispatched over that (the
// alert rendered fine but its buttons silently stopped responding — e.g.
// Room screen's "End Room" confirmation neither ended the room nor
// navigated back). A Modal opens its own native window, which Android
// always routes touches to correctly regardless of what's underneath.
//
// The actual bug that motivated removing the Modal — Room screen's chat
// MaskedView rendering solid black while a Modal is open — is fixed at the
// source instead: see the `renderToHardwareTextureAndroid` prop on that
// MaskedView in RoomScreen.jsx, which forces it onto its own hardware layer
// so a Modal's separate window no longer corrupts its surface.
export function ThemedAlertHost() {
  const theme = useTheme();
  const [request, setRequest] = React.useState(null);
  const queueRef = React.useRef([]);
  const progress = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    showHandler = (title, message, buttons) => {
      const next = { title, message, buttons };
      // Read/write the queue via a ref (not state) so a burst of calls in
      // the same tick all enqueue correctly — setRequest below is what
      // actually triggers the first one to render.
      setRequest(current => {
        if (current) {
          queueRef.current.push(next);
          return current;
        }
        return next;
      });
    };
    return () => {
      showHandler = null;
    };
  }, []);

  React.useEffect(() => {
    if (!request) {
      return undefined;
    }
    progress.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 65
    }).start();
  }, [request, progress]);

  const advanceQueue = () => {
    const next = queueRef.current.shift();
    setRequest(next ?? null);
  };

  const close = () => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true
    }).start(({ finished }) => {
      if (finished) {
        advanceQueue();
      }
    });
  };

  if (!request) {
    return null;
  }

  const buttons = request.buttons?.length ? request.buttons : [{ text: 'OK' }];
  const backdropStyle = { opacity: progress };
  const cardStyle = {
    opacity: progress,
    transform: [
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }
    ]
  };

  return (
    <Modal visible transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View
          style={[styles.card, cardStyle, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
        >
          {request.title ? <Text style={[styles.title, { color: theme.text.primary }]}>{request.title}</Text> : null}
          {request.message ? (
            <Text style={[styles.message, { color: theme.text.secondary }]}>{request.message}</Text>
          ) : null}
          <View style={[styles.buttonRow, { borderTopColor: theme.colors.cardBorder }]}>
            {buttons.map((button, index) => (
              <Pressable
                key={`${button.text}-${index}`}
                style={[styles.button, index > 0 && { borderLeftWidth: 1, borderLeftColor: theme.colors.cardBorder }]}
                onPress={() => {
                  close();
                  button.onPress?.();
                }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'cancel' && styles.buttonTextRegular,
                    {
                      color:
                        button.style === 'destructive'
                          ? theme.colors.liveBadge
                          : button.style === 'cancel'
                            ? theme.text.secondary
                            : theme.colors.teal700
                    }
                  ]}
                >
                  {button.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 52, 44, 0.4)'
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleModerate(36)
  },
  card: {
    width: '100%',
    maxWidth: scaleModerate(320),
    borderRadius: scaleModerate(16),
    borderWidth: 1,
    overflow: 'hidden',
    paddingTop: scaleModerate(20),
    paddingHorizontal: scaleModerate(20)
  },
  title: {
    fontSize: scaleFont(16),
    fontWeight: '700',
    textAlign: 'center'
  },
  message: {
    marginTop: scaleModerate(8),
    fontSize: scaleFont(13.5),
    lineHeight: scaleFont(19),
    textAlign: 'center'
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: scaleModerate(20),
    marginHorizontal: -scaleModerate(20),
    borderTopWidth: 1
  },
  button: {
    flex: 1,
    paddingVertical: scaleModerate(13),
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    fontSize: scaleFont(14.5),
    fontWeight: '700'
  },
  buttonTextRegular: {
    fontWeight: '500'
  }
});

export default ThemedAlertHost;
