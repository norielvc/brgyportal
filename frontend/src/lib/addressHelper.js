/**
 * Address Helper Utilities
 * Handles structured address fields with auto-population
 */

/**
 * Get barangay, municipality, and province from tenant settings
 * @param {Object} tenantSettings - Barangay settings from API
 * @returns {Object} { barangay, municipality, province }
 */
export function getAutoAddressFields(tenantSettings) {
  const headerInfo = tenantSettings?.certificate_settings?.headerInfo || {};
  
  return {
    barangay: headerInfo.barangayName || '',
    municipality: headerInfo.municipality || '',
    province: headerInfo.province || 'Province of Bulacan',
  };
}

/**
 * Generate full address from components
 * @param {Object} addressData - { house_number, purok, barangay, municipality, province }
 * @returns {string} Full formatted address
 */
export function generateFullAddress(addressData) {
  const {
    house_number,
    purok,
    barangay,
    municipality,
    province,
  } = addressData;

  const parts = [];

  if (house_number?.trim()) {
    parts.push(`HOUSE NO. ${house_number.trim()}`);
  }

  if (purok?.trim()) {
    parts.push(purok.trim().toUpperCase());
  }

  if (barangay?.trim()) {
    parts.push(barangay.trim().toUpperCase());
  }

  if (municipality?.trim()) {
    parts.push(municipality.trim().toUpperCase());
  }

  if (province?.trim()) {
    parts.push(province.trim().toUpperCase());
  }

  return parts.join(', ');
}

/**
 * Parse existing address string into components (best effort)
 * @param {string} addressString - Full address string
 * @returns {Object} { house_number, purok, barangay, municipality, province }
 */
export function parseAddress(addressString) {
  if (!addressString) {
    return {
      house_number: '',
      purok: '',
      barangay: '',
      municipality: '',
      province: '',
    };
  }

  const parts = addressString.split(',').map(p => p.trim());
  const result = {
    house_number: '',
    purok: '',
    barangay: '',
    municipality: '',
    province: '',
  };

  // Try to extract house number
  const houseMatch = parts[0]?.match(/HOUSE\s+NO\.?\s*(.+)/i);
  if (houseMatch) {
    result.house_number = houseMatch[1].trim();
    parts.shift(); // Remove first element
  }

  // Try to extract purok
  const purokMatch = parts[0]?.match(/PUROK\s+(.+)/i);
  if (purokMatch) {
    result.purok = parts[0];
    parts.shift();
  } else if (parts[0]?.match(/^(PUROK|SITIO|NV9)/i)) {
    result.purok = parts[0];
    parts.shift();
  }

  // Remaining parts: barangay, municipality, province
  if (parts.length >= 3) {
    result.barangay = parts[0];
    result.municipality = parts[1];
    result.province = parts[2];
  } else if (parts.length === 2) {
    result.municipality = parts[0];
    result.province = parts[1];
  } else if (parts.length === 1) {
    result.province = parts[0];
  }

  return result;
}

/**
 * Validate address components
 * @param {Object} addressData - { house_number, purok }
 * @returns {Object} { isValid, errors }
 */
export function validateAddress(addressData) {
  const errors = [];

  if (!addressData.house_number?.trim()) {
    errors.push('House number is required');
  }

  if (!addressData.purok?.trim()) {
    errors.push('Purok is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Common purok options for dropdown
 */
export const PUROK_OPTIONS = [
  { value: 'Purok 1', label: 'Purok 1' },
  { value: 'Purok 2', label: 'Purok 2' },
  { value: 'Purok 3', label: 'Purok 3' },
  { value: 'Purok 4', label: 'Purok 4' },
  { value: 'Purok 5', label: 'Purok 5' },
  { value: 'Purok 6', label: 'Purok 6' },
  { value: 'NV9', label: 'NV9 (New Village 9)' },
  { value: 'Purok Maharlika', label: 'Purok Maharlika' },
  { value: 'Sitio Banawe', label: 'Sitio Banawe' },
  { value: 'Other', label: 'Other (Specify)' },
];
