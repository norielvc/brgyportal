/**
 * CohabitationCertificateModal
 * Step 3: Partner details + years/children
 * Step 4: Address — House No. + Purok (user input), Barangay/Municipality auto-appended
 * Localized labels (English or Tagalog based on selected language)
 */
import React, { useState } from 'react';
import UnifiedCertModal from './UnifiedCertModal';
import ResidentSearchModal from '../Modals/ResidentSearchModal';
import { PUROK_OPTIONS, PHASE_OPTIONS, isSubdivisionPurok, hasPhaseField } from '../../lib/addressHelper';
import { Search, CheckCircle, MapPin, Info, ChevronRight } from 'lucide-react';

const computeAgeFromDob = (dobValue) => {
  const raw = String(dobValue || '').trim();
  if (!raw) return '';
  const d = new Date(raw.includes('T') ? raw : `${raw}T00:00:00`);
  if (isNaN(d.getTime())) return '';
  const today = new Date();
  let years = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    years -= 1;
  }
  return years >= 0 ? String(years) : '';
};

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
  const barangaySuffix = `${barangay}, ${municipality}, ${province}`;

  // Effective house number: combine phase/block/lot for subdivisions (North Ville 9, Hazel Heights, Creekstone)
  const effectivePhase = phase.trim() ? (phase.trim().toUpperCase().startsWith('PHASE') || ['YAKAL', 'PALIKPIK'].includes(phase.trim().toUpperCase()) ? phase.trim().toUpperCase() : `PHASE ${phase.trim()}`) : '';
  const effectiveHouseNo = isSubdivisionPurok(purok)
    ? [effectivePhase, block.trim() && `BLOCK ${block.trim()}`, lot.trim() && `LOT ${lot.trim()}`].filter(Boolean).join(' ')
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
    const dob = resident.date_of_birth || '';
    const resolvedAge =
      resident.age != null && String(resident.age).trim() !== ''
        ? String(resident.age)
        : computeAgeFromDob(dob);
    setPartnerName(resident.full_name || '');
    setPartnerId(resident.id);
    setPartnerAge(resolvedAge);
    setPartnerSex(resident.gender || resident.sex || '');
    setPartnerDob(dob);
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

  const extraStep3 = (lang) => {
    const isTl = lang !== 'en';
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {isTl ? 'Impormasyon ng Kinakasama' : "Partner's Information"}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {isTl
              ? 'Hanapin ang pangalan ng iyong kinakasama sa direktoryo o ilagay nang manu-mano.'
              : "Search for your partner's record in the directory or enter their full name manually."}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {isTl ? 'Buong Pangalan ng Kasama' : "Partner's Full Name"} <span className="text-red-600">*</span>
          </label>
          {partnerName && partnerId ? (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: `${accentColor}12` }}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: accentColor }}>
                    {isTl ? 'Nahanap sa Direktoryo' : 'Found in Directory'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setPartnerName(''); setPartnerId(null); setPartnerAge(''); setPartnerSex(''); setPartnerDob(''); }}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold"
                >
                  {isTl ? 'Baguhin' : 'Change'}
                </button>
              </div>
              <div className="p-4 bg-white">
                <p className="text-base font-bold text-gray-900 uppercase leading-tight truncate">{partnerName}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setIsPartnerSearchOpen(true)}
                className="w-full flex items-center gap-3.5 p-4 bg-white border-2 border-dashed border-gray-300 rounded-xl text-left transition-colors hover:bg-gray-50"
                onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ''; }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: accentColor }}>
                  <Search className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900">
                    {isTl ? 'Hanapin ang Residente' : 'Search Resident Directory'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isTl ? 'Piliin mula sa talaan ng barangay' : 'Look up your partner in barangay records'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </button>

              <p className="text-xs text-gray-400 text-center">
                {isTl ? '— o manu-manong ilagay —' : '— or type manually —'}
              </p>

              <input
                type="text"
                value={partnerName}
                onChange={e => setPartnerName(e.target.value)}
                placeholder={isTl ? 'BUONG PANGALAN NG KASAMA' : 'FULL NAME OF PARTNER'}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-900 uppercase outline-none transition-colors focus:ring-2 focus:ring-gray-200"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              {isTl ? 'Taon ng Pagsasama' : 'Years Together'}
            </label>
            <input
              type="number"
              min="0"
              value={yearsLiving}
              onChange={e => setYearsLiving(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-semibold text-gray-900 text-center outline-none transition-colors focus:ring-2 focus:ring-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              {isTl ? 'Bilang ng Anak' : 'No. of Children'}
            </label>
            <input
              type="number"
              min="0"
              value={children}
              onChange={e => setChildren(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-semibold text-gray-900 text-center outline-none transition-colors focus:ring-2 focus:ring-gray-200"
            />
          </div>
        </div>

        <ResidentSearchModal
          isOpen={isPartnerSearchOpen}
          onClose={() => setIsPartnerSearchOpen(false)}
          onSelect={handlePartnerSelect}
          tenantConfig={tenantConfig}
          tenantId={tenantConfig?.tenant_id || (isDemo ? 'demo' : 'ibaoeste')}
          lang={lang || 'tl'}
        />
      </div>
    );
  };

  const extraStep4 = (lang) => {
    const isTl = lang !== 'en';
    return (
      <div className="space-y-5">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-0.5">
              {isTl ? 'Beripikasyon ng Tirahan' : 'Address Verification'}
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              {isTl ? (
                <>Ilagay ang inyong <strong>kasalukuyang tirahan</strong>. Ikukumpara ito ng staff sa rekord.</>
              ) : (
                <>Enter your <strong>current shared address</strong>. Staff will compare this with records on file.</>
              )}
            </p>
          </div>
        </div>

        {/* Purok — shown first */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Purok <span className="text-red-600">*</span>
          </label>
          <select
            required
            value={purok}
            onChange={e => handlePurokChange(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-gray-200"
          >
            <option value="">{isTl ? '-- Pumili ng Purok --' : '-- Select Purok --'}</option>
            {PUROK_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* House No. or Phase/Block/Lot — conditional on purok */}
        {isSubdivisionPurok(purok) ? (
          hasPhaseField(purok) ? (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Phase <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={phase}
                  onChange={e => setPhase(e.target.value)}
                  className="w-full px-3.5 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-900 outline-none transition-colors focus:ring-2 focus:ring-gray-200"
                >
                  <option value="">{isTl ? '-- Pumili --' : '-- Select --'}</option>
                  {PHASE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Block <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={block}
                  onChange={e => setBlock(e.target.value)}
                  placeholder="1"
                  className="w-full px-3.5 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-semibold text-gray-900 uppercase text-center outline-none transition-colors focus:ring-2 focus:ring-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Lot <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lot}
                  onChange={e => setLot(e.target.value)}
                  placeholder="2"
                  className="w-full px-3.5 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-semibold text-gray-900 uppercase text-center outline-none transition-colors focus:ring-2 focus:ring-gray-200"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Block <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={block}
                  onChange={e => setBlock(e.target.value)}
                  placeholder="1"
                  className="w-full px-3.5 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-semibold text-gray-900 uppercase text-center outline-none transition-colors focus:ring-2 focus:ring-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Lot <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lot}
                  onChange={e => setLot(e.target.value)}
                  placeholder="2"
                  className="w-full px-3.5 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-semibold text-gray-900 uppercase text-center outline-none transition-colors focus:ring-2 focus:ring-gray-200"
                />
              </div>
            </div>
          )
        ) : purok ? (
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              {isTl ? 'Numero ng Bahay' : 'House No.'} <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={houseNo}
              onChange={e => setHouseNo(e.target.value.toUpperCase())}
              placeholder={isTl ? 'HAL. 123, 2706-A' : 'E.G. 123, 2706-A'}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[15px] font-medium text-gray-900 uppercase outline-none transition-colors focus:ring-2 focus:ring-gray-200"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              {isTl ? 'Numero ng Bahay' : 'House No.'} <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              disabled
              placeholder={isTl ? 'Pumili muna ng purok' : 'Select a purok first'}
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-[15px] text-gray-400 cursor-not-allowed"
            />
          </div>
        )}

        {/* Auto-filled barangay */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            {isTl ? 'Barangay at Bayan' : 'Barangay / Municipality'}
            <span className="ml-2 text-xs font-medium text-emerald-600">
              ✓ {isTl ? 'Awtomatiko' : 'Auto-filled'}
            </span>
          </label>
          <div className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg font-semibold text-sm text-emerald-800 uppercase tracking-wide select-none">
            {barangaySuffix}
          </div>
        </div>

        {/* Live preview */}
        {(effectiveHouseNo || purok) && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.12em] mb-1">
              {isTl ? 'Buong Tirahan' : 'Full Address Preview'}
            </p>
            <p className="text-sm font-bold text-gray-900 uppercase leading-relaxed">
              {composedAddress}
            </p>
          </div>
        )}

        {/* Staff note */}
        <div className="flex items-center gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
          <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">
            {isTl
              ? 'Susuriin ng staff at ia-update ang rekord ng parehong residente kung may pagbabago.'
              : "Staff will review and may update both residents' records if a change is confirmed."}
          </p>
        </div>
      </div>
    );
  };

  return (
    <UnifiedCertModal
      isOpen={isOpen}
      onClose={handleClose}
      isDemo={isDemo}
      tenantConfig={tenantConfig}
      title="Co-habitation Certificate"
      certType="cohabitation"
      step3Label="Purpose of Certification"
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
