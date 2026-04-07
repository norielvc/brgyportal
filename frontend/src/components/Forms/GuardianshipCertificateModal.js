import React, { useState } from 'react';
import UnifiedCertModal from './UnifiedCertModal';

export default function GuardianshipCertificateModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');

  const extraStep3 = (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
          Guardian's Full Name <span className="text-red-500">*</span>
        </label>
        <input type="text" value={guardianName} onChange={e => setGuardianName(e.target.value)}
          placeholder="FULL NAME OF GUARDIAN"
          className="w-full px-6 py-4 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-xl uppercase" />
      </div>
      <div>
        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
          Relationship to Minor <span className="text-red-500">*</span>
        </label>
        <select value={guardianRelationship} onChange={e => setGuardianRelationship(e.target.value)}
          className="w-full px-6 py-4 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-xl uppercase">
          <option value="">SELECT RELATIONSHIP...</option>
          <option value="PARENT">PARENT</option>
          <option value="GRANDPARENT">GRANDPARENT</option>
          <option value="SIBLING">SIBLING</option>
          <option value="AUNT/UNCLE">AUNT/UNCLE</option>
          <option value="LEGAL GUARDIAN">LEGAL GUARDIAN</option>
          <option value="OTHER RELATIVE">OTHER RELATIVE</option>
        </select>
      </div>
    </div>
  );

  return (
    <UnifiedCertModal
      isOpen={isOpen}
      onClose={onClose}
      isDemo={isDemo}
      tenantConfig={tenantConfig}
      title="Guardianship Certificate"
      certType="barangay_guardianship"
      step3Label="Purpose of Guardianship"
      extraStep3={extraStep3}
    />
  );
}
