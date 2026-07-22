import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { scaleFont, scaleModerate } from '../utils';

// Module-level bridge so showAlert() can be called from anywhere — event
// handlers, async catch blocks, hooks — exactly like the native Alert.alert
// it replaces, without needing a hook/context at every call site. Set by
// the single <ThemedAlertHost /> mounted once in App.jsx.
let showHandler = null;

// Drop-in replacement for Alert.alert(title, message, buttons) that renders
// using the app theme instead of the native OS dialog.
export function showAlert(title, message, buttons) {
  showHandler?.(title, message, buttons);
}

export function ThemedAlertHost() {
  const theme = useTheme();
  const [request, setRequest] = React.useState(null);

  React.useEffect(() => {
    showHandler = (title, message, buttons) => setRequest({ title, message, buttons });
    return () => {
      showHandler = null;
    };
  }, []);

  const close = () => setRequest(null);

  if (!request) {
    return null;
  }

  const buttons = request.buttons?.length ? request.buttons : [{ text: 'OK' }];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.surfaces.card, borderColor: theme.colors.cardBorder }]}
          onPress={() => {}}
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 52, 44, 0.4)',
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
