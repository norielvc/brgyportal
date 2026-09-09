import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import {
  User,
  Shield,
  Fingerprint,
  Moon,
  Sun,
  Server,
  LogOut,
  Building,
  Bell,
  Smartphone,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { colors } from '../../theme/colors';

export const SettingsScreen: React.FC = () => {
  const {
    user,
    tenantId,
    switchTenant,
    logout,
    serverUrl,
    updateServerUrl,
    isBiometricSupported,
    isBiometricEnabled,
    toggleBiometrics,
  } = useAuth();
  const { isDark, toggleTheme, theme } = useTheme();

  const [editingServer, setEditingServer] = useState(false);
  const [customUrl, setCustomUrl] = useState(serverUrl);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from the Admin Portal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSaveUrl = async () => {
    await updateServerUrl(customUrl);
    setEditingServer(false);
    Alert.alert('Saved', `API Base URL set to: ${customUrl}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Settings" subtitle="Account & App Preferences" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Officer Profile Card */}
        <Card>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {((user?.firstName?.[0] || 'A') + (user?.lastName?.[0] || 'D')).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: theme.text }]}>
                {user?.firstName} {user?.lastName}
              </Text>
              <Text style={[styles.role, { color: colors.emerald[400] }]}>
                {user?.role?.toUpperCase() || 'BARANGAY OFFICER'}
              </Text>
              <Text style={[styles.email, { color: theme.textMuted }]}>{user?.email}</Text>
            </View>
          </View>
        </Card>

        {/* Tenant Switcher */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          ACTIVE BARANGAY TENANT
        </Text>
        <Card>
          <View style={styles.tenantOptions}>
            {['ibaoeste', 'demo'].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => switchTenant(t)}
                style={[
                  styles.tenantOption,
                  {
                    backgroundColor: tenantId === t ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    borderColor: tenantId === t ? colors.emerald[400] : theme.border,
                  },
                ]}
              >
                <View style={styles.tenantLeft}>
                  <Building
                    size={20}
                    color={tenantId === t ? colors.emerald[400] : theme.textMuted}
                  />
                  <Text
                    style={[
                      styles.tenantName,
                      { color: tenantId === t ? colors.emerald[400] : theme.text },
                    ]}
                  >
                    Barangay {t.toUpperCase()}
                  </Text>
                </View>
                {tenantId === t && <Check size={18} color={colors.emerald[400]} />}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Security & Preferences */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          SECURITY & DISPLAY
        </Text>
        <Card>
          {/* Biometrics Toggle */}
          {isBiometricSupported && (
            <View style={[styles.settingRow, { borderBottomColor: theme.divider, borderBottomWidth: 1 }]}>
              <View style={styles.settingLeft}>
                <Fingerprint size={20} color={colors.emerald[400]} />
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>
                    Biometric Authentication
                  </Text>
                  <Text style={[styles.settingDesc, { color: theme.textMuted }]}>
                    Unlock with Face ID / Touch ID
                  </Text>
                </View>
              </View>
              <Switch
                value={isBiometricEnabled}
                onValueChange={toggleBiometrics}
                trackColor={{ false: theme.surface, true: colors.emerald[600] }}
                thumbColor={colors.white}
              />
            </View>
          )}

          {/* Dark / Light Mode Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              {isDark ? (
                <Moon size={20} color={colors.purple[400]} />
              ) : (
                <Sun size={20} color={colors.amber[500]} />
              )}
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
                <Text style={[styles.settingDesc, { color: theme.textMuted }]}>
                  {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.surface, true: colors.emerald[600] }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        {/* Server Endpoint Config */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          BACKEND API ENDPOINT
        </Text>
        <Card>
          <View style={styles.serverRow}>
            <Server size={20} color={colors.blue[400]} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>API Base URL</Text>
              <Text style={[styles.serverUrlText, { color: theme.textMuted }]}>{serverUrl}</Text>
            </View>
            <TouchableOpacity onPress={() => setEditingServer(!editingServer)}>
              <Text style={[styles.editBtn, { color: colors.emerald[400] }]}>
                {editingServer ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {editingServer && (
            <View style={{ marginTop: 12 }}>
              <TextInput
                value={customUrl}
                onChangeText={setCustomUrl}
                style={[styles.urlInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                autoCapitalize="none"
              />
              <Button
                title="Save Endpoint URL"
                onPress={handleSaveUrl}
                size="sm"
                style={{ marginTop: 8 }}
              />
            </View>
          )}
        </Card>

        {/* App Version Info */}
        <View style={styles.versionInfo}>
          <Smartphone size={16} color={theme.textMuted} />
          <Text style={[styles.versionText, { color: theme.textMuted }]}>
            BrgyDesk Admin v1.0.0 (iOS & Android Universal Build)
          </Text>
        </View>

        {/* Logout Button */}
        <Button
          title="Sign Out of Admin Account"
          onPress={handleLogout}
          variant="danger"
          size="lg"
          icon={<LogOut size={20} color={colors.white} />}
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.emerald[700],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: colors.emerald[400],
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
  },
  role: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  email: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  tenantOptions: {
    gap: 8,
  },
  tenantOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  tenantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tenantName: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serverUrlText: {
    fontSize: 12,
    marginTop: 2,
  },
  editBtn: {
    fontSize: 13,
    fontWeight: '700',
  },
  urlInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
  },
  versionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 12,
  },
  versionText: {
    fontSize: 12,
  },
});
