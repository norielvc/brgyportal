import '../src/styles/globals.css';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // 1. Determine the Tenant ID Fallback
    const getFallbackTenantId = () => {
      if (typeof window === 'undefined') return 'ibaoeste';
      
      // Try URL parameter first (e.g., ?tenant=demo)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('tenant')) return urlParams.get('tenant');
      
      // Try hostname (e.g., demo.brgyportal.com)
      if (window.location.hostname.includes('demo')) return 'demo';

      // Try user profile from localStorage if logged in (for dashboard paths)
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user.tenant_id) return user.tenant_id;
        }
      } catch (e) {}

      // Try environment variable
      if (process.env.NEXT_PUBLIC_TENANT_ID) return process.env.NEXT_PUBLIC_TENANT_ID;
      
      return 'ibaoeste';
    };

    const fallbackTenantId = getFallbackTenantId();

    // 2. SECURE FETCH WRAPPER:
    // This intercepts every single 'fetch' call to ensure correct Auth and Tenant context
    const originalFetch = window.fetch;
    window.fetch = async (resource, config = {}) => {
      const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005').replace(/\/$/, '');
      const isInternalApi = typeof resource === 'string' && 
        (resource.includes(backendUrl) || resource.startsWith('/api') || resource.includes('/auth/') || resource.includes('/dashboard/'));

      if (isInternalApi) {
        config = config || {};
        config.headers = config.headers || {};
        
        // Auto-inject Token if missing
        const token = localStorage.getItem('token');
        if (token && !config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Detect/Inject Tenant ID
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