import React, { createContext, useContext, useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { authApi, AdminUser } from '../api/auth';
import { storage } from '../utils/storage';
import { setApiBaseUrl, setTenantId, getApiBaseUrl, getTenantId } from '../api/client';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  tenantId: string;
  serverUrl: string;
  isLoading: boolean;
  isBiometricSupported: boolean;
  isBiometricEnabled: boolean;
  login: (email: string, password: string, tenant?: string) => Promise<{ success: boolean; message?: string }>;
  loginWithBiometrics: () => Promise<boolean>;
  logout: () => Promise<void>;
  switchTenant: (newTenant: string) => Promise<void>;
  updateServerUrl: (url: string) => Promise<void>;
  toggleBiometrics: (enable: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tenantId, setTenantState] = useState<string>('ibaoeste');
  const [serverUrl, setServerUrlState] = useState<string>('http://localhost:3000/api');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(false);

  useEffect(() => {
    bootstrapAuth();
  }, []);

  const bootstrapAuth = async () => {
    try {
      // 1. Check biometrics capability
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricSupported(hasHardware && isEnrolled);

      // 2. Load stored preferences
      const savedTenant = await storage.getItem('admin_tenant');
      if (savedTenant) {
        setTenantState(savedTenant);
        setTenantId(savedTenant);
      }

      const savedUrl = await storage.getItem('admin_server_url');
      if (savedUrl) {
        setServerUrlState(savedUrl);
        setApiBaseUrl(savedUrl);
      }

      const bioEnabled = await storage.getItem('admin_bio_enabled');
      setIsBiometricEnabled(bioEnabled === 'true');

      // 3. Load stored session
      const savedToken = await storage.getItem('admin_token');
      const savedUser = await storage.getJSON<AdminUser>('admin_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(savedUser);
      }
    } catch (e) {
      console.warn('Auth bootstrap error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, tenant: string = tenantId) => {
    try {
      setIsLoading(true);
      const res = await authApi.login(email, password, tenant);
      if (res.success && res.data) {
        const { user: loggedInUser, token: authToken } = res.data;
        setUser(loggedInUser);
        setToken(authToken);
        setTenantState(tenant);
        setTenantId(tenant);

        await storage.setItem('admin_token', authToken);
        await storage.setJSON('admin_user', loggedInUser);
        await storage.setItem('admin_tenant', tenant);

        return { success: true };
      }
      return { success: false, message: res.message || 'Invalid credentials' };
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithBiometrics = async (): Promise<boolean> => {
    if (!isBiometricSupported || !isBiometricEnabled) return false;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access BrgyDesk Admin',
        fallbackLabel: 'Use Email & Password',
      });
      if (result.success) {
        const savedToken = await storage.getItem('admin_token');
        const savedUser = await storage.getJSON<AdminUser>('admin_user');
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.warn('Biometrics login error:', e);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await storage.removeItem('admin_token');
    await storage.removeItem('admin_user');
  };

  const switchTenant = async (newTenant: string) => {
    setTenantState(newTenant);
    setTenantId(newTenant);
    await storage.setItem('admin_tenant', newTenant);
  };

  const updateServerUrl = async (newUrl: string) => {
    setServerUrlState(newUrl);
    setApiBaseUrl(newUrl);
    await storage.setItem('admin_server_url', newUrl);
  };

  const toggleBiometrics = async (enable: boolean) => {
    setIsBiometricEnabled(enable);
    await storage.setItem('admin_bio_enabled', enable ? 'true' : 'false');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tenantId,
        serverUrl,
        isLoading,
        isBiometricSupported,
        isBiometricEnabled,
        login,
        loginWithBiometrics,
        logout,
        switchTenant,
        updateServerUrl,
        toggleBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
