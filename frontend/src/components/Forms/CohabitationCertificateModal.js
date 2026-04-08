/**
 * CohabitationCertificateModal
 * Step 3: Partner details + years/children
 * Step 4: Current shared address (requestor-entered, not pulled from DB — for staff verification)
 * Bilingual labels (English / Filipino)
 */
import React, { useState } from 'react';
import UnifiedCertModal from './UnifiedCertModal';
import ResidentSearchModal from '../Modals/ResidentSearchModal';
import { Search, CheckCircle, MapPin, Info } from 'lucide-react';

export default function CohabitationCertificateModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
  const [partnerName, setPartnerName] = useState('');
  const [partnerId, setPartnerId] = useState(null);
  const [partnerAge, setPartnerAge] = useState('');
  const [partnerSex, setPartnerSex] = useState('');
  const [partnerDob, setPartnerDob] = useState('');
  const [yearsLiving, setYearsLiving] = useState('');
  const [children, setChildren] = useState('0');
  const [isPartnerSearchOpen, setIsPartnerSearchOpen] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');
  const [purok, setPurok] = useState('');

  const accentColor = tenantConfig.primaryColor || '#059669';

  const handlePartnerSelect = (resident) => {
    setPartnerName(resident.full_name || '');
    setPartnerId(resident.id);
    setPartnerAge(resident.age || '');
    setPartnerSex(resident.gender || resident.sex || '');
    setPartnerDob(resident.date_of_birth || '');
    setIsPartnerSearchOpen(false);
  };

  const handleClose = () => {
    setPartnerName(''); setPartnerId(null);
    setPartnerAge(''); setPartnerSex(''); setPartnerDob('');
    setYearsLiving(''); setChildren('0');
    setCurrentAddress(''); setPurok('');
    onClose();
  };

  const extraStep3 = (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
          Partner's Full Name / <span className="text-gray-400 normal-case font-semibold">Buong Pangalan ng Kasama</span>
          <span className="text-red-500 ml-1">*</span>
        </label>
        {partnerName ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border-2 border-green-200 rounded-2xl">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}20` }}>
              <CheckCircle className="w-4 h-4" style={{ color: accentColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 uppercase text-sm truncate">{partnerName}</p>
              <p className="text-xs text-gray-400">Nahanap sa database / Found in database</p>
            </div>
            <button type="button" onClick={() => { setPartnerName(''); setPartnerId(null); }}
              className="text-xs text-red-400 hover:text-red-600 font-bold flex-shrink-0">
              Baguhin / Change
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button type="button" onClick={() => setIsPartnerSearchOpen(true)}
              className="w-full flex items-center gap-3 px-5 py-4 bg-gray-50 border-4 border-gray-100 rounded-2xl hover:border-gray-300 transition-all group">
              <Search className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
              <span className="font-black text-gray-400 uppercase text-sm tracking-wide">
                Search Resident / Hanapin ang Residente
              </span>
            </button>
            <p className="text-[11px] text-gray-400 text-center">— o manu-manong ilagay / or type manually —</p>
            <input type="text" value={partnerName} onChange={e => setPartnerName(e.target.value)}
              placeholder="BUONG PANGALAN NG KASAMA / FULL NAME OF PARTNER"
              className="w-full px-5 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-sm uppercase" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
            Years Together / <span className="text-gray-400 normal-case font-semibold">Taon ng Pagsasama</span>
          </label>
          <input type="number" min="0" value={yearsLiving} onChange={e => setYearsLiving(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-xl text-center" />
        </div>
        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
            No. of Children / <span className="text-gray-400 normal-case font-semibold">Bilang ng Anak</span>
          </label>
          <input type="number" min="0" value={children} onChange={e => setChildren(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-xl text-center" />
        </div>
      </div>

      <ResidentSearchModal
        isOpen={isPartnerSearchOpen}
        onClose={() => setIsPartnerSearchOpen(false)}
        onSelect={handlePartnerSelect}
        tenantConfig={tenantConfig}
        tenantId={tenantConfig?.tenant_id || (isDemo ? 'demo' : 'ibaoeste')}
      />
    </div>
  );

  const extraStep4 = (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black text-amber-800 uppercase tracking-wide mb-0.5">
            Address Verification / Beripikasyon ng Tirahan
          </p>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Please enter your <strong>current shared address</strong>. Staff will compare this with records on file to verify or update both residents' addresses.
            <br />
            <span className="text-amber-600">Ilagay ang inyong <strong>kasalukuyang tirahan</strong>. Ito ay ikukumpara ng staff sa rekord para sa beripikasyon.</span>
          </p>
        </div>
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
          Purok / Sitio <span className="text-red-500">*</span>
        </label>
        <input type="text" value={purok} onChange={e => setPurok(e.target.value.toUpperCase())}
          placeholder="E.G. PUROK 3, SITIO BANAWE"
          className="w-full px-5 py-4 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base uppercase" />
      </div>

      <div>
        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
          Current Shared Address / <span className="text-gray-400 normal-case font-semibold">Kasalukuyang Tirahan</span>
          <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea value={currentAddress} onChange={e => setCurrentAddress(e.target.value.toUpperCase())}
          placeholder="HOUSE NO., STREET, BARANGAY, MUNICIPALITY"
          rows={3}
          className="w-full px-5 py-4 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-sm uppercase resize-none" />
        <p className="text-[10px] text-gray-400 mt-1 ml-1">
          ⚠️ Barangay name and municipality is sufficient. Do not include sensitive landmarks. /
          Sapat na ang pangalan ng barangay at munisipyo.
        </p>
      </div>

      <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
        <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
        <p className="text-[11px] text-gray-500 font-semibold">
          Staff will review this address against both residents' records and may update them if a change is confirmed. /
          <span className="text-gray-400"> Susuriin ng staff ang address na ito at ia-update kung kinakailangan.</span>
        </p>
      </div>
    </div>
  );

  return (
    <UnifiedCertModal
      isOpen={isOpen}
      onClose={handleClose}
      isDemo={isDemo}
      tenantConfig={tenantConfig}
      title="Co-habitation Certificate"
      certType="cohabitation"
      step3Label="Purpose of Certification / Layunin ng Sertipikasyon"
      extraStep3={extraStep3}
      extraStep4={extraStep4}
      requirePurpose={false}
      extraFormData={{
        partnerFullName: partnerName,
        partnerId,
        partnerAge,
        partnerSex,
        partnerDateOfBirth: partnerDob,
        yearsLiving,
        numberOfChildren: children,
        purok,
        currentAddress,
      }}
    />
  );
}
