# Address Field Split Implementation Guide

## Overview
This guide explains how to implement the split address fields (House No., Purok, Barangay, Municipality) with automatic population for Barangay and Municipality.

## Database Changes

### 1. Run the Migration
Execute `SPLIT_ADDRESS_COLUMNS.sql` in your Supabase SQL Editor:
```sql
-- This adds:
-- - house_number VARCHAR(50)
-- - purok VARCHAR(100)
-- - barangay VARCHAR(100) (auto-populated)
-- - municipality VARCHAR(100) (auto-populated)
-- - province VARCHAR(100) DEFAULT 'Bulacan'
-- - full_address_computed TEXT (auto-generated)
```

### 2. Backward Compatibility
- Keep `residential_address` column for existing data
- New records use structured fields
- Trigger auto-generates `full_address_computed`

## Frontend Implementation

### Step 1: Update Residents Form (residents.js)

Replace the single address input with structured fields:

```jsx
// Import the helper
import { 
  generateFullAddress, 
  getAutoAddressFields, 
  PUROK_OPTIONS 
} from '@/lib/addressHelper';

// In your component, fetch tenant settings
const [tenantSettings, setTenantSettings] = useState(null);
const [autoAddressFields, setAutoAddressFields] = useState({
  barangay: '',
  municipality: '',
  province: 'Province of Bulacan'
});

useEffect(() => {
  // Fetch barangay settings
  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        const autoFields = getAutoAddressFields(data.settings);
        setAutoAddressFields(autoFields);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };
  fetchSettings();
}, []);

// Update formData structure
const [formData, setFormData] = useState({
  // ... other fields
  house_number: '',
  purok: '',
  barangay: '', // Auto-populated
  municipality: '', // Auto-populated
  province: 'Province of Bulacan', // Auto-populated
});

// Auto-populate barangay and municipality when component loads
useEffect(() => {
  if (autoAddressFields.barangay) {
    setFormData(prev => ({
      ...prev,
      barangay: autoAddressFields.barangay,
      municipality: autoAddressFields.municipality,
      province: autoAddressFields.province,
    }));
  }
}, [autoAddressFields]);
```

### Step 2: Update Form UI

Replace the single address textarea with structured inputs:

```jsx
<div className="bg-purple-50/50 p-6 rounded-2xl border border-purple-100 space-y-4">
  <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">
    Residential Address
  </p>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* House Number */}
    <div>
      <label className="label">
        House Number <span className="text-red-500">*</span>
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

    {/* Purok Dropdown */}
    <div>
      <label className="label">
        Purok / Sitio <span className="text-red-500">*</span>
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

    {/* Barangay (Auto-populated, Read-only) */}
    <div>
      <label className="label">
        Barangay <span className="text-blue-500">(Automatic)</span>
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

    {/* Municipality (Auto-populated, Read-only) */}
    <div>
      <label className="label">
        Municipality <span className="text-blue-500">(Automatic)</span>
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

    {/* Province (Auto-populated, Read-only) */}
    <div className="md:col-span-2">
      <label className="label">
        Province <span className="text-blue-500">(Automatic)</span>
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

  {/* Full Address Preview */}
  <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
      Full Address Preview:
    </p>
    <p className="text-[13px] font-bold text-gray-800 uppercase">
      {generateFullAddress(formData) || 'Enter house number and purok to see preview'}
    </p>
  </div>
</div>
```

### Step 3: Update API Submission

When saving, send the structured fields:

```jsx
const handleSaveResident = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    const cleanedData = {
      ...formData,
      // Generate full_address_computed on backend via trigger
      // But also keep residential_address for backward compatibility
      residential_address: generateFullAddress(formData),
    };

    const method = selectedResident ? 'PUT' : 'POST';
    const url = selectedResident
      ? `${API_URL}/residents/${selectedResident.id}`
      : `${API_URL}/residents`;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(cleanedData),
    });

    const data = await response.json();
    if (data.success) {
      toast.success(selectedResident ? 'Resident updated!' : 'Resident added!');
      setIsFormModalOpen(false);
      fetchResidents();
    } else {
      toast.error(data.message || 'Something went wrong');
    }
  } catch (error) {
    toast.error('Connection error');
  } finally {
    setIsSubmitting(false);
  }
};
```

