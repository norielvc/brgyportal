import React from 'react';
import UnifiedCertModal from './UnifiedCertModal';

export default function ResidencyCertificateModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
  return (
    <UnifiedCertModal
      isOpen={isOpen}
      onClose={onClose}
      isDemo={isDemo}
      tenantConfig={tenantConfig}
      title="Barangay Residency Certificate"
      certType="barangay_residency"
      step3Label="State Your Purpose / Sabihin ang Layunin"
    />
  );
}
