import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  ShieldCheck,
  MessageSquare,
  FileText,
  HeartHandshake,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { ResidentItem } from '../../api/residents';
import { colors } from '../../theme/colors';

export const ResidentProfileScreen: React.FC<{
  route?: any;
  navigation?: any;
}> = ({ route, navigation }) => {
  const resident: ResidentItem = route?.params?.resident || {
    id: 'unknown',
    first_name: 'Resident',
    last_name: 'Record',
    purok: 'Barangay Area',
  };
  const { theme } = useTheme();

  const fullName = `${resident.first_name || ''} ${resident.middle_name || ''} ${resident.last_name || ''} ${resident.suffix || ''}`.trim();
  const address = [resident.house_number, resident.street, resident.purok].filter(Boolean).join(', ') || 'Barangay Area';

  const handleCall = () => {
    if (resident.contact_number) {
      Linking.openURL(`tel:${resident.contact_number}`);
    }
  };

  const handleSMS = () => {
    if (resident.contact_number) {
      Linking.openURL(`sms:${resident.contact_number}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Navbar */}
      <View style={[styles.navBar, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text }]} numberOfLines={1}>
          Resident Profile
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {(resident.first_name?.[0] || 'R') + (resident.last_name?.[0] || '')}
            </Text>
          </View>
          <Text style={[styles.fullName, { color: theme.text }]}>{fullName}</Text>
          <Text style={[styles.purokText, { color: colors.emerald[400] }]}>
            {resident.purok || 'Resident of Barangay'}
          </Text>

          {/* Demographics Badges */}
          <View style={styles.tagsContainer}>
            {resident.is_voter && <Badge label="REGISTERED VOTER" variant="approved" size="sm" />}
            {resident.is_senior && <Badge label="SENIOR CITIZEN" variant="review" size="sm" />}
            {resident.is_pwd && <Badge label="PWD" variant="pending" size="sm" />}
            {resident.is_4ps && <Badge label="4PS BENEFICIARY" variant="released" size="sm" />}
            {resident.is_solo_parent && <Badge label="SOLO PARENT" variant="medium" size="sm" />}
          </View>

          {/* Quick Action Contact Row */}
          {resident.contact_number ? (
            <View style={styles.quickContactRow}>
              <TouchableOpacity
                onPress={handleCall}
                style={[styles.contactActionBtn, { backgroundColor: colors.emerald[600] }]}
              >
                <Phone size={18} color={colors.white} />
                <Text style={styles.contactActionText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSMS}
                style={[styles.contactActionBtn, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}
              >
                <MessageSquare size={18} color={theme.text} />
                <Text style={[styles.contactActionText, { color: theme.text }]}>SMS</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </Card>

        {/* Demographic & Personal Information */}
        <Card>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            PERSONAL & RESIDENCE DETAILS
          </Text>

          <View style={styles.infoRow}>
            <MapPin size={18} color={theme.textMuted} />
            <View style={styles.infoCol}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Address</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{address}</Text>
            </View>
          </View>

          {resident.birth_date && (
            <View style={styles.infoRow}>
              <Calendar size={18} color={theme.textMuted} />
              <View style={styles.infoCol}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Birth Date</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {resident.birth_date}
                </Text>
              </View>
            </View>
          )}

          {resident.civil_status && (
            <View style={styles.infoRow}>
              <User size={18} color={theme.textMuted} />
              <View style={styles.infoCol}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Civil Status / Gender</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {resident.civil_status} {resident.gender ? `• ${resident.gender}` : ''}
                </Text>
              </View>
            </View>
          )}

          {resident.occupation && (
            <View style={styles.infoRow}>
              <Briefcase size={18} color={theme.textMuted} />
              <View style={styles.infoCol}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Occupation</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {resident.occupation}
                </Text>
              </View>
            </View>
          )}

          {resident.national_id_number && (
            <View style={styles.infoRow}>
              <ShieldCheck size={18} color={theme.textMuted} />
              <View style={styles.infoCol}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>National ID #</Text>
                <Text style={[styles.infoValue, { color: theme.text, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                  {resident.national_id_number}
                </Text>
              </View>
            </View>
          )}
        </Card>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.emerald[700],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: colors.emerald[400],
  },
  avatarLargeText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '900',
  },
  fullName: {
    fontSize: 20,
    fontWeight: '800',
  },
  purokText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 16,
  },
  quickContactRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    paddingHorizontal: 16,
  },
  contactActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactActionText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  infoCol: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
});
