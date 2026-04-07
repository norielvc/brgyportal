import React, { useState } from 'react';
import UnifiedCertModal from './UnifiedCertModal';

export default function CohabitationCertificateModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
  const [partnerName, setPartnerName] = useState('');
  const [yearsLiving, setYearsLiving] = useState('');
  const [children, setChildren] = useState('0');

  const extraStep3 = (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
          Partner's Full Name <span className="text-red-500">*</span>
        </label>
        <input type="text" value={partnerName} onChange={e => setPartnerName(e.target.value)}
          placeholder="FULL NAME OF PARTNER"
          className="w-full px-6 py-4 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-xl uppercase" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">Years Living Together</label>
          <input type="number" min="0" value={yearsLiving} onChange={e => setYearsLiving(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-xl" />
        </div>
        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">Number of Children</label>
          <input type="number" min="0" value={children} onChange={e => setChildren(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-xl" />
        </div>
      </div>
    </div>
  );

  return (
    <UnifiedCertModal
      isOpen={isOpen}
      onClose={onClose}
      isDemo={isDemo}
      tenantConfig={tenantConfig}
      title="Co-habitation Certificate"
      certType="cohabitation"
      step3Label="Purpose of Certification"
      extraStep3={extraStep3}
    />
  );
}
