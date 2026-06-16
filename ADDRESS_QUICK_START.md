# Address Split - Quick Start Guide

## 🎯 What You're Implementing

Split the single address field into:
- **House Number** (user input)
- **Purok** (dropdown selection)
- **Barangay** (automatic from settings)
- **Municipality** (automatic from settings)
- **Province** (automatic, defaults to Bulacan)

## 🚀 Quick Implementation (5 Steps)

### Step 1: Run Database Migration (2 minutes)
```bash
# Open Supabase SQL Editor
# Copy and run: SPLIT_ADDRESS_COLUMNS.sql
```

This adds 6 new columns to `residents` table and creates an auto-trigger.

### Step 2: Add Helper File (1 minute)
```bash
# File already created: frontend/lib/addressHelper.js
# Just import it in your components
```

### Step 3: Update Residents Form (10 minutes)

In `frontend/pages/residents.js`, replace the address section:

**FIND THIS:**
```jsx
<div>
  <label className="label">Residential Address</label>
  <textarea
    className="input"
    value={formData.residential_address}
    onChange={(e) => setFormData({...formData, residential_address: e.target.value})}
  />
</div>
```

**REPLACE WITH:**
```jsx
import { generateFullAddress, getAutoAddressFields, PUROK_OPTIONS } from '@/lib/addressHelper';

// Add state for auto-fields
const [autoAddressFields, setAutoAddressFields] = useState({
  barangay: 'IBA O\' ESTE',
  municipality: 'CALUMPIT',
  province: 'PROVINCE OF BULACAN'
});

// In your form:
<div className="grid grid-cols-2 gap-4">
  {/* House Number */}
  <div>
    <label className="label">House Number *</label>
    <input
      type="text"
      required
      placeholder="e.g., 2706"
      className="input uppercase font-bold"
      value={formData.house_number || ''}
      onChange={(e) => setFormData({...formData, house_number: e.target.value})}
    />
  </div>

  {/* Purok Dropdown */}
  <div>
    <label className="label">Purok / Sitio *</label>
    <select
      required
      className="input uppercase font-bold"
      value={formData.purok || ''}
      onChange={(e) => setFormData({...formData, purok: e.target.value})}
    >
      <option value="">-- SELECT PUROK --</option>
      {PUROK_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>

  {/* Barangay (Auto) */}
  <div>
    <label className="label">Barangay (Automatic)</label>
    <input
      type="text"
      readOnly
      className="input uppercase font-bold bg-gray-100"
      value={autoAddressFields.barangay}
    />
  </div>

  {/* Municipality (Auto) */}
  <div>
    <label className="label">Municipality (Automatic)</label>
    <input
      type="text"
      readOnly
      className="input uppercase font-bold bg-gray-100"
      value={autoAddressFields.municipality}
    />
  </div>

  {/* Province (Auto) */}
  <div className="col-span-2">
    <label className="label">Province (Automatic)</label>
    <input
      type="text"
      readOnly
      className="input uppercase font-bold bg-gray-100"
      value={autoAddressFields.province}
    />
  </div>
</div>

{/* Preview */}
<div className="mt-4 p-4 bg-white rounded-xl border">
  <p className="text-xs font-bold text-gray-500 mb-2">Full Address Preview:</p>
  <p className="text-sm font-bold text-gray-800 uppercase">
    {generateFullAddress({
      house_number: formData.house_number,
      purok: formData.purok,
      barangay: autoAddressFields.barangay,
      municipality: autoAddressFields.municipality,
      province: autoAddressFields.province
    }) || 'Enter house number and purok to see preview'}
  </p>
</div>
```

### Step 4: Update formData Structure (2 minutes)

**FIND THIS:**
```jsx
const [formData, setFormData] = useState({
  // ... other fields
  residential_address: "",
});
```

**ADD THESE FIELDS:**
```jsx
const [formData, setFormData] = useState({
  // ... other fields
  house_number: "",
  purok: "",
  barangay: "IBA O' ESTE",
  municipality: "CALUMPIT",
  province: "PROVINCE OF BULACAN",
  residential_address: "", // Keep for backward compatibility
});
```

