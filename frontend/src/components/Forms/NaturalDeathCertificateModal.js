import React, { useState } from 'react';
import UnifiedCertModal from './UnifiedCertModal';

export default function NaturalDeathCertificateModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [requesterName, setRequesterName] = useState('');

  const extraStep3 = (lang, t) => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {t.deathDateOfDeath} <span className="text-red-600">*</span>
          </label>
          <input
            type="date"
            value={dateOfDeath}
            onChange={e => setDateOfDeath(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-gray-200"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {t.deathCauseOfDeath} <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={causeOfDeath}
            onChange={e => setCauseOfDeath(e.target.value)}
            placeholder={t.deathCausePlaceholder}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-900 uppercase outline-none transition-colors focus:ring-2 focus:ring-gray-200"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">
          {t.deathRequesterName}
        </label>
        <input
          type="text"
          value={requesterName}
          onChange={e => setRequesterName(e.target.value)}
          placeholder={t.deathRequesterPlaceholder}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-900 uppercase outline-none transition-colors focus:ring-2 focus:ring-gray-200"
        />
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
