import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { QrCode, Flashlight, FlashlightOff, Keyboard, ArrowLeft, CheckCircle2, XCircle, FileText, User } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { scannerApi, VerificationResult } from '../../api/scanner';
import { certificatesApi } from '../../api/certificates';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { colors } from '../../theme/colors';

export const QRScannerScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [manualModal, setManualModal] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [resultModal, setResultModal] = useState(false);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setScanned(false);
      setResultModal(false);
    });
    return unsubscribe;
  }, [navigation]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}

    await processVerification(data);
  };

  const processVerification = async (code: string) => {
    setLoading(true);
    try {
      const res = await scannerApi.verifyCode(code);
      setResult(res);
      setResultModal(true);
    } catch (e: any) {
      Alert.alert('Scan Verification Error', e.message || 'Could not verify QR code.');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) return;
    setManualModal(false);
    await processVerification(manualCode.trim());
    setManualCode('');
  };

  const handleMarkAsReleased = async () => {
    if (!result?.certificate?.referenceNumber) return;
    setReleasing(true);
    try {
      await certificatesApi.markAsReleased(result.certificate.referenceNumber, result.certificate.orNumber);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (_) {}
      Alert.alert('Success', 'Certificate marked as Claimed / Released!');
      setResultModal(false);
      setScanned(false);
    } catch (err: any) {
      Alert.alert('Release Error', err.response?.data?.message || err.message || 'Failed to update release status.');
    } finally {
      setReleasing(false);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.emerald[400]} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background, padding: 24 }]}>
        <QrCode size={56} color={colors.emerald[400]} style={{ marginBottom: 16 }} />
        <Text style={[styles.permTitle, { color: theme.text }]}>Camera Access Required</Text>
        <Text style={[styles.permDesc, { color: theme.textSecondary }]}>
          BrgyDesk needs camera permission to scan and verify QR codes on resident certificates and IDs.
        </Text>
        <Button
          title="Grant Camera Access"
          onPress={requestPermission}
          style={{ marginTop: 20 }}
        />
        <Button
          title="Enter Reference Manually"
          onPress={() => setManualModal(true)}
          variant="outline"
          style={{ marginTop: 10 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Live Camera View */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'code128', 'code39'],
        }}
      />

      {/* ViewFinder Overlay */}
      <View style={styles.overlay}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>Scan QR Certificate / ID</Text>
          <View style={styles.topActions}>
            <TouchableOpacity
              onPress={() => setTorch(!torch)}
              style={styles.circleButton}
            >
              {torch ? (
                <FlashlightOff size={20} color={colors.white} />
              ) : (
                <Flashlight size={20} color={colors.white} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setManualModal(true)}
              style={styles.circleButton}
            >
              <Keyboard size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Viewfinder Frame */}
        <View style={styles.viewFinderContainer}>
          <View style={styles.viewFinderBox}>
            {/* 4 Corner Markers */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.emerald[400]} />
                <Text style={styles.loadingText}>Verifying Record...</Text>
              </View>
            )}
          </View>
          <Text style={styles.hintText}>
            Align QR code inside the box to verify automatically
          </Text>
        </View>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <Button
            title="Type Reference Number"
            onPress={() => setManualModal(true)}
            variant="secondary"
            icon={<Keyboard size={18} color={colors.white} />}
            size="md"
          />
        </View>
      </View>

      {/* Verification Result Modal */}
      <Modal visible={resultModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            {result?.valid ? (
              <>
                <View style={styles.resultHeader}>
                  <CheckCircle2 size={36} color={colors.emerald[400]} />
                  <Text style={[styles.resultTitle, { color: theme.text }]}>
                    Verified Document
                  </Text>
                  <Badge
                    label={result.certificate?.status || 'Active'}
                    variant={(result.certificate?.status || 'approved') as any}
                  />
                </View>

                {result.certificate && (
                  <View style={[styles.detailBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Type:</Text>
                      <Text style={[styles.detailVal, { color: theme.text }]}>
                        {result.certificate.type}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Applicant:</Text>
                      <Text style={[styles.detailVal, { color: theme.text, fontWeight: '700' }]}>
                        {result.certificate.applicantName}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Reference #:</Text>
                      <Text style={[styles.detailVal, { color: colors.emerald[400], fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                        {result.certificate.referenceNumber}
                      </Text>
                    </View>
                    {result.certificate.orNumber ? (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.textMuted }]}>OR #:</Text>
                        <Text style={[styles.detailVal, { color: theme.text }]}>
                          {result.certificate.orNumber}
                        </Text>
                      </View>
                    ) : null}
                    {result.certificate.purpose ? (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Purpose:</Text>
                        <Text style={[styles.detailVal, { color: theme.text }]}>
                          {result.certificate.purpose}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}

                <View style={styles.modalActions}>
                  {result.certificate?.status !== 'released' && (
                    <Button
                      title="Confirm Release & Handover"
                      onPress={handleMarkAsReleased}
                      loading={releasing}
                      variant="primary"
                      size="lg"
                    />
                  )}
                  <Button
                    title="Scan Next Code"
                    onPress={() => {
                      setResultModal(false);
                      setScanned(false);
                    }}
                    variant="outline"
                    style={{ marginTop: 10 }}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.resultHeader}>
                  <XCircle size={36} color={colors.rose[500]} />
                  <Text style={[styles.resultTitle, { color: theme.text }]}>
                    Verification Failed
                  </Text>
                </View>
                <Text style={[styles.failMessage, { color: theme.textSecondary }]}>
                  {result?.message || 'No valid certificate or resident record matched this QR code.'}
                </Text>
                <Button
                  title="Try Again"
                  onPress={() => {
                    setResultModal(false);
                    setScanned(false);
                  }}
                  variant="secondary"
                  style={{ marginTop: 16 }}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Manual Input Modal */}
      <Modal visible={manualModal} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Enter Reference Number</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Type the tracking reference (e.g., CLR-2026-0012)
            </Text>
            <TextInput
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="e.g. CLR-2026-..."
              placeholderTextColor={theme.textMuted}
              style={[styles.manualInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
              autoCapitalize="characters"
              autoFocus
            />
            <View style={styles.manualActions}>
              <Button
                title="Cancel"
                onPress={() => setManualModal(false)}
                variant="ghost"
                style={{ flex: 1 }}
              />
              <Button
                title="Verify Code"
                onPress={handleManualSubmit}
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
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  permDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  topTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  topActions: {
    flexDirection: 'row',
    gap: 12,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewFinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewFinderBox: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.emerald[400],
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  hintText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  loadingText: {
    color: colors.white,
    fontWeight: '700',
    marginTop: 10,
  },
  bottomBar: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  resultHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  detailBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
  },
  detailVal: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '65%',
    textAlign: 'right',
  },
  modalActions: {
    gap: 6,
  },
  failMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginVertical: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  manualInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 16,
  },
  manualActions: {
    flexDirection: 'row',
  },
});