### Step 4: Update Display (Modal View)

Update the resident profile modal to show structured address:

```jsx
<div className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm h-full">
  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 border-b border-gray-50 pb-3">
    <MapPin className="w-3.5 h-3.5 text-purple-500" />
    Location Profile
  </p>
  <div className="space-y-4">
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
        House Number
      </p>
      <p className="text-[14px] font-black text-gray-800 uppercase tracking-tight">
        {selectedResident.house_number || 'NOT RECORDED'}
      </p>
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
        Purok / Sitio
      </p>
      <p className="text-[14px] font-black text-gray-800 uppercase tracking-tight">
        {selectedResident.purok || 'NOT RECORDED'}
      </p>
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
        Full Address
      </p>
      <p className="text-[13px] font-black text-gray-800 uppercase leading-relaxed font-medium">
        {selectedResident.full_address_computed || selectedResident.residential_address || 'NOT RECORDED'}
      </p>
    </div>
  </div>
</div>
```

## Backend API Updates

### Update Residents API (backend/routes/residents-supabase.js)

Ensure the API accepts and returns the new fields:

```javascript
// POST /api/residents - Create resident
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      house_number,
      purok,
      barangay,
      municipality,
      province,
      // ... other fields
    } = req.body;

    const tenantId = req.user.tenant_id;

    // Insert with structured address fields
    const { data, error } = await supabase
      .from('residents')
      .insert({
        tenant_id: tenantId,
        house_number,
        purok,
        barangay,
        municipality,
        province: province || 'Province of Bulacan',
        // ... other fields
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, resident: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/residents/:id - Update resident
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      house_number,
      purok,
      barangay,
      municipality,
      province,
      // ... other fields
    } = req.body;

    const tenantId = req.user.tenant_id;

    const { data, error } = await supabase
      .from('residents')
      .update({
        house_number,
        purok,
        barangay,
        municipality,
        province,
        updated_at: new Date().toISOString(),
        // ... other fields
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, resident: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

## Portal Submission Updates

### Update Portal Forms

For public portal certificate requests, also use structured address:

```jsx
// In BarangayClearanceModal, IndigencyCertificateModal, etc.
<div className="space-y-4">
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label>House Number *</label>
      <input
        type="text"
        required
        value={formData.houseNumber}
        onChange={(e) => setFormData({...formData, houseNumber: e.target.value})}
      />
    </div>
    <div>
      <label>Purok *</label>
      <select
        required
        value={formData.purok}
        onChange={(e) => setFormData({...formData, purok: e.target.value})}
      >
        <option value="">Select Purok</option>
        {PUROK_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  </div>
  
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label>Barangay (Auto)</label>
      <input type="text" readOnly value={tenantConfig.barangayName} className="bg-gray-100" />
    </div>
    <div>
      <label>Municipality (Auto)</label>
      <input type="text" readOnly value={tenantConfig.municipality} className="bg-gray-100" />
    </div>
  </div>
  
  <div>
    <label>Province (Auto)</label>
    <input type="text" readOnly value={tenantConfig.province} className="bg-gray-100" />
  </div>
</div>
```
```

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Verify trigger creates full_address_computed automatically
- [ ] Test creating new resident with structured address
- [ ] Test editing existing resident
- [ ] Verify barangay/municipality auto-populate from settings
- [ ] Test address preview updates in real-time
- [ ] Test portal submission with new address fields
- [ ] Verify backward compatibility with old residential_address
- [ ] Test address display in resident profile modal
- [ ] Test address search/filter functionality

## Benefits

1. **Data Quality**: Structured data is easier to validate and query
2. **User Experience**: Auto-population reduces data entry errors
3. **Reporting**: Can filter/group by purok, barangay, etc.
4. **Consistency**: All addresses follow same format
5. **Backward Compatible**: Old data still works via residential_address

## Migration Strategy

### For Existing Data:

1. **Keep old column**: Don't delete `residential_address`
2. **Gradual migration**: New entries use structured fields
3. **Optional bulk update**: Use the commented SQL in migration to parse existing addresses
4. **Manual review**: For critical records, manually verify parsed data

### Rollback Plan:

If issues arise, you can revert by:
1. Continue using `residential_address` column
2. Drop new columns if needed
3. No data loss since old column is preserved
