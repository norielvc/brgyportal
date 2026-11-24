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
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-1">
          {t.samePersonHeading}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          {t.samePersonHelp}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {t.samePersonFirst} <span className="text-red-600">*</span>
          </label>
          <input 
            type="text" 
            value={aliasFirstName} 
            onChange={e => setAliasFirstName(e.target.value)}
            placeholder={t.samePersonFirst}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-900 uppercase outline-none transition-colors focus:ring-2 focus:ring-gray-200" 
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {t.samePersonMiddle}
          </label>
          <input 
            type="text" 
            value={aliasMiddleName} 
            onChange={e => setAliasMiddleName(e.target.value)}
            placeholder={t.samePersonMiddle}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-900 uppercase outline-none transition-colors focus:ring-2 focus:ring-gray-200" 
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {t.samePersonLast} <span className="text-red-600">*</span>
          </label>
          <input 
            type="text" 
            value={aliasLastName} 
            onChange={e => setAliasLastName(e.target.value)}
            placeholder={t.samePersonLast}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-900 uppercase outline-none transition-colors focus:ring-2 focus:ring-gray-200" 
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {t.samePersonSuffix}
          </label>
          <input 
            type="text" 
            value={aliasSuffix} 
            onChange={e => setAliasSuffix(e.target.value)}
            placeholder="JR, SR, III..."
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-900 uppercase outline-none transition-colors focus:ring-2 focus:ring-gray-200" 
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
