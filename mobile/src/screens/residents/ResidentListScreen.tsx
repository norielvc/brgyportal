import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { User, Users, Phone, MapPin, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Header } from '../../components/Header';
import { SearchBar } from '../../components/SearchBar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { residentsApi, ResidentItem } from '../../api/residents';
import { colors } from '../../theme/colors';

export const ResidentListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [residents, setResidents] = useState<ResidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchResidents = useCallback(async () => {
    try {
      const res = await residentsApi.getAll({
        search: searchQuery.trim() || undefined,
        limit: 100,
      });
      const list: ResidentItem[] = res.data || (Array.isArray(res) ? res : []);
      setResidents(list);
    } catch (e) {
      console.warn('Fetch residents error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResidents();
  };

  const handleCall = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const renderItem = ({ item }: { item: ResidentItem }) => {
    const fullName = `${item.first_name || ''} ${item.middle_name ? item.middle_name[0] + '.' : ''} ${item.last_name || ''} ${item.suffix || ''}`.trim();
    const address = [item.house_number, item.street, item.purok].filter(Boolean).join(', ') || 'Barangay Area';

    return (
      <Card
        onPress={() =>
          navigation.navigate('ResidentProfile', { resident: item })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.first_name?.[0] || 'R') + (item.last_name?.[0] || '')}
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={[styles.name, { color: theme.text }]}>{fullName}</Text>
            <View style={styles.addressRow}>
              <MapPin size={12} color={theme.textMuted} />
              <Text style={[styles.addressText, { color: theme.textSecondary }]} numberOfLines={1}>
                {address}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={theme.textMuted} />
        </View>

        {/* Demographic Tags */}
        <View style={styles.tagsRow}>
          {item.is_voter && <Badge label="VOTER" variant="approved" size="sm" />}
          {item.is_senior && <Badge label="SENIOR" variant="review" size="sm" />}
          {item.is_pwd && <Badge label="PWD" variant="pending" size="sm" />}
          {item.is_4ps && <Badge label="4PS" variant="released" size="sm" />}
          {item.is_solo_parent && <Badge label="SOLO PARENT" variant="medium" size="sm" />}
        </View>

        {item.contact_number ? (
          <View style={[styles.cardFooter, { borderTopColor: theme.divider }]}>
            <Text style={[styles.contactText, { color: theme.textMuted }]}>
              📞 {item.contact_number}
            </Text>
            <TouchableOpacity
              onPress={() => handleCall(item.contact_number)}
              style={styles.callBtn}
            >
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Resident Records"
        subtitle={`${residents.length} registered residents`}
      />

      <View style={styles.filterSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, street, or purok..."
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.emerald[400]} />
        </View>
      ) : (
        <FlatList
          data={residents}
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
              title="No Residents Found"
              description="No resident records match your search criteria."
              icon={<Users size={28} color={colors.emerald[400]} />}
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
  infoCol: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  addressText: {
    fontSize: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
  },
  contactText: {
    fontSize: 12,
    fontWeight: '500',
  },
  callBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  callBtnText: {
    color: colors.emerald[400],
    fontSize: 12,
    fontWeight: '700',
  },
});
