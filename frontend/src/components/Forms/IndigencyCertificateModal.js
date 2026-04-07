import React from 'react';
import UnifiedCertModal from './UnifiedCertModal';

export default function IndigencyCertificateModal({ isOpen, onClose, isDemo = false, tenantConfig = {} }) {
  return (
    <UnifiedCertModal
      isOpen={isOpen}
      onClose={onClose}
      isDemo={isDemo}
      tenantConfig={tenantConfig}
      title="Certificate of Indigency"
      certType="certificate_of_indigency"
      step3Label="State Your Purpose / Sabihin ang Layunin"
    />
  );
}
