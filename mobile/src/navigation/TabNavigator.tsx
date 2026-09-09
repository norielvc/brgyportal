import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  LayoutDashboard,
  QrCode,
  FileCheck2,
  ShieldAlert,
  Users,
  MessageSquare,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../theme/colors';

// Screens
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { QRScannerScreen } from '../screens/scanner/QRScannerScreen';
import { CertificatesListScreen } from '../screens/certificates/CertificatesListScreen';
import { CertificateDetailScreen } from '../screens/certificates/CertificateDetailScreen';
import { BlotterListScreen } from '../screens/blotter/BlotterListScreen';
import { BlotterDetailScreen } from '../screens/blotter/BlotterDetailScreen';
import { ResidentListScreen } from '../screens/residents/ResidentListScreen';
import { ResidentProfileScreen } from '../screens/residents/ResidentProfileScreen';
import { ChatListScreen } from '../screens/kapchat/ChatListScreen';
import { ChatDetailScreen } from '../screens/kapchat/ChatDetailScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stacks with nested details
const CertificatesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CertificatesList" component={CertificatesListScreen} />
    <Stack.Screen name="CertificateDetail" component={CertificateDetailScreen} />
  </Stack.Navigator>
);

const BlotterStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BlotterList" component={BlotterListScreen} />
    <Stack.Screen name="BlotterDetail" component={BlotterDetailScreen} />
  </Stack.Navigator>
);

const ResidentsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ResidentsList" component={ResidentListScreen} />
    <Stack.Screen name="ResidentProfile" component={ResidentProfileScreen} />
  </Stack.Navigator>
);

const KapChatStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ChatList" component={ChatListScreen} />
    <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
  </Stack.Navigator>
);

export const TabNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.emerald[400],
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ScannerTab"
        component={QRScannerScreen}
        options={{
          tabBarLabel: 'Scan QR',
          tabBarIcon: ({ color, size }) => <QrCode size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CertificatesTab"
        component={CertificatesStack}
        options={{
          tabBarLabel: 'Certificates',
          tabBarIcon: ({ color, size }) => <FileCheck2 size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="BlotterTab"
        component={BlotterStack}
        options={{
          tabBarLabel: 'Blotter',
          tabBarIcon: ({ color, size }) => <ShieldAlert size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ResidentsTab"
        component={ResidentsStack}
        options={{
          tabBarLabel: 'Residents',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="KapChatTab"
        component={KapChatStack}
        options={{
          tabBarLabel: 'KapChat',
          tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <SettingsIcon size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
