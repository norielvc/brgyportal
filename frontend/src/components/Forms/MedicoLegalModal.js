import React, { useState } from 'react';
import UnifiedCertModal from './UnifiedCertModal';

export default function MedicoLegalModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
  const [dateOfExam, setDateOfExam] = useState('');
  const [usapingBarangay, setUsapingBarangay] = useState('');

  const extraStep3 = (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">Date of Examination</label>
        <input type="date" value={dateOfExam} onChange={e => setDateOfExam(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base" />
      </div>
      <div>
        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">Usaping Barangay No.</label>
        <input type="text" value={usapingBarangay} onChange={e => setUsapingBarangay(e.target.value)}
          placeholder="CASE NUMBER"
          className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base uppercase" />
      </div>
    </div>
  );

  return (
    <UnifiedCertModal
      isOpen={isOpen}
      onClose={onClose}
      isDemo={isDemo}
      tenantConfig={tenantConfig}
      title="Medico-Legal Certificate"
      certType="medico_legal"
      step3Label="Purpose / Nature of Case"
      extraStep3={extraStep3}
    />
  );
}
