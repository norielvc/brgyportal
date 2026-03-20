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

    const fallbackTenantId = getFallbackTenantId();

    // 2. SECURE FETCH WRAPPER:
    const originalFetch = window.fetch;
    window.fetch = async (resource, config = {}) => {
      // Resilient API URL discovery
      const getBaseUrl = () => {
        if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
        if (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')) {
           const backendHost = window.location.hostname.replace('frontend', 'backend');
           return `https://${backendHost}`;
        }
        return 'http://localhost:5005';
      };
      
      const backendUrl = getBaseUrl().replace(/\/$/, '');
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
        
        // Auto-inject Token if missing
        const token = localStorage.getItem('token');
        if (token && !config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Force/Inject Tenant ID:
        // Priority: 1. Header already in call, 2. Global fallback
        if (!config.headers['x-tenant-id']) {
          config.headers['x-tenant-id'] = fallbackTenantId;
        }
      }
      
      return originalFetch(resource, config);
    };
  }, []);

  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout || ((page) => page);

  return getLayout(<Component {...pageProps} />);
}