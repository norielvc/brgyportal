import React, { useState } from 'react';
import UnifiedCertModal from './UnifiedCertModal';

export default function SamePersonCertificateModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
  const [aliasName, setAliasName] = useState('');

  const extraStep1 = (
    <div className="mt-3">
      <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
        Alias / Other Name Used <span className="text-red-500">*</span>
      </label>
      <input type="text" value={aliasName} onChange={e => setAliasName(e.target.value)}
        placeholder="ENTER ALIAS OR OTHER NAME..."
        className="w-full px-6 py-4 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-xl uppercase" />
    </div>
  );

  return (
    <UnifiedCertModal
      isOpen={isOpen}
      onClose={onClose}
      isDemo={isDemo}
      tenantConfig={tenantConfig}
      title="Certification of Same Person"
      certType="same_person"
      step3Label="Purpose of Certification"
      extraStep1={extraStep1}
    />
  );
}
