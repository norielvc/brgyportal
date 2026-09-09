import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MessageSquare, User, Clock, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Header } from '../../components/Header';
import { SearchBar } from '../../components/SearchBar';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { kapchatApi, ChatThread } from '../../api/kapchat';
import { colors } from '../../theme/colors';

export const ChatListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchThreads = useCallback(async () => {
    try {
      const list = await kapchatApi.getThreads();
      if (Array.isArray(list) && list.length > 0) {
        setThreads(list);
      } else {
        // Mock sample threads if none created yet
        setThreads([
          {
            thread_id: 'thread-1',
            resident_name: 'Maria Santos',
            last_message: 'Is my Barangay Clearance ready for pickup po?',
            last_message_time: new Date().toISOString(),
            unread_count: 2,
          },
          {
            thread_id: 'thread-2',
            resident_name: 'Juan Dela Cruz',
            last_message: 'Thank you po for approving my Certificate of Indigency.',
            last_message_time: new Date(Date.now() - 3600000).toISOString(),
            unread_count: 0,
          },
          {
            thread_id: 'thread-3',
            resident_name: 'Elena Reyes',
            last_message: 'Good morning po, what are the requirements for Cedula?',
            last_message_time: new Date(Date.now() - 86400000).toISOString(),
            unread_count: 1,
          },
        ]);
      }
    } catch (e) {
      console.warn('Fetch chat threads error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchThreads();
  };

  const filteredThreads = threads.filter((t) =>
    t.resident_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: ChatThread }) => (
    <Card
      onPress={() =>
        navigation.navigate('ChatDetail', { thread: item })
      }
    >
      <View style={styles.threadRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.resident_name.slice(0, 2).toUpperCase()}
          </Text>
        </View>

        <View style={styles.contentCol}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, { color: theme.text }]}>{item.resident_name}</Text>
            <Text style={[styles.timeText, { color: theme.textMuted }]}>
              {new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text
            style={[
              styles.lastMessage,
              { color: item.unread_count > 0 ? theme.text : theme.textSecondary, fontWeight: item.unread_count > 0 ? '700' : '400' },
            ]}
            numberOfLines={1}
          >
            {item.last_message}
          </Text>
        </View>

        {item.unread_count > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.unread_count}</Text>
          </View>
        ) : (
          <ChevronRight size={16} color={theme.textMuted} />
        )}
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="KapChat Messenger"
        subtitle="Live resident inquiries & messages"
      />

      <View style={styles.filterSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search conversations..."
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.emerald[400]} />
        </View>
      ) : (
        <FlatList
          data={filteredThreads}
          keyExtractor={(item) => item.thread_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.emerald[400]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Inquiries"
              description="No resident chat messages found."
              icon={<MessageSquare size={28} color={colors.emerald[400]} />}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.emerald[400],
    fontSize: 15,
    fontWeight: '800',
  },
  contentCol: {
    flex: 1,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
  },
  lastMessage: {
    fontSize: 13,
  },
  badge: {
    backgroundColor: colors.emerald[500],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
});
