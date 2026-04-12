import React, { useState } from 'react';
import UnifiedCertModal from './UnifiedCertModal';

export default function NaturalDeathCertificateModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [requesterName, setRequesterName] = useState('');

  const extraStep3 = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
            Date of Death <span className="text-red-500">*</span>
          </label>
          <input type="date" value={dateOfDeath} onChange={e => setDateOfDeath(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base" />
        </div>
        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
            Cause of Death <span className="text-red-500">*</span>
          </label>
          <input type="text" value={causeOfDeath} onChange={e => setCauseOfDeath(e.target.value)}
            placeholder="NATURAL CAUSE..."
            className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base uppercase" />
        </div>
      </div>
      <div>
        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
          Name of Requester (if different from applicant)
        </label>
        <input type="text" value={requesterName} onChange={e => setRequesterName(e.target.value)}
          placeholder="FULL NAME OF REQUESTER"
          className="w-full px-6 py-4 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-xl uppercase" />
      </div>
    </div>
  );

  return (
    <UnifiedCertModal
      isOpen={isOpen}
      onClose={onClose}
      isDemo={isDemo}
      tenantConfig={tenantConfig}
      title="Natural Death Certificate"
      certType="natural_death"
      step3Label="Purpose of Request"
      extraStep3={extraStep3}
      requirePurpose={false}
      extraFormData={{ dateOfDeath, causeOfDeath, requesterName }}
    />
  );
}
