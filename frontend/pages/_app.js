import '../src/styles/globals.css';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // 1. Determine the Tenant ID Fallback (Improved Logic)
    const getFallbackTenantId = () => {
      if (typeof window === 'undefined') return 'ibaoeste';
      
      // Try URL parameter first - HIGHEST PRIORITY
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('tenant')) return urlParams.get('tenant');
      
      // Try hostname (e.g., demo.brgyportal.com)
      if (window.location.hostname.includes('demo')) return 'demo';

      // Check if this is the dashboard/management area
      const isDashboard = window.location.pathname.startsWith('/dashboard') || 
                         window.location.pathname.startsWith('/employees') ||
                         window.location.pathname.startsWith('/officials') ||
                         window.location.pathname.startsWith('/facilities') ||
                         window.location.pathname.startsWith('/events') ||
                         window.location.pathname.startsWith('/achievements') ||
                         window.location.pathname.startsWith('/programs');

      // Try user profile if in dashboard
      if (isDashboard) {
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            if (user.tenant_id) return user.tenant_id;
          }
        } catch (e) {}
      }

      // Try environment variable
      if (process.env.NEXT_PUBLIC_TENANT_ID) return process.env.NEXT_PUBLIC_TENANT_ID;
      
      return 'ibaoeste';
    };

    // 2. SECURE FETCH WRAPPER (Moved outside to ensure immediate effect)
    if (typeof window !== 'undefined' && !window.__interceptorActive) {
      window.__interceptorActive = true;
      const originalFetch = window.fetch;
      
      const getBaseUrl = () => {
        if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
        if (window.location.hostname.includes('railway.app')) {
           const backendHost = window.location.hostname.replace('frontend', 'backend');
           return `https://${backendHost}`;
        }
        return 'http://localhost:5005';
      };

      const backendUrl = getBaseUrl().replace(/\/$/, '');
      console.log(`🌐 BRGY PORTAL: API Backend URL resolved to: ${backendUrl}`);

      window.fetch = async (resource, config = {}) => {
        const isInternalApi = typeof resource === 'string' && (
          resource.startsWith('/api') || 
          resource.includes(backendUrl) ||
          resource.includes('/api/') || 
          resource.includes('/auth/') || 
          resource.includes('/dashboard/')
        );

        if (isInternalApi) {
          config = config || {};
          config.headers = config.headers || {};
          
          const token = localStorage.getItem('token');
          if (token && !config.headers['Authorization']) {
            config.headers['Authorization'] = `Bearer ${token}`;
          }
          
          if (!config.headers['x-tenant-id']) {
            config.headers['x-tenant-id'] = getFallbackTenantId();
          }
        }
        
        return originalFetch(resource, config);
      };
    }
  }, []);

  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout || ((page) => page);

  return getLayout(<Component {...pageProps} />);
}