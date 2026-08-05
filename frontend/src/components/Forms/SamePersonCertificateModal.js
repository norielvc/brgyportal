import React, { useState, useMemo } from 'react';
import UnifiedCertModal from './UnifiedCertModal';

export default function SamePersonCertificateModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
  const [aliasFirstName, setAliasFirstName] = useState('');
  const [aliasMiddleName, setAliasMiddleName] = useState('');
  const [aliasLastName, setAliasLastName] = useState('');
  const [aliasSuffix, setAliasSuffix] = useState('');

  // Combine the name parts into a single aliasName using useMemo
  const aliasName = useMemo(() => {
    const combined = `${aliasFirstName} ${aliasMiddleName} ${aliasLastName} ${aliasSuffix}`.replace(/\s+/g, ' ').trim();
    console.log('SamePersonModal - aliasName calculated:', combined);
    return combined;
  }, [aliasFirstName, aliasMiddleName, aliasLastName, aliasSuffix]);

  // Reset fields when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setAliasFirstName('');
      setAliasMiddleName('');
      setAliasLastName('');
      setAliasSuffix('');
    }
  }, [isOpen]);

  const extraStep3 = (lang, t) => (
    <div className="space-y-4">
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-4">
        <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">
          {t.samePersonHeading}
        </p>
        <p className="text-[10px] text-blue-700 font-semibold">
          {t.samePersonHelp}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
            {t.samePersonFirst} <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={aliasFirstName} 
            onChange={e => setAliasFirstName(e.target.value)}
            placeholder={t.samePersonFirst + "..."}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-black outline-none font-bold text-base uppercase" 
          />
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
            {t.samePersonMiddle}
          </label>
          <input 
            type="text" 
            value={aliasMiddleName} 
            onChange={e => setAliasMiddleName(e.target.value)}
            placeholder={t.samePersonMiddle + "..."}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-black outline-none font-bold text-base uppercase" 
          />
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
            {t.samePersonLast} <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={aliasLastName} 
            onChange={e => setAliasLastName(e.target.value)}
            placeholder={t.samePersonLast + "..."}
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-black outline-none font-bold text-base uppercase" 
          />
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
            {t.samePersonSuffix}
          </label>
          <input 
            type="text" 
            value={aliasSuffix} 
            onChange={e => setAliasSuffix(e.target.value)}
            placeholder="JR, SR, III..."
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-black outline-none font-bold text-base uppercase" 
          />
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
      title="Certification of Same Person"
      certType="same_person"
      step3Label="Second Name Information"
      extraStep3={extraStep3}
      extraFormData={{ aliasName }}
      requirePurpose={false}
    />
  );
}
