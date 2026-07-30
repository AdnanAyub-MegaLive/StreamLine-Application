import React from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme';
import { Avatar, Screen } from '../../components';
import { fetchMessages, markConversationRead } from '../../api';
import { useUserAssets } from '../../hooks';
import { routes } from '../../navigation/routes';
import { getSessionSocket, sendMessage } from '../../services/socket';
import { useAppStore } from '../../store';
import { scaleFont, scaleModerate } from '../../utils';

// See StreamLine-Portal/docs/mobile-messaging-api.md. Opened from
// MessageScreen's World Chat row or a Recent conversation row.
function MessageBubble({ message, isOwn }) {
  const theme = useTheme();
  return <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
      <View style={[styles.bubble, {
        backgroundColor: isOwn ? theme.colors.teal700 : theme.surfaces.card,
        borderColor: isOwn ? theme.colors.teal700 : theme.colors.cardBorder
      }]}>
        {!isOwn ? <Text style={[styles.bubbleSender, { color: theme.colors.teal400 }]}>{message.senderName}</Text> : null}
        <Text style={[styles.bubbleText, { color: isOwn ? theme.cta.primary.text : theme.text.primary }]}>{message.body}</Text>
      </View>
    </View>;
}

export function ConversationScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { conversationId, name, avatar, participantId, frameUrl } = route.params ?? {};
  const sessionToken = useAppStore(state => state.session?.token);
  const myPublicId = useAppStore(state => state.session?.user?.publicId);
  // 'world-chat' is a fake, never-real userId — passing undefined here
  // would make useUserAssets fall back to resolving the signed-in user's
  // own frame for the World Chat header (and clear their real cached
  // frame while doing it), instead of just showing no frame.
  const { frameUri } = useUserAssets({ userId: participantId ?? 'world-chat', frameUrl: participantId ? frameUrl : null });
  const [messages, setMessages] = React.useState([]);
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const listRef = React.useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const { messages: history } = await fetchMessages(sessionToken, conversationId, { limit: 50 });
          if (!cancelled) {
            setMessages(history ?? []);
          }
        } catch {
          // Leaves the list empty — the send box still works for a first message.
        }
        markConversationRead(sessionToken, conversationId).catch(() => {});
      })();

      const socket = getSessionSocket();
      const handleMessageNew = event => {
        if (event?.conversationId === conversationId && !cancelled) {
          setMessages(previous => [...previous, event.message]);
          markConversationRead(sessionToken, conversationId).catch(() => {});
        }
      };
      socket?.on('message:new', handleMessageNew);

      return () => {
        cancelled = true;
        socket?.off('message:new', handleMessageNew);
      };
    }, [sessionToken, conversationId])
  );

  const handleSend = () => {
    const body = draft.trim();
    if (!body || sending) {
      return;
    }
    setSending(true);
    setDraft('');
    sendMessage(conversationId, body, ack => {
      setSending(false);
      if (!ack?.success) {
        setDraft(body);
      }
    });
  };

  return <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={[styles.backChevron, { color: theme.text.primary }]}>‹</Text>
        </Pressable>
        <Pressable
          onPress={() => participantId && navigation.navigate(routes.userProfile, { userId: participantId, userName: name, userAvatar: avatar, userFrameUrl: frameUrl })}
          disabled={!participantId}
        >
          <Avatar value={avatar} fullName={name} size={scaleModerate(34)} frameUri={frameUri} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]} numberOfLines={1}>{name}</Text>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={scaleModerate(12)}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <MessageBubble message={item} isOwn={item.senderId === myPublicId} />}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />
        <View style={[styles.inputRow, { borderColor: theme.colors.cardBorder, backgroundColor: theme.surfaces.card }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message..."
            placeholderTextColor={theme.text.secondary}
            style={[styles.input, { color: theme.text.primary }]}
            multiline
          />
          <Pressable onPress={handleSend} disabled={!draft.trim() || sending} style={[styles.sendButton, { backgroundColor: theme.colors.teal700, opacity: draft.trim() ? 1 : 0.5 }]}>
            <Text style={[styles.sendButtonText, { color: theme.cta.primary.text }]}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleModerate(10),
    paddingHorizontal: scaleModerate(16),
    paddingTop: scaleModerate(14),
    paddingBottom: scaleModerate(10)
  },
  backChevron: {
    fontSize: scaleFont(28),
    fontWeight: '700'
  },
  headerTitle: {
    flex: 1,
    fontSize: scaleFont(16),
    fontWeight: '800'
  },
  list: {
    padding: scaleModerate(16),
    gap: scaleModerate(8)
  },
  bubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  bubbleRowOwn: {
    justifyContent: 'flex-end'
  },
  bubble: {
    maxWidth: '78%',
    borderWidth: 1,
    borderRadius: scaleModerate(14),
    paddingHorizontal: scaleModerate(12),
    paddingVertical: scaleModerate(8)
  },
  bubbleSender: {
    fontSize: scaleFont(11),
    fontWeight: '700',
    marginBottom: scaleModerate(2)
  },
  bubbleText: {
    fontSize: scaleFont(13.5)
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: scaleModerate(10),
    borderTopWidth: 1,
    paddingHorizontal: scaleModerate(12),
    paddingVertical: scaleModerate(10)
  },
  input: {
    flex: 1,
    fontSize: scaleFont(14),
    maxHeight: scaleModerate(100)
  },
  sendButton: {
    borderRadius: 999,
    paddingHorizontal: scaleModerate(16),
    paddingVertical: scaleModerate(9)
  },
  sendButtonText: {
    fontSize: scaleFont(13),
    fontWeight: '700'
  }
});

export default ConversationScreen;
