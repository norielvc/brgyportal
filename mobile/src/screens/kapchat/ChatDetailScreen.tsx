import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { ArrowLeft, Send, CheckCheck, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { kapchatApi, ChatMessage, ChatThread } from '../../api/kapchat';
import { colors } from '../../theme/colors';

const QUICK_RESPONSES = [
  'Magandang araw! Your certificate is now APPROVED and ready for pickup po.',
  'Please bring at least 1 valid government-issued ID upon claiming.',
  'Your request is currently under review by our Barangay Officer.',
  'May we request a clearer photo of your proof of residency po?',
];

export const ChatDetailScreen: React.FC<{
  route?: any;
  navigation?: any;
}> = ({ route, navigation }) => {
  const thread: ChatThread = route?.params?.thread || {
    thread_id: 'default-thread',
    resident_name: 'Resident',
    last_message: '',
    last_message_time: new Date().toISOString(),
    unread_count: 0,
  };
  const { theme } = useTheme();
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Initial messages
    setMessages([
      {
        id: '1',
        sender_type: 'resident',
        sender_name: thread.resident_name,
        message: thread.last_message,
        created_at: thread.last_message_time,
      },
    ]);
  }, [thread]);

  const handleSend = async (textToSend?: string) => {
    const msg = textToSend || inputText;
    if (!msg.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender_type: 'admin',
      sender_name: `${user?.firstName || 'Barangay'} (${user?.role || 'Staff'})`,
      message: msg.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    if (!textToSend) setInputText('');

    try {
      await kapchatApi.sendMessage({
        thread_id: thread.thread_id,
        message: msg.trim(),
        sender_name: newMessage.sender_name,
      });
    } catch (e) {
      console.warn('Send message error:', e);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {/* Top Bar */}
      <View style={[styles.navBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.residentName, { color: theme.text }]}>
            {thread.resident_name}
          </Text>
          <Text style={[styles.statusText, { color: colors.emerald[400] }]}>
            Online • Resident
          </Text>
        </View>
      </View>

      {/* Message List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isAdmin = item.sender_type === 'admin';
          return (
            <View
              style={[
                styles.bubbleWrapper,
                isAdmin ? styles.adminWrapper : styles.residentWrapper,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isAdmin
                    ? { backgroundColor: colors.emerald[600] }
                    : { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 },
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    { color: isAdmin ? colors.white : theme.text },
                  ]}
                >
                  {item.message}
                </Text>
                <View style={styles.timeRow}>
                  <Text
                    style={[
                      styles.timeText,
                      { color: isAdmin ? 'rgba(255,255,255,0.7)' : theme.textMuted },
                    ]}
                  >
                    {new Date(item.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {isAdmin && <CheckCheck size={12} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Quick Responses Horizontal Scroll */}
      <View style={[styles.quickChipsContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {QUICK_RESPONSES.map((chip, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleSend(chip)}
              style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            >
              <Sparkles size={12} color={colors.emerald[400]} style={{ marginRight: 4 }} />
              <Text style={[styles.chipText, { color: theme.textSecondary }]} numberOfLines={1}>
                {chip}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Bar */}
      <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type message to resident..."
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
          multiline
        />
        <TouchableOpacity
          onPress={() => handleSend()}
          disabled={!inputText.trim()}
          style={[
            styles.sendBtn,
            { backgroundColor: inputText.trim() ? colors.emerald[600] : theme.surface },
          ]}
        >
          <Send size={18} color={inputText.trim() ? colors.white : theme.textMuted} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerInfo: {
    marginLeft: 12,
  },
  residentName: {
    fontSize: 16,
    fontWeight: '800',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },
  bubbleWrapper: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  adminWrapper: {
    alignSelf: 'flex-end',
  },
  residentWrapper: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
  },
  quickChipsContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  chipsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 260,
  },
  chipText: {
    fontSize: 12,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 90,
    fontSize: 14,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
