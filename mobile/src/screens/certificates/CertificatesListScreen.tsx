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
import { FileText, Filter, Calendar, ChevronRight, Clock } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Header } from '../../components/Header';
import { SearchBar } from '../../components/SearchBar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';
import { certificatesApi, CertificateItem } from '../../api/certificates';
import { colors } from '../../theme/colors';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'under_review', label: 'Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'released', label: 'Released' },
  { key: 'rejected', label: 'Rejected' },
];

export const CertificatesListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCertificates = useCallback(async () => {
    try {
      const res = await certificatesApi.getAll({
        status: activeTab === 'all' ? undefined : activeTab,
        search: searchQuery.trim() || undefined,
        limit: 100,
      });
      const list: CertificateItem[] = res.data || (Array.isArray(res) ? res : []);
      setCertificates(list);
    } catch (e) {
      console.warn('Fetch certificates error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCertificates();
  };

  const renderItem = ({ item }: { item: CertificateItem }) => {
    const applicantName = item.applicant_name || `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Resident';
    const dateFormatted = item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

    return (
      <Card
        onPress={() =>
          navigation.navigate('CertificateDetail', { certificate: item })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleArea}>
            <Text style={[styles.applicantName, { color: theme.text }]}>
              {applicantName}
            </Text>
            <Text style={[styles.certType, { color: colors.emerald[400] }]}>
              {item.certificate_type}
            </Text>
          </View>
          <Badge label={item.status} variant={item.status as any} size="sm" />
        </View>

        <View style={styles.cardDetails}>
          <Text style={[styles.refText, { color: theme.textMuted }]}>
            Ref: {item.reference_number || item.id?.slice(0, 8)}
          </Text>
          {item.purpose ? (
            <Text
              style={[styles.purposeText, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              Purpose: {item.purpose}
            </Text>
          ) : null}
        </View>

        <View style={[styles.cardFooter, { borderTopColor: theme.divider }]}>
          <View style={styles.footerInfo}>
            <Calendar size={13} color={theme.textMuted} />
            <Text style={[styles.dateText, { color: theme.textMuted }]}>
              {dateFormatted}
            </Text>
          </View>
          <View style={styles.footerAction}>
            <Text style={[styles.feeText, { color: theme.text }]}>
              {item.fee ? `₱${item.fee}.00` : 'Free'}
            </Text>
            <ChevronRight size={16} color={theme.textMuted} />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header
        title="Certificates"
        subtitle="Manage clearances & document workflows"
      />

      <View style={styles.filterSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, ref #, purpose..."
        />

        {/* Status Horizontal Tabs */}
        <FlatList
          horizontal
          data={STATUS_TABS}
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
          data={certificates}
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
              title="No Certificates Found"
              description={
                searchQuery
                  ? `No requests matching "${searchQuery}".`
                  : `No ${activeTab !== 'all' ? activeTab : ''} certificate requests at the moment.`
              }
              icon={<FileText size={28} color={colors.emerald[400]} />}
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleArea: {
    flex: 1,
    marginRight: 8,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '800',
  },
  certType: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  cardDetails: {
    marginBottom: 10,
    gap: 2,
  },
  refText: {
    fontSize: 12,
    fontWeight: '500',
  },
  purposeText: {
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 11,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feeText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
