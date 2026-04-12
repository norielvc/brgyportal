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

  const extraStep3 = (
    <div className="space-y-4">
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-4">
        <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">
          Second Name / Other Name Used
        </p>
        <p className="text-[10px] text-blue-700 font-semibold">
          Please provide the alternative name that belongs to the same person
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
            First Name <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={aliasFirstName} 
            onChange={e => setAliasFirstName(e.target.value)}
            placeholder="FIRST NAME..."
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-black outline-none font-bold text-base uppercase" 
          />
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
            Middle Name
          </label>
          <input 
            type="text" 
            value={aliasMiddleName} 
            onChange={e => setAliasMiddleName(e.target.value)}
            placeholder="MIDDLE NAME..."
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-black outline-none font-bold text-base uppercase" 
          />
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={aliasLastName} 
            onChange={e => setAliasLastName(e.target.value)}
            placeholder="LAST NAME..."
            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-black outline-none font-bold text-base uppercase" 
          />
        </div>

        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
            Suffix
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