### Step 5: Update Save Handler (2 minutes)

**FIND THIS:**
```jsx
const handleSaveResident = async (e) => {
  e.preventDefault();
  // ... existing code
  const cleanedData = { ...formData };
```

**ADD THIS LINE:**
```jsx
const handleSaveResident = async (e) => {
  e.preventDefault();
  // ... existing code
  const cleanedData = { 
    ...formData,
    // Generate full address for backward compatibility
    residential_address: generateFullAddress(formData)
  };
```

## ✅ Testing Checklist

1. **Database**
   - [ ] Run migration SQL
   - [ ] Verify new columns exist: `SELECT * FROM residents LIMIT 1;`

2. **Create New Resident**
   - [ ] Form shows 4 address fields
   - [ ] House number accepts input
   - [ ] Purok dropdown works
   - [ ] Barangay/Municipality are read-only and populated
   - [ ] Preview updates as you type
   - [ ] Save works without errors

3. **Edit Existing Resident**
   - [ ] Can edit house number and purok
   - [ ] Barangay/Municipality remain auto-filled
   - [ ] Update saves successfully

4. **Display**
   - [ ] Resident profile shows structured address
   - [ ] Full address displays correctly

## 🔧 Troubleshooting

### Issue: "Column does not exist"
**Solution:** Run the SQL migration in Supabase SQL Editor

### Issue: Barangay/Municipality are empty
**Solution:** Check `barangay_settings` table has data:
```sql
SELECT * FROM barangay_settings WHERE key = 'certificate_settings';
```

### Issue: Full address not generating
**Solution:** Verify the trigger was created:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trg_update_full_address';
```

### Issue: Old residents show blank address
**Solution:** They still have `residential_address` - that's fine! New entries use structured fields.

## 📊 Expected Results

### Before
```
Residential Address: HOUSE NO. 2706, PUROK MAHARLIKA, IBAO, IBA O' ESTE, CALUMPIT, BULACAN
```

### After
```
House Number:    2706
Purok:           Purok Maharlika
Barangay:        IBA O' ESTE (auto)
Municipality:    CALUMPIT (auto)
Province:        PROVINCE OF BULACAN (auto)

Full Address:    HOUSE NO. 2706, PUROK MAHARLIKA, IBA O' ESTE, 
                 CALUMPIT, PROVINCE OF BULACAN
```

## 🎨 Customization

### Add More Purok Options
Edit `frontend/lib/addressHelper.js`:
```javascript
export const PUROK_OPTIONS = [
  { value: 'Purok 1', label: 'Purok 1' },
  { value: 'Purok 2', label: 'Purok 2' },
  // Add your custom puroks here
  { value: 'Purok Bagong Silang', label: 'Purok Bagong Silang' },
];
```

### Change Default Province
In the migration SQL or form:
```javascript
province: 'YOUR PROVINCE NAME'
```

### Customize Address Format
Edit `generateFullAddress()` in `addressHelper.js`

## 📚 Files Created

1. `SPLIT_ADDRESS_COLUMNS.sql` - Database migration
2. `frontend/lib/addressHelper.js` - Helper functions
3. `ADDRESS_IMPLEMENTATION_GUIDE.md` - Detailed guide
4. `ADDRESS_STRUCTURE_DIAGRAM.md` - Visual diagrams
5. `ADDRESS_QUICK_START.md` - This file

## 🆘 Need Help?

Check the detailed guides:
- **Implementation Guide**: `ADDRESS_IMPLEMENTATION_GUIDE.md`
- **Visual Diagrams**: `ADDRESS_STRUCTURE_DIAGRAM.md`

## 🎉 Benefits You'll Get

✅ Structured, validated data
✅ Consistent address format
✅ Auto-population reduces errors
✅ Easy filtering by purok
✅ Better reporting capabilities
✅ Backward compatible with old data
