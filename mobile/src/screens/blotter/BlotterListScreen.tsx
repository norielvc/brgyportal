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
import { ShieldAlert, Plus, MapPin, Calendar, User, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Header } from '../../components/Header';
import { SearchBar } from '../../components/SearchBar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { blotterApi, BlotterItem } from '../../api/blotter';
import { colors } from '../../theme/colors';

const BLOTTER_TABS = [
  { key: 'all', label: 'All Incidents' },
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active / Investigation' },
  { key: 'mediation_scheduled', label: 'Mediation' },
  { key: 'settled', label: 'Settled' },
];

export const BlotterListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [blotters, setBlotters] = useState<BlotterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBlotters = useCallback(async () => {
    try {
      const res = await blotterApi.getAll({
        status: activeTab === 'all' ? undefined : activeTab,
        search: searchQuery.trim() || undefined,
        limit: 100,
      });
      const list: BlotterItem[] = res.data || (Array.isArray(res) ? res : []);
      setBlotters(list);
    } catch (e) {
      console.warn('Fetch blotters error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchBlotters();
  }, [fetchBlotters]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBlotters();
  };

  const renderItem = ({ item }: { item: BlotterItem }) => {
    const dateFormatted = item.incident_date || item.created_at
      ? new Date(item.incident_date || item.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '';

    return (
      <Card
        onPress={() =>
          navigation.navigate('BlotterDetail', { blotter: item })
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.typeContainer}>
            <Text style={[styles.incidentType, { color: theme.text }]}>
              {item.incident_type}
            </Text>
            <Text style={[styles.parties, { color: theme.textSecondary }]}>
              {item.complainant_name} vs. {item.respondent_name || 'Unidentified'}
            </Text>
          </View>
          <Badge
            label={item.priority || item.status}
            variant={(item.priority || item.status) as any}
            size="sm"
          />
        </View>

        <Text
          style={[styles.narrative, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {item.narrative}
        </Text>

        <View style={[styles.footerRow, { borderTopColor: theme.divider }]}>
          <View style={styles.metaItem}>
            <MapPin size={13} color={theme.textMuted} />
            <Text style={[styles.metaText, { color: theme.textMuted }]} numberOfLines={1}>
              {item.incident_location || 'Barangay Area'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Calendar size={13} color={theme.textMuted} />
            <Text style={[styles.metaText, { color: theme.textMuted }]}>{dateFormatted}</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Blotter & E-Sumbong"
        subtitle="Incident reporting & mediation records"
      />

      <View style={styles.filterSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by complainant, respondent, type..."
        />

        <FlatList
          horizontal
          data={BLOTTER_TABS}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabsContainer}
          renderItem={({ item }) => {
            const isSelected = activeTab === item.key;
            return (
              <TouchableOpacity
                onPress={() => setActiveTab(item.key)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: isSelected ? colors.emerald[600] : theme.surface,
                    borderColor: isSelected ? colors.emerald[400] : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    { color: isSelected ? colors.white : theme.textSecondary },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.emerald[400]} />
        </View>
      ) : (
        <FlatList
          data={blotters}
          keyExtractor={(item) => item.id}
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
              title="No Blotter Records"
              description="No incident reports matching your criteria."
              icon={<ShieldAlert size={28} color={colors.emerald[400]} />}
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
  tabsContainer: {
    paddingVertical: 8,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 6,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '700',
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeContainer: {
    flex: 1,
    marginRight: 8,
  },
  incidentType: {
    fontSize: 16,
    fontWeight: '800',
  },
  parties: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  narrative: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
  },
});
