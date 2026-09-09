import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  ShieldAlert,
  MapPin,
  Calendar,
  User,
  Phone,
  FileText,
  CheckCircle2,
  Clock,
  Scale,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { blotterApi, BlotterItem } from '../../api/blotter';
import { colors } from '../../theme/colors';

export const BlotterDetailScreen: React.FC<{
  route?: any;
  navigation?: any;
}> = ({ route, navigation }) => {
  const blotter: BlotterItem = route?.params?.blotter || {
    id: 'unknown',
    incident_type: 'Incident Report',
    complainant_name: 'Resident',
    respondent_name: 'Respondent',
    incident_date: new Date().toISOString(),
    incident_location: 'Barangay Area',
    narrative: 'No narrative provided.',
    status: 'active',
    created_at: new Date().toISOString(),
  };
  const { theme } = useTheme();

  const [currentBlotter, setCurrentBlotter] = useState<BlotterItem>(blotter);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentBlotter.status);
  const [resolutionNotes, setResolutionNotes] = useState(currentBlotter.resolution_notes || '');
  const [hearingDate, setHearingDate] = useState(currentBlotter.hearing_date || '');

  const handleUpdateStatus = async () => {
    setActionLoading(true);
    try {
      await blotterApi.updateStatus(currentBlotter.id, {
        status: selectedStatus,
        resolution_notes: resolutionNotes.trim() || undefined,
        hearing_date: hearingDate.trim() || undefined,
      });

      setCurrentBlotter({
        ...currentBlotter,
        status: selectedStatus as any,
        resolution_notes: resolutionNotes.trim() || currentBlotter.resolution_notes,
        hearing_date: hearingDate.trim() || currentBlotter.hearing_date,
      });
      setStatusModal(false);
      Alert.alert('Updated', 'Blotter incident status has been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to update blotter');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Navbar */}
      <View style={[styles.navBar, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text }]} numberOfLines={1}>
          Incident #{currentBlotter.id?.slice(0, 8)}
        </Text>
        <Badge
          label={currentBlotter.status}
          variant={currentBlotter.status as any}
          size="sm"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Incident Summary Card */}
        <Card>
          <View style={styles.headerArea}>
            <Text style={[styles.incidentType, { color: theme.text }]}>
              {currentBlotter.incident_type}
            </Text>
            <Badge
              label={currentBlotter.priority || 'Medium'}
              variant={(currentBlotter.priority || 'medium') as any}
            />
          </View>

          <View style={styles.detailRow}>
            <MapPin size={16} color={theme.textMuted} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {currentBlotter.incident_location || 'Barangay Area'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Calendar size={16} color={theme.textMuted} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>
              {new Date(currentBlotter.incident_date || currentBlotter.created_at).toLocaleString()}
            </Text>
          </View>
        </Card>

        {/* Involved Parties */}
        <Card>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            INVOLVED PARTIES
          </Text>

          <View style={styles.partyBox}>
            <Text style={[styles.partyRole, { color: colors.emerald[400] }]}>COMPLAINANT</Text>
            <Text style={[styles.partyName, { color: theme.text }]}>
              {currentBlotter.complainant_name}
            </Text>
            {currentBlotter.complainant_contact ? (
              <Text style={[styles.partyContact, { color: theme.textMuted }]}>
                Contact: {currentBlotter.complainant_contact}
              </Text>
            ) : null}
          </View>

          <View style={[styles.partyBox, { marginTop: 10 }]}>
            <Text style={[styles.partyRole, { color: colors.rose[400] }]}>RESPONDENT</Text>
            <Text style={[styles.partyName, { color: theme.text }]}>
              {currentBlotter.respondent_name || 'Unidentified'}
            </Text>
            {currentBlotter.respondent_address ? (
              <Text style={[styles.partyContact, { color: theme.textMuted }]}>
                Address: {currentBlotter.respondent_address}
              </Text>
            ) : null}
          </View>
        </Card>

        {/* Narrative */}
        <Card>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            INCIDENT NARRATIVE
          </Text>
          <Text style={[styles.narrativeText, { color: theme.text }]}>
            {currentBlotter.narrative}
          </Text>
        </Card>

        {/* Mediation Notes */}
        {currentBlotter.resolution_notes && (
          <Card>
            <Text style={[styles.sectionLabel, { color: colors.emerald[400] }]}>
              RESOLUTION & MEDIATION NOTES
            </Text>
            <Text style={[styles.narrativeText, { color: theme.text }]}>
              {currentBlotter.resolution_notes}
            </Text>
          </Card>
        )}

        {/* Action Button */}
        <View style={{ marginTop: 16 }}>
          <Button
            title="Update Incident / Mediation Status"
            onPress={() => setStatusModal(true)}
            size="lg"
            icon={<Scale size={20} color={colors.white} />}
          />
        </View>
      </ScrollView>

      {/* Update Status Modal */}
      <Modal visible={statusModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Update Blotter Status</Text>

            {/* Status Pills */}
            <View style={styles.pillsRow}>
              {['active', 'mediation_scheduled', 'settled', 'escalated'].map((st) => (
                <TouchableOpacity
                  key={st}
                  onPress={() => setSelectedStatus(st as any)}
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: selectedStatus === st ? colors.emerald[600] : theme.surface,
                      borderColor: selectedStatus === st ? colors.emerald[400] : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: selectedStatus === st ? colors.white : theme.textSecondary },
                    ]}
                  >
                    {st.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Mediation Notes / Hearing Details
            </Text>
            <TextInput
              value={resolutionNotes}
              onChangeText={setResolutionNotes}
              placeholder="Enter agreement terms or mediation outcome..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              style={[styles.modalTextArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            />

            <View style={styles.modalBtns}>
              <Button
                title="Cancel"
                onPress={() => setStatusModal(false)}
                variant="ghost"
                style={{ flex: 1 }}
              />
              <Button
                title="Save Status"
                onPress={handleUpdateStatus}
                loading={actionLoading}
                variant="primary"
                style={{ flex: 1, marginLeft: 10 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  navTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    marginHorizontal: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 8,
  },
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  incidentType: {
    fontSize: 18,
    fontWeight: '800',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  detailText: {
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  partyBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  partyRole: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  partyName: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  partyContact: {
    fontSize: 12,
    marginTop: 2,
  },
  narrativeText: {
    fontSize: 14,
    lineHeight: 22,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalTextArea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    height: 90,
    fontSize: 14,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  modalBtns: {
    flexDirection: 'row',
  },
});
