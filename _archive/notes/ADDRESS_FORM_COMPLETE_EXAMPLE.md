# Complete Address Form Example with Province

## Full Form Layout (5 Fields)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              📍 RESIDENTIAL ADDRESS SECTION                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌─────────────────────────────┬─────────────────────────────┐
│ 🏠 House Number *           │ 📌 Purok / Sitio *          │
│ ┌─────────────────────────┐ │ ┌─────────────────────────┐ │
│ │ 2706                    │ │ │ ▼ Purok Maharlika       │ │
│ └─────────────────────────┘ │ └─────────────────────────┘ │
│ Enter house/building number │ Select your purok or sitio  │
└─────────────────────────────┴─────────────────────────────┘

┌─────────────────────────────┬─────────────────────────────┐
│ 🏘️ Barangay (Automatic) 🔒  │ 🏛️ Municipality (Auto) 🔒   │
│ ┌─────────────────────────┐ │ ┌─────────────────────────┐ │
│ │ IBA O' ESTE             │ │ │ CALUMPIT                │ │
│ └─────────────────────────┘ │ └─────────────────────────┘ │
│ ✓ Auto-filled from settings │ ✓ Auto-filled from settings │
└─────────────────────────────┴─────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│ 🗺️ Province (Automatic) 🔒                                │
│ ┌─────────────────────────────────────────────────────────┐
│ │ PROVINCE OF BULACAN                                     │
│ └─────────────────────────────────────────────────────────┘
│ ✓ Auto-filled from system settings                        │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│ 📋 Full Address Preview (Auto-Generated):                 │
│ ┌─────────────────────────────────────────────────────────┐
│ │ HOUSE NO. 2706, PUROK MAHARLIKA, IBA O' ESTE,          │
│ │ CALUMPIT, PROVINCE OF BULACAN                           │
│ └─────────────────────────────────────────────────────────┘
└───────────────────────────────────────────────────────────┘
```

## Complete React Component Code

```jsx
import { useState, useEffect } from 'react';
import { generateFullAddress, getAutoAddressFields, PUROK_OPTIONS } from '@/lib/addressHelper';

function ResidentForm() {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    // ... other fields
    house_number: '',
    purok: '',
    barangay: '',
    municipality: '',
    province: 'Province of Bulacan',
  });

  const [autoAddressFields, setAutoAddressFields] = useState({
    barangay: '',
    municipality: '',
    province: 'Province of Bulacan'
  });

  // Fetch tenant settings and auto-populate
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings', {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        });
        const data = await response.json();
        if (data.success) {
          const autoFields = getAutoAddressFields(data.settings);
          setAutoAddressFields(autoFields);
          setFormData(prev => ({
            ...prev,
            barangay: autoFields.barangay,
            municipality: autoFields.municipality,
            province: autoFields.province,
          }));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <form>
      {/* ... other form fields ... */}

      {/* ADDRESS SECTION */}
      <div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100 space-y-4">
        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">
          📍 Residential Address
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. House Number - USER INPUT */}
          <div>
            <label className="label">
              🏠 House Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., 2706, 123-A, Blk 5 Lot 10"
              className="input uppercase font-bold"
              value={formData.house_number}
              onChange={(e) =>
                setFormData({ ...formData, house_number: e.target.value })
              }
            />
            <p className="text-[9px] text-gray-500 mt-1 font-semibold">
              Enter your house/building number
            </p>
          </div>

          {/* 2. Purok - USER DROPDOWN */}
          <div>
            <label className="label">
              📌 Purok / Sitio <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="input uppercase font-bold"
              value={formData.purok}
              onChange={(e) =>
                setFormData({ ...formData, purok: e.target.value })
              }
            >
              <option value="">-- SELECT PUROK --</option>
              {PUROK_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-[9px] text-gray-500 mt-1 font-semibold">
              Select your purok or sitio
            </p>
          </div>

          {/* 3. Barangay - AUTO-POPULATED */}
          <div>
            <label className="label">
              🏘️ Barangay <span className="text-blue-500">(Automatic)</span>
            </label>
            <input
              type="text"
              readOnly
              className="input uppercase font-bold bg-gray-100 cursor-not-allowed"
              value={formData.barangay}
            />
            <p className="text-[9px] text-blue-600 mt-1 font-semibold">
              ✓ Auto-filled from system settings
            </p>
          </div>

          {/* 4. Municipality - AUTO-POPULATED */}
          <div>
            <label className="label">
              🏛️ Municipality <span className="text-blue-500">(Automatic)</span>
            </label>
            <input
              type="text"
              readOnly
              className="input uppercase font-bold bg-gray-100 cursor-not-allowed"
              value={formData.municipality}
            />
            <p className="text-[9px] text-blue-600 mt-1 font-semibold">
              ✓ Auto-filled from system settings
            </p>
          </div>

          {/* 5. Province - AUTO-POPULATED (FULL WIDTH) */}
          <div className="md:col-span-2">
            <label className="label">
              🗺️ Province <span className="text-blue-500">(Automatic)</span>
            </label>
            <input
              type="text"
              readOnly
              className="input uppercase font-bold bg-gray-100 cursor-not-allowed"
              value={formData.province}
            />
            <p className="text-[9px] text-blue-600 mt-1 font-semibold">
              ✓ Auto-filled from system settings
            </p>
          </div>
        </div>

        {/* FULL ADDRESS PREVIEW */}
        <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
            📋 Full Address Preview:
          </p>
          <p className="text-[13px] font-bold text-gray-800 uppercase">
            {generateFullAddress(formData) || 'Enter house number and purok to see preview'}
          </p>
        </div>
      </div>

      {/* ... rest of form ... */}
    </form>
  );
}
```

## Database Structure (All 5 Fields)

```sql
CREATE TABLE residents (
    id UUID PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    -- ... other fields ...
    
    -- ADDRESS FIELDS (5 columns)
    house_number VARCHAR(50),              -- User input
    purok VARCHAR(100),                    -- User dropdown
    barangay VARCHAR(100),                 -- Auto from settings
    municipality VARCHAR(100),             -- Auto from settings
    province VARCHAR(100) DEFAULT 'Province of Bulacan',  -- Auto from settings
    
    -- AUTO-GENERATED FULL ADDRESS
    full_address_computed TEXT,            -- Trigger generates this
    
    -- BACKWARD COMPATIBILITY
    residential_address TEXT               -- Keep old data
);
```

## Data Flow (All 5 Fields)

```
USER INPUTS:
├─ House Number: "2706"
└─ Purok: "Purok Maharlika" (from dropdown)

