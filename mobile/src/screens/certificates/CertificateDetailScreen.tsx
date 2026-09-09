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
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  FileCheck2,
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ExternalLink,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { certificatesApi, CertificateItem } from '../../api/certificates';
import { colors } from '../../theme/colors';

interface DetailProps {
  route?: any;
  navigation?: any;
}

export const CertificateDetailScreen: React.FC<DetailProps> = ({ route, navigation }) => {
  const certificate: CertificateItem = route?.params?.certificate || {
    id: 'unknown',
    reference_number: 'N/A',
    certificate_type: 'Barangay Certificate',
    purpose: '',
    status: 'pending',
    fee: 0,
    created_at: new Date().toISOString(),
    tenant_id: 'ibaoeste',
  };
  const { theme } = useTheme();

  const [currentCert, setCurrentCert] = useState<CertificateItem>(certificate);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals for actions
  const [approveModal, setApproveModal] = useState(false);
  const [orNumberInput, setOrNumberInput] = useState(currentCert.or_number || '');
  const [sendBackModal, setSendBackModal] = useState(false);
  const [sendBackNotes, setSendBackNotes] = useState('');
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const applicantName =
    currentCert.applicant_name ||
    `${currentCert.first_name || ''} ${currentCert.last_name || ''}`.trim() ||
    'Resident';

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await certificatesApi.updateStatus(currentCert.id, {
        status: 'approved',
        action: 'approve',
        orNumber: orNumberInput.trim() || undefined,
      });
      setCurrentCert({
        ...currentCert,
        status: 'approved',
        or_number: orNumberInput.trim() || currentCert.or_number,
      });
      setApproveModal(false);
      Alert.alert('Approved', 'Certificate request has been approved successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendBack = async () => {
    if (!sendBackNotes.trim()) {
      Alert.alert('Required', 'Please enter instructions or missing requirements for the resident.');
      return;
    }
    setActionLoading(true);
    try {
      await certificatesApi.updateStatus(currentCert.id, {
        status: 'send_back',
        action: 'send_back',
        remarks: sendBackNotes.trim(),
      });
      setCurrentCert({
        ...currentCert,
        status: 'send_back',
        sendback_notes: sendBackNotes.trim(),
      });
      setSendBackModal(false);
      Alert.alert('Sent Back', 'Revision request sent back to the applicant.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to send back');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Required', 'Please provide a valid reason for rejection.');
      return;
    }
    setActionLoading(true);
    try {
      await certificatesApi.updateStatus(currentCert.id, {
        status: 'rejected',
        action: 'reject',
        reason: rejectReason.trim(),
      });
      setCurrentCert({
        ...currentCert,
        status: 'rejected',
        rejection_reason: rejectReason.trim(),
      });
      setRejectModal(false);
      Alert.alert('Rejected', 'Certificate request has been rejected.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = async () => {
    setActionLoading(true);
    try {
      await certificatesApi.markAsReleased(
        currentCert.reference_number || currentCert.id,
        currentCert.or_number
      );
      setCurrentCert({ ...currentCert, status: 'released' });
      Alert.alert('Released', 'Document marked as released and handed over to resident.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to mark as released');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Custom Top Navigation Bar */}
      <View style={[styles.navBar, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text }]} numberOfLines={1}>
          {currentCert.certificate_type}
        </Text>
        <Badge label={currentCert.status} variant={currentCert.status as any} size="sm" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Tracking & Ref Card */}
        <Card>
          <View style={styles.cardSection}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              DOCUMENT REFERENCE
            </Text>
            <Text style={[styles.refNumber, { color: colors.emerald[400] }]}>
              {currentCert.reference_number || currentCert.id}
            </Text>
            <Text style={[styles.certTitleText, { color: theme.text }]}>
              {currentCert.certificate_type}
            </Text>
          </View>
        </Card>

        {/* Applicant Details Card */}
        <Card>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            APPLICANT INFORMATION
          </Text>
          <View style={styles.detailRow}>
            <User size={18} color={theme.textMuted} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Full Name</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{applicantName}</Text>
            </View>
          </View>

          {currentCert.contact_number && (
            <View style={styles.detailRow}>
              <Phone size={18} color={theme.textMuted} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Contact</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {currentCert.contact_number}
                </Text>
              </View>
            </View>
          )}

          {currentCert.email && (
            <View style={styles.detailRow}>
              <Mail size={18} color={theme.textMuted} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Email</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{currentCert.email}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <Calendar size={18} color={theme.textMuted} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Date Requested</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {new Date(currentCert.created_at).toLocaleString()}
              </Text>
            </View>
          </View>
        </Card>

        {/* Purpose & Official Receipt */}
        <Card>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            PURPOSE & PAYMENT
          </Text>
          <View style={{ marginBottom: 12 }}>
            <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Stated Purpose</Text>
            <Text style={[styles.infoValue, { color: theme.text, marginTop: 2 }]}>
              {currentCert.purpose || 'General / Official Transaction'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <CreditCard size={18} color={theme.textMuted} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>
                Official Receipt (OR) Number
              </Text>
              <Text style={[styles.infoValue, { color: theme.text, fontWeight: '700' }]}>
                {currentCert.or_number || 'Pending Assignment'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <ShieldCheck size={18} color={theme.textMuted} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Document Fee</Text>
              <Text style={[styles.infoValue, { color: colors.emerald[400], fontWeight: '700' }]}>
                {currentCert.fee ? `₱${currentCert.fee}.00` : 'Free of Charge'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Remarks / Rejection notes */}
        {currentCert.rejection_reason && (
          <Card style={{ borderColor: 'rgba(244, 63, 94, 0.4)' }}>
            <Text style={[styles.sectionLabel, { color: colors.rose[500] }]}>
              REJECTION REASON
            </Text>
            <Text style={[styles.infoValue, { color: theme.text, marginTop: 4 }]}>
              {currentCert.rejection_reason}
            </Text>
          </Card>
        )}

        {currentCert.sendback_notes && (
          <Card style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
            <Text style={[styles.sectionLabel, { color: colors.amber[500] }]}>
              SENDBACK CORRECTION INSTRUCTIONS
            </Text>
            <Text style={[styles.infoValue, { color: theme.text, marginTop: 4 }]}>
              {currentCert.sendback_notes}
            </Text>
          </Card>
        )}

        {/* Action Controls */}
        <View style={styles.actionSection}>
          {currentCert.status !== 'approved' && currentCert.status !== 'released' && currentCert.status !== 'rejected' && (
            <>
              <Button
                title="Approve Request & Issue OR"
                onPress={() => setApproveModal(true)}
                variant="primary"
                size="lg"
                icon={<CheckCircle2 size={20} color={colors.white} />}
              />
              <View style={styles.secondaryActionRow}>
                <Button
                  title="Send Back"
                  onPress={() => setSendBackModal(true)}
                  variant="outline"
                  size="md"
                  style={{ flex: 1 }}
                  icon={<RotateCcw size={16} color={colors.emerald[400]} />}
                />
                <Button
                  title="Reject"
                  onPress={() => setRejectModal(true)}
                  variant="danger"
                  size="md"
                  style={{ flex: 1, marginLeft: 10 }}
                  icon={<XCircle size={16} color={colors.white} />}
                />
              </View>
            </>
          )}

          {currentCert.status === 'approved' && (
            <Button
              title="Confirm Document Handover (Release)"
              onPress={handleRelease}
              loading={actionLoading}
              variant="primary"
              size="lg"
              icon={<CheckCircle2 size={20} color={colors.white} />}
            />
          )}
        </View>
      </ScrollView>

      {/* Approve Modal */}
      <Modal visible={approveModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Approve Certificate</Text>
            <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>
              Assign Official Receipt (OR) Number to complete document generation.
            </Text>
            <TextInput
              value={orNumberInput}
              onChangeText={setOrNumberInput}
              placeholder="e.g. OR-2026-8899"
              placeholderTextColor={theme.textMuted}
              style={[styles.modalInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              autoCapitalize="characters"
            />
            <View style={styles.modalBtns}>
              <Button
                title="Cancel"
                onPress={() => setApproveModal(false)}
                variant="ghost"
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm Approval"
                onPress={handleApprove}
                loading={actionLoading}
                variant="primary"
                style={{ flex: 1, marginLeft: 10 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Send Back Modal */}
      <Modal visible={sendBackModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Send Back for Correction</Text>
            <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>
              Specify what the resident needs to correct or upload (e.g., clear photo of valid ID).
            </Text>
            <TextInput
              value={sendBackNotes}
              onChangeText={setSendBackNotes}
              placeholder="Enter instructions for resident..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              style={[styles.modalTextArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            />
            <View style={styles.modalBtns}>
              <Button
                title="Cancel"
                onPress={() => setSendBackModal(false)}
                variant="ghost"
                style={{ flex: 1 }}
              />
              <Button
                title="Send Back"
                onPress={handleSendBack}
                loading={actionLoading}
                variant="primary"
                style={{ flex: 1, marginLeft: 10 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal visible={rejectModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.rose[500] }]}>Reject Request</Text>
            <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>
              Enter the reason why this application cannot be approved.
            </Text>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Enter rejection reason..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              style={[styles.modalTextArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            />
            <View style={styles.modalBtns}>
              <Button
                title="Cancel"
                onPress={() => setRejectModal(false)}
                variant="ghost"
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm Reject"
                onPress={handleReject}
                loading={actionLoading}
                variant="danger"
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
  cardSection: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  refNumber: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  certTitleText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionSection: {
    marginTop: 16,
    gap: 12,
  },
  secondaryActionRow: {
    flexDirection: 'row',
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
  },
  modalDesc: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    marginBottom: 16,
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
