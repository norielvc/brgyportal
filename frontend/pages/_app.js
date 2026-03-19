import '../src/styles/globals.css';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // 1. Determine the Tenant ID 
    // We try the environment variable FIRST (as configured in Vercel)
    // Then we try the hostname (as an emergency backup/nuclear option)
    let tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    if (typeof window !== 'undefined' && !tenantId) {
      if (window.location.hostname.includes('demo')) {
        tenantId = 'demo';
      }
    }
    const finalTenantId = tenantId || 'ibaoeste';

    // 2. SECURE FETCH WRAPPER:
    // This intercepts every single 'fetch' call in the legacy part of the app
    // to ensure the backend always knows which tenant is making the request.
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      let [resource, config] = args;
      
      // Determine if this is a call to our backend
      const backendUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
      const isInternalApi = typeof resource === 'string' && 
        (resource.includes(backendUrl) || resource.startsWith('/api') || resource.includes('/auth/') || resource.includes('/dashboard/'));

      if (isInternalApi) {
        config = config || {};
        const headers = config.headers || {};
        
        // If the header is missing, forcefully inject it
        if (!headers['x-tenant-id']) {
          if (headers instanceof Headers) {
            headers.set('x-tenant-id', finalTenantId);
          } else {
            config.headers = {
              ...headers,
              'x-tenant-id': finalTenantId
            };
          }
        }
      }
      
      return originalFetch(resource, config);
    };
  }, []);

  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout || ((page) => page);

  return getLayout(<Component {...pageProps} />);
}