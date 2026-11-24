import React, { useState } from 'react';
import UnifiedCertModal from './UnifiedCertModal';
import ResidentSearchModal from '../Modals/ResidentSearchModal';
import { Search, CheckCircle, ChevronRight } from 'lucide-react';

export default function GuardianshipCertificateModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
  const [guardianResident, setGuardianResident] = useState(null);
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [showGuardianSearch, setShowGuardianSearch] = useState(false);

  const accentColor = tenantConfig.primaryColor || '#059669';

  const handleGuardianSelect = (resident) => {
    setGuardianResident(resident);
    setShowGuardianSearch(false);
  };

  const handleGuardianClear = () => {
    setGuardianResident(null);
  };

  const extraStep3 = (lang, t) => {
    const isTl = lang !== 'en';
    const relOptions = isTl
      ? [
          { value: 'PARENT', label: 'MAGULANG' },
          { value: 'GRANDPARENT', label: 'LOLO / LOLA' },
          { value: 'SIBLING', label: 'KAPATID' },
          { value: 'AUNT/UNCLE', label: 'TIYO / TIYA' },
          { value: 'LEGAL GUARDIAN', label: 'LEGAL NA TAGAPANGALAGA' },
          { value: 'OTHER RELATIVE', label: 'IBANG KAMAG-ANAK' },
        ]
      : [
          { value: 'PARENT', label: 'PARENT' },
          { value: 'GRANDPARENT', label: 'GRANDPARENT' },
          { value: 'SIBLING', label: 'SIBLING' },
          { value: 'AUNT/UNCLE', label: 'AUNT / UNCLE' },
          { value: 'LEGAL GUARDIAN', label: 'LEGAL GUARDIAN' },
          { value: 'OTHER RELATIVE', label: 'OTHER RELATIVE' },
        ];

    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {t.guardianHeading}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {t.guardianHelp}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {t.guardianHeading} <span className="text-red-600">*</span>
          </label>

          {guardianResident ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: `${accentColor}12` }}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: accentColor }}>
                    {t.guardianVerified}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGuardianClear}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold"
                >
                  {isTl ? 'Baguhin' : 'Change'}
                </button>
              </div>
              <div className="p-4 bg-white space-y-3">
                <div>
                  <p className="text-base font-bold text-gray-900 uppercase leading-tight">
                    {guardianResident.full_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t.guardianRecordNo} #{guardianResident.id?.slice(0, 8)}...
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-0.5">{t.guardianAge}</p>
                    <p className="text-sm font-semibold text-gray-800">{guardianResident.age || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-0.5">{t.guardianSex}</p>
                    <p className="text-sm font-semibold text-gray-800 uppercase">{guardianResident.gender || guardianResident.sex || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-0.5">{t.guardianAddress}</p>
                    <p className="text-sm font-medium text-gray-700">{guardianResident.residential_address || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowGuardianSearch(true)}
              className="w-full flex items-center gap-3.5 p-4 bg-white border-2 border-dashed border-gray-300 rounded-xl text-left transition-colors hover:bg-gray-50"
              onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = ''; }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: accentColor }}>
                <Search className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">
                  {t.guardianSearch}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t.guardianSearchSub}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {t.guardianRelationship} <span className="text-red-600">*</span>
          </label>
          <select
            value={guardianRelationship}
            onChange={e => setGuardianRelationship(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-gray-200"
          >
            <option value="">{t.guardianSelectRel}</option>
            {relOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {showGuardianSearch && (
          <ResidentSearchModal
            isOpen={showGuardianSearch}
            onClose={() => setShowGuardianSearch(false)}
            onSelect={handleGuardianSelect}
            isDemo={isDemo}
            tenantConfig={tenantConfig}
            lang={lang || "tl"}
          />
        )}
      </div>
    );
  };

  const extraFormData = guardianResident
    ? {
        guardianName: guardianResident.full_name,
        guardianResidentId: guardianResident.id,
        guardianResidentAddress: guardianResident.residential_address || "",
        guardianResidentAge: guardianResident.age || "",
        guardianResidentSex: guardianResident.gender || guardianResident.sex || "",
        guardianRelationship,
      }
    : { guardianName: '', guardianRelationship };

  return (
    <UnifiedCertModal
      isOpen={isOpen}
      onClose={() => {
        setGuardianResident(null);
        setGuardianRelationship('');
        setShowGuardianSearch(false);
        onClose();
      }}
      isDemo={isDemo}
      tenantConfig={tenantConfig}
      title="Guardianship Certificate"
      certType="barangay_guardianship"
      step3Label="Purpose of Guardianship"
      extraStep3={extraStep3}
      requirePurpose={false}
      extraFormData={extraFormData}
    />
  );
}
