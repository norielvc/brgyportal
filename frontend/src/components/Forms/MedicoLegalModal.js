import React, { useState } from 'react';
import UnifiedCertModal from './UnifiedCertModal';

export default function MedicoLegalModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
  const [dateOfExam, setDateOfExam] = useState('');
  const [usapingBarangay, setUsapingBarangay] = useState('');
  const [dateOfHearing, setDateOfHearing] = useState('');

  const handleClose = () => {
    setDateOfExam('');
    setUsapingBarangay('');
    setDateOfHearing('');
    onClose();
  };

  const extraStep3 = (lang, t) => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {t.medicoDateOfExam} <span className="text-red-600">*</span>
          </label>
          <input 
            type="date" 
            value={dateOfExam} 
            onChange={e => setDateOfExam(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-gray-200" 
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {t.medicoUsapingNo} <span className="text-red-600">*</span>
          </label>
          <input 
            type="text" 
            value={usapingBarangay} 
            onChange={e => setUsapingBarangay(e.target.value)}
            placeholder={t.medicoUsapingPlaceholder}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-900 uppercase outline-none transition-colors focus:ring-2 focus:ring-gray-200" 
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1.5">
          {t.medicoDateOfHearing} <span className="text-red-600">*</span>
        </label>
        <input 
          type="date" 
          value={dateOfHearing} 
          onChange={e => setDateOfHearing(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-gray-200" 
        />
      </div>
    </div>
  );

  return (
    <UnifiedCertModal
      isOpen={isOpen}
      onClose={handleClose}
      isDemo={isDemo}
      tenantConfig={tenantConfig}
      title="Medico-Legal Certificate"
      certType="medico_legal"
      step3Label="Purpose / Nature of Case"
      extraStep3={extraStep3}
      requirePurpose={false}
      extraFormData={{
        dateOfExamination: dateOfExam,
        usapingBarangay: usapingBarangay,
        dateOfHearing: dateOfHearing,
      }}
    />
  );
}
