import React from "react";
import BarangayClearanceModal from "./BarangayClearanceModal";

export default function FirstTimeJobSeekerModal({
  isOpen,
  onClose,
  isDemo = false,
  tenantConfig = {},
}) {
  return (
    <BarangayClearanceModal
      isOpen={isOpen}
      onClose={onClose}
      isDemo={isDemo}
      tenantConfig={tenantConfig}
      certType="first_time_job_seeker"
      customTitle="First Time Job Seeker"
    />
  );
}

