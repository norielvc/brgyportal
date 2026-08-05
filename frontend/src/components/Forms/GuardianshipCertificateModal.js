import React, { useState } from 'react';
import UnifiedCertModal from './UnifiedCertModal';
import ResidentSearchModal from '../Modals/ResidentSearchModal';
import { getStrings } from '../../lib/certLang';
import { Search, User, CheckCircle, X } from 'lucide-react';

export default function GuardianshipCertificateModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
  const [guardianResident, setGuardianResident] = useState(null);
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [showGuardianSearch, setShowGuardianSearch] = useState(false);

  const handleGuardianSelect = (resident) => {
    setGuardianResident(resident);
    setShowGuardianSearch(false);
  };

  const handleGuardianClear = () => {
    setGuardianResident(null);
  };

  const extraStep3 = (lang, t) => {
    return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
          {t.guardianHeading} <span className="text-red-500">*</span>
        </label>
        <p className="text-[11px] text-gray-500 mb-3 ml-1">
          {t.guardianHelp}
        </p>

        {guardianResident ? (
          <div className="relative p-5 bg-green-50 border-2 border-green-300 rounded-2xl">
            <button
              type="button"
              onClick={handleGuardianClear}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-black text-gray-900 text-lg uppercase tracking-tight leading-tight">
                  {guardianResident.full_name}
                </p>
                <p className="text-xs text-gray-500 font-semibold">
                  {t.guardianRecordNo} #{guardianResident.id?.slice(0, 8)}...
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-green-200">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{t.guardianAge}</p>
                <p className="text-sm font-bold text-gray-700">{guardianResident.age || "—"}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{t.guardianSex}</p>
                <p className="text-sm font-bold text-gray-700 uppercase">{guardianResident.gender || guardianResident.sex || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{t.guardianAddress}</p>
                <p className="text-sm font-semibold text-gray-700">{guardianResident.residential_address || "—"}</p>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowGuardianSearch(true)}
            className="w-full flex items-center gap-4 p-5 bg-white border-2 border-dashed border-gray-300 rounded-xl text-left transition-colors hover:bg-gray-50 hover:border-gray-400"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="font-black text-gray-700 text-base uppercase tracking-tight">
                {t.guardianSearch}
              </p>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">
                {t.guardianSearchSub}
              </p>
            </div>
          </button>
        )}
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block">
          {t.guardianRelationship} <span className="text-red-500">*</span>
        </label>
        <select value={guardianRelationship} onChange={e => setGuardianRelationship(e.target.value)}
          className="w-full px-6 py-4 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-xl uppercase">
          <option value="">{t.guardianSelectRel}</option>
          <option value="PARENT">PARENT</option>
          <option value="GRANDPARENT">GRANDPARENT</option>
          <option value="SIBLING">SIBLING</option>
          <option value="AUNT/UNCLE">AUNT/UNCLE</option>
          <option value="LEGAL GUARDIAN">LEGAL GUARDIAN</option>
          <option value="OTHER RELATIVE">OTHER RELATIVE</option>
        </select>
      </div>

      {showGuardianSearch && (
        <ResidentSearchModal
          isOpen={showGuardianSearch}
          onClose={() => setShowGuardianSearch(false)}
          onSelect={handleGuardianSelect}
          isDemo={isDemo}
          tenantConfig={tenantConfig}
          lang={lang || 'en'}
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