SYSTEM AUTO-POPULATES (from barangay_settings):
├─ Barangay: "IBA O' ESTE"
├─ Municipality: "CALUMPIT"
└─ Province: "PROVINCE OF BULACAN"

DATABASE TRIGGER AUTO-GENERATES:
└─ full_address_computed: "HOUSE NO. 2706, PUROK MAHARLIKA, IBA O' ESTE, CALUMPIT, PROVINCE OF BULACAN"
```

## Settings Source (barangay_settings table)

```json
{
  "certificate_settings": {
    "headerInfo": {
      "country": "Republic of the Philippines",
      "province": "Province of Bulacan",           ← Province comes from here
      "municipality": "Municipality of Calumpit",  ← Municipality comes from here
      "barangayName": "BARANGAY IBA O' ESTE"       ← Barangay comes from here
    }
  }
}
```

## Example Data in Database

```
┌──────────────┬──────────────┬──────────────┬──────────────┬─────────────────────┐
│ house_number │ purok        │ barangay     │ municipality │ province            │
├──────────────┼──────────────┼──────────────┼──────────────┼─────────────────────┤
│ 2706         │ Purok        │ IBA O' ESTE  │ CALUMPIT     │ PROVINCE OF BULACAN │
│              │ Maharlika    │              │              │                     │
├──────────────┼──────────────┼──────────────┼──────────────┼─────────────────────┤
│ 123-A        │ Purok 1      │ IBA O' ESTE  │ CALUMPIT     │ PROVINCE OF BULACAN │
├──────────────┼──────────────┼──────────────┼──────────────┼─────────────────────┤
│ Blk 5 Lot 10 │ NV9          │ IBA O' ESTE  │ CALUMPIT     │ PROVINCE OF BULACAN │
└──────────────┴──────────────┴──────────────┴──────────────┴─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ full_address_computed (AUTO-GENERATED)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ HOUSE NO. 2706, PUROK MAHARLIKA, IBA O' ESTE, CALUMPIT, PROVINCE OF BULACAN│
│ HOUSE NO. 123-A, PUROK 1, IBA O' ESTE, CALUMPIT, PROVINCE OF BULACAN       │
│ HOUSE NO. BLK 5 LOT 10, NV9, IBA O' ESTE, CALUMPIT, PROVINCE OF BULACAN    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Validation Rules

```javascript
// Required fields (user must fill)
✓ house_number - Required, min 1 character
✓ purok - Required, must select from dropdown

// Auto-populated fields (read-only)
✓ barangay - Auto from settings, cannot be empty
✓ municipality - Auto from settings, cannot be empty
✓ province - Auto from settings, defaults to "Province of Bulacan"

// Generated field
✓ full_address_computed - Auto-generated by database trigger
```

## Display in Resident Profile

```jsx
<div className="space-y-4">
  <div>
    <p className="text-xs font-bold text-gray-400 uppercase">House Number</p>
    <p className="text-sm font-bold text-gray-800">{resident.house_number}</p>
  </div>
  
  <div>
    <p className="text-xs font-bold text-gray-400 uppercase">Purok / Sitio</p>
    <p className="text-sm font-bold text-gray-800">{resident.purok}</p>
  </div>
  
  <div>
    <p className="text-xs font-bold text-gray-400 uppercase">Barangay</p>
    <p className="text-sm font-bold text-gray-800">{resident.barangay}</p>
  </div>
  
  <div>
    <p className="text-xs font-bold text-gray-400 uppercase">Municipality</p>
    <p className="text-sm font-bold text-gray-800">{resident.municipality}</p>
  </div>
  
  <div>
    <p className="text-xs font-bold text-gray-400 uppercase">Province</p>
    <p className="text-sm font-bold text-gray-800">{resident.province}</p>
  </div>
  
  <div className="pt-4 border-t">
    <p className="text-xs font-bold text-gray-400 uppercase">Complete Address</p>
    <p className="text-sm font-bold text-gray-800 leading-relaxed">
      {resident.full_address_computed || resident.residential_address}
    </p>
  </div>
</div>
```

## Summary

✅ **5 Address Fields Total:**
1. House Number (user input)
2. Purok (user dropdown)
3. Barangay (auto-populated)
4. Municipality (auto-populated)
5. Province (auto-populated)

✅ **Auto-Generation:**
- Full address automatically generated by database trigger
- Includes all 5 components in proper format

✅ **User Experience:**
- User only fills 2 fields (house number + purok)
- System auto-fills 3 fields (barangay + municipality + province)
- Real-time preview shows complete address

✅ **Data Quality:**
- Consistent formatting across all records
- Easy to filter/search by any component
- Structured data for reporting
