import { useState, useEffect } from 'react';
import LandingPageContent from '@/components/Portal/LandingPageContent';
import PortalPageContent from '@/components/Portal/PortalPageContent';

export default function Home() {
  const [view, setView] = useState('loading'); // 'loading', 'landing', 'portal'
  const [tenantId, setTenantId] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const urlParams = new URLSearchParams(window.location.search);
      
      // Explicit tenant in query param takes priority
      if (urlParams.has('tenant')) {
        setTenantId(urlParams.get('tenant'));
        setView('portal');
        return;
      }

      // Detection logic
      if (hostname === 'brgydesk.up.railway.app' || hostname === 'localhost' || hostname === '127.0.0.1') {
        setView('landing');
      } else if (hostname.startsWith('ibaoeste.')) {
        setTenantId('ibaoeste');
        setView('portal');
      } else if (hostname.includes('demo')) {
        setTenantId('demo');
        setView('portal');
      } else if (hostname.includes('railway.app') && !hostname.startsWith('brgydesk.')) {
        // Fallback for other railway subdomains (like old one)
        setTenantId('ibaoeste');
        setView('portal');
      } else {
        // Default to landing if it's the main domain, otherwise portal
        setView('landing');
      }
    }
  }, []);

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (view === 'portal') {
    return <PortalPageContent initialTenantId={tenantId} />;
  }

  return <LandingPageContent />;
}
