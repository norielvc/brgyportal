import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Shield, Lock, Mail, Eye, EyeOff, Fingerprint, Server, Check } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';

export const LoginScreen: React.FC = () => {
  const { login, loginWithBiometrics, isBiometricSupported, isBiometricEnabled, tenantId, switchTenant, serverUrl, updateServerUrl } = useAuth();
  const { theme } = useTheme();

  const [email, setEmail] = useState('admin@barangay.gov.ph');
  const [password, setPassword] = useState('Admin@123456');
  const [selectedTenant, setSelectedTenant] = useState(tenantId || 'ibaoeste');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(serverUrl);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    const result = await login(email.trim(), password, selectedTenant);
    setLoading(false);

    if (!result.success) {
      setErrorMsg(result.message || 'Login failed. Please check credentials.');
    }
  };

  const handleBiometrics = async () => {
    setErrorMsg('');
    const success = await loginWithBiometrics();
    if (!success) {
      Alert.alert('Biometrics Failed', 'Could not authenticate via biometrics. Please use email & password.');
    }
  };

  const handleSaveServerUrl = async () => {
    await updateServerUrl(customUrl);
    setShowServerConfig(false);
    Alert.alert('Server URL Updated', `API endpoint set to: ${customUrl}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Brand */}
          <View style={styles.brandContainer}>
            <View style={styles.iconCircle}>
              <Shield size={42} color={colors.emerald[400]} />
            </View>
            <Text style={[styles.appTitle, { color: theme.text }]}>BrgyDesk Admin</Text>
            <Text style={[styles.appSubtitle, { color: theme.textSecondary }]}>
              Barangay Management & Officer Portal (iOS / Android)
            </Text>
          </View>

          {/* Tenant Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              SELECT BARANGAY TENANT
            </Text>
            <View style={styles.tenantPills}>
              {['ibaoeste', 'demo'].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setSelectedTenant(t)}
                  style={[
                    styles.tenantPill,
                    {
                      backgroundColor: selectedTenant === t ? colors.emerald[600] : theme.surface,
                      borderColor: selectedTenant === t ? colors.emerald[400] : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tenantPillText,
                      { color: selectedTenant === t ? colors.white : theme.textSecondary },
                    ]}
                  >
                    {t.toUpperCase()}
                  </Text>
                  {selectedTenant === t && <Check size={14} color={colors.white} style={{ marginLeft: 4 }} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Officer Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Mail size={18} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="admin@barangay.gov.ph"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { color: theme.text }]}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Lock size={18} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  style={[styles.input, { color: theme.text }]}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={18} color={theme.textMuted} />
                  ) : (
                    <Eye size={18} color={theme.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <Button
              title="Sign In to Admin Portal"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={{ marginTop: 12 }}
            />

            {/* Biometric Button if Supported */}
            {isBiometricSupported && isBiometricEnabled && (
              <Button
                title="Unlock with Biometrics (Face ID / Touch ID)"
                onPress={handleBiometrics}
                variant="outline"
                size="md"
                icon={<Fingerprint size={20} color={colors.emerald[400]} />}
                style={{ marginTop: 10 }}
              />
            )}
          </View>

          {/* Server Config Toggle */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => setShowServerConfig(!showServerConfig)}
              style={styles.serverToggle}
            >
              <Server size={14} color={theme.textMuted} />
              <Text style={[styles.serverText, { color: theme.textMuted }]}>
                API Base: {serverUrl} (Tap to change)
              </Text>
            </TouchableOpacity>

            {showServerConfig && (
              <View style={[styles.serverBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <TextInput
                  value={customUrl}
                  onChangeText={setCustomUrl}
                  placeholder="http://192.168.1.100:3000/api"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.serverInput, { color: theme.text }]}
                  autoCapitalize="none"
                />
                <Button
                  title="Save Server URL"
                  onPress={handleSaveServerUrl}
                  size="sm"
                  style={{ marginTop: 8 }}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  tenantPills: {
    flexDirection: 'row',
    gap: 10,
  },
  tenantPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  tenantPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: colors.rose[500],
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  serverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serverText: {
    fontSize: 11,
    fontWeight: '500',
  },
  serverBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    width: '100%',
  },
  serverInput: {
    fontSize: 13,
    paddingVertical: 6,
  },
});
