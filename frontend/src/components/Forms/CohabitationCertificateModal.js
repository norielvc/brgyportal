/**
 * CohabitationCertificateModal
 * Step 3 includes partner search from resident database (same as step 1 resident search)
 * Bilingual labels (English / Filipino)
 */
import React, { useState } from 'react';
import UnifiedCertModal from './UnifiedCertModal';
import ResidentSearchModal from '../Modals/ResidentSearchModal';
import { Search, User, CheckCircle } from 'lucide-react';

export default function CohabitationCertificateModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
  const [partnerName, setPartnerName] = useState('');
  const [partnerId, setPartnerId] = useState(null);
  const [yearsLiving, setYearsLiving] = useState('');
  const [children, setChildren] = useState('0');
  const [isPartnerSearchOpen, setIsPartnerSearchOpen] = useState(false);

  const accentColor = tenantConfig.primaryColor || '#059669';

  const handlePartnerSelect = (resident) => {
    setPartnerName(resident.full_name || '');
    setPartnerId(resident.id);
    setIsPartnerSearchOpen(false);
  };

  // Reset partner fields when modal closes
  const handleClose = () => {
    setPartnerName('');
    setPartnerId(null);
    setYearsLiving('');
    setChildren('0');
    onClose();
  };

  const extraStep3 = (
    <div className="space-y-4">
      {/* Partner Search */}
      <div>
        <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
          Partner's Full Name / <span className="text-gray-400 normal-case font-semibold">Buong Pangalan ng Kasama</span>
          <span className="text-red-500 ml-1">*</span>
        </label>

        {partnerName ? (
          /* Partner selected — show chip with clear option */
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border-2 border-green-200 rounded-2xl">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}20` }}>
              <CheckCircle className="w-4 h-4" style={{ color: accentColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 uppercase text-sm truncate">{partnerName}</p>
              <p className="text-xs text-gray-400">Nahanap sa database / Found in database</p>
            </div>
            <button
              type="button"
              onClick={() => { setPartnerName(''); setPartnerId(null); }}
              className="text-xs text-red-400 hover:text-red-600 font-bold flex-shrink-0"
            >
              Baguhin / Change
            </button>
          </div>
        ) : (
          /* Search button + manual fallback */
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setIsPartnerSearchOpen(true)}
              className="w-full flex items-center gap-3 px-5 py-4 bg-gray-50 border-4 border-gray-100 rounded-2xl hover:border-gray-300 transition-all group"
            >
              <Search className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
              <span className="font-black text-gray-400 uppercase text-sm tracking-wide">
                Search Resident / Hanapin ang Residente
              </span>
            </button>
            <p className="text-[11px] text-gray-400 text-center">— o manu-manong ilagay / or type manually —</p>
            <input
              type="text"
              value={partnerName}
              onChange={e => setPartnerName(e.target.value)}
              placeholder="BUONG PANGALAN NG KASAMA / FULL NAME OF PARTNER"
              className="w-full px-5 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-sm uppercase"
            />
          </div>
        )}
      </div>

      {/* Years + Children */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
            Years Together / <span className="text-gray-400 normal-case font-semibold">Taon ng Pagsasama</span>
          </label>
          <input
            type="number" min="0" value={yearsLiving}
            onChange={e => setYearsLiving(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-xl text-center"
          />
        </div>
        <div>
          <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
            No. of Children / <span className="text-gray-400 normal-case font-semibold">Bilang ng Anak</span>
          </label>
          <input
            type="number" min="0" value={children}
            onChange={e => setChildren(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-xl text-center"
          />
        </div>
      </div>

      {/* Partner search modal */}
      <ResidentSearchModal
        isOpen={isPartnerSearchOpen}
        onClose={() => setIsPartnerSearchOpen(false)}
        onSelect={handlePartnerSelect}
        tenantId={tenantConfig?.tenant_id || (isDemo ? 'demo' : 'ibaoeste')}
      />
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
      requirePurpose={false}
      extraFormData={{ partnerFullName: partnerName, partnerId, yearsLiving, numberOfChildren: children }}
    />
  );
}
