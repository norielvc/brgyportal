/**
 * CohabitationCertificateModal
 * Step 3: Partner details + years/children
 * Step 4: Address — House No. + Purok (user input), Barangay/Municipality auto-appended
 * Bilingual labels (English / Filipino)
 */
import React, { useState } from 'react';
import UnifiedCertModal from './UnifiedCertModal';
import ResidentSearchModal from '../Modals/ResidentSearchModal';
import { PUROK_OPTIONS } from '../../lib/addressHelper';
import { Search, CheckCircle, MapPin, Info } from 'lucide-react';

export default function CohabitationCertificateModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
  const [partnerName, setPartnerName] = useState('');
  const [partnerId, setPartnerId] = useState(null);
  const [partnerAge, setPartnerAge] = useState('');
  const [partnerSex, setPartnerSex] = useState('');
  const [partnerDob, setPartnerDob] = useState('');
  const [partnerResidentialAddress, setPartnerResidentialAddress] = useState('');
  const [yearsLiving, setYearsLiving] = useState('');
  const [children, setChildren] = useState('0');
  const [isPartnerSearchOpen, setIsPartnerSearchOpen] = useState(false);
  const [houseNo, setHouseNo] = useState('');
  const [purok, setPurok] = useState('');
  const [phase, setPhase] = useState('');
  const [block, setBlock] = useState('');
  const [lot, setLot] = useState('');

  const accentColor = tenantConfig.primaryColor || '#059669';

  // Proper barangay/municipality/province from tenant certificate settings
  const headerInfo = tenantConfig.certificate_settings?.headerInfo || {};
  const barangay = (headerInfo.barangayName || "IBA O' ESTE").toUpperCase();
  const municipality = (headerInfo.municipality || 'CALUMPIT').toUpperCase();
  const province = (headerInfo.province || 'BULACAN').toUpperCase();

  // Auto barangay suffix for the full address
  const barangaySuffix = `BRGY. ${barangay}, ${municipality}, ${province}`;

  // Effective house number: combine phase/block/lot for North Ville 9
  const effectiveHouseNo = purok === 'NORTH VILLE 9'
    ? [phase.trim() && `PHASE ${phase.trim()}`, block.trim() && `BLOCK ${block.trim()}`, lot.trim() && `LOT ${lot.trim()}`].filter(Boolean).join(' ')
    : houseNo;

  // Composed full address
  const composedAddress = [effectiveHouseNo, purok, barangaySuffix].filter(Boolean).join(', ');

  const handlePurokChange = (val) => {
    setPurok(val);
    setHouseNo('');
    setPhase('');
    setBlock('');
    setLot('');
  };

  const handlePartnerSelect = (resident) => {
    setPartnerName(resident.full_name || '');
    setPartnerId(resident.id);
    setPartnerAge(resident.age || '');
    setPartnerSex(resident.gender || resident.sex || '');
    setPartnerDob(resident.date_of_birth || '');
    setPartnerResidentialAddress(resident.residential_address || '');
    setIsPartnerSearchOpen(false);
  };

  const handleClose = () => {
    setPartnerName(''); setPartnerId(null);
    setPartnerAge(''); setPartnerSex(''); setPartnerDob('');
    setPartnerResidentialAddress('');
    setYearsLiving(''); setChildren('0');
    setHouseNo(''); setPurok('');
    setPhase(''); setBlock(''); setLot('');
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
            <button type="button" onClick={() => { setPartnerName(''); setPartnerId(null); setPartnerAge(''); setPartnerSex(''); setPartnerDob(''); }}
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
      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black text-amber-800 uppercase tracking-wide mb-0.5">
            Address Verification / Beripikasyon ng Tirahan
          </p>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Enter your <strong>current shared address</strong>. Staff will compare this with records on file.
            <br />
            <span className="text-amber-600">Ilagay ang inyong <strong>kasalukuyang tirahan</strong>. Ikukumpara ito ng staff sa rekord.</span>
          </p>
        </div>
      </div>

      {/* Purok — shown first */}
      <div>
        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
          Purok <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={purok}
          onChange={e => handlePurokChange(e.target.value)}
          className="w-full px-5 py-4 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base uppercase"
        >
          <option value="">-- Select Purok --</option>
          {PUROK_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* House No. or Phase/Block/Lot — conditional on purok */}
      {purok === 'NORTH VILLE 9' ? (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
              Phase <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={phase}
              onChange={e => setPhase(e.target.value)}
              placeholder="1"
              className="w-full px-4 py-4 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base uppercase text-center"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
              Block <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={block}
              onChange={e => setBlock(e.target.value)}
              placeholder="1"
              className="w-full px-4 py-4 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base uppercase text-center"
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
              Lot <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={lot}
              onChange={e => setLot(e.target.value)}
              placeholder="2"
              className="w-full px-4 py-4 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base uppercase text-center"
            />
          </div>
        </div>
      ) : purok ? (
        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
            House No. / <span className="text-gray-400 normal-case font-semibold">Numero ng Bahay</span>
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            required
            value={houseNo}
            onChange={e => setHouseNo(e.target.value.toUpperCase())}
            placeholder="E.G. 123, 2706-A"
            className="w-full px-5 py-4 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base uppercase"
          />
        </div>
      ) : (
        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
            House No. / <span className="text-gray-400 normal-case font-semibold">Numero ng Bahay</span>
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            disabled
            placeholder="Select a purok first"
            className="w-full px-5 py-4 bg-gray-100 border-4 border-gray-100 rounded-2xl font-black text-base uppercase cursor-not-allowed"
          />
        </div>
      )}

      {/* Auto-filled barangay */}
      <div>
        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
          Barangay / Municipality
          <span className="ml-2 text-[10px] normal-case font-semibold text-green-600">
            ✓ Awtomatiko / Auto-filled
          </span>
        </label>
        <div className="w-full px-5 py-4 bg-green-50 border-4 border-green-100 rounded-2xl font-black text-sm text-green-800 uppercase tracking-wide select-none">
          {barangaySuffix}
        </div>
      </div>

      {/* Live preview */}
      {(effectiveHouseNo || purok) && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Full Address Preview / Buong Tirahan
          </p>
          <p className="text-sm font-black text-gray-800 uppercase leading-relaxed">
            {composedAddress}
          </p>
        </div>
      )}

      {/* Staff note */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
        <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
        <p className="text-[11px] text-gray-500 font-semibold">
          Staff will review and may update both residents' records if a change is confirmed. /
          <span className="text-gray-400"> Susuriin ng staff at ia-update kung kinakailangan.</span>
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
        partnerResidentialAddress,
        yearsLiving,
        numberOfChildren: children,
        houseNo: effectiveHouseNo,
        purok,
        currentAddress: composedAddress,
      }}
    />
  );
}
