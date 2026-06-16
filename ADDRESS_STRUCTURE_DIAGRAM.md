# Address Structure - Visual Guide

## Current vs New Structure

### BEFORE (Single Field)
```
┌─────────────────────────────────────────────────────────────┐
│ Residential Address (TEXT)                                  │
├─────────────────────────────────────────────────────────────┤
│ HOUSE NO. 2706, PUROK MAHARLIKA, IBAO,                     │
│ IBA O' ESTE, CALUMPIT, BULACAN                             │
└─────────────────────────────────────────────────────────────┘

Problems:
❌ Hard to validate
❌ Inconsistent formatting
❌ Can't filter by purok
❌ Manual data entry errors
❌ Can't auto-populate barangay/municipality
```

### AFTER (Structured Fields)
```
┌──────────────────────────┬──────────────────────────┐
│ House Number (INPUT)     │ Purok (DROPDOWN)         │
├──────────────────────────┼──────────────────────────┤
│ 2706                     │ Purok Maharlika          │
└──────────────────────────┴──────────────────────────┘

┌──────────────────────────┬──────────────────────────┐
│ Barangay (AUTO) 🔒       │ Municipality (AUTO) 🔒   │
├──────────────────────────┼──────────────────────────┤
│ IBA O' ESTE              │ CALUMPIT                 │
└──────────────────────────┴──────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Province (AUTO) 🔒                                          │
├─────────────────────────────────────────────────────────────┤
│ PROVINCE OF BULACAN                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Full Address Preview (AUTO-GENERATED)                       │
├─────────────────────────────────────────────────────────────┤
│ HOUSE NO. 2706, PUROK MAHARLIKA, IBA O' ESTE,              │
│ CALUMPIT, PROVINCE OF BULACAN                               │
└─────────────────────────────────────────────────────────────┘

Benefits:
✅ Structured data
✅ Auto-validation
✅ Consistent format
✅ Filter by purok
✅ Auto-populate from settings
✅ Reduced errors
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INPUT FORM                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │  User enters:                         │
        │  • House Number: "2706"               │
        │  • Purok: "Purok Maharlika" (dropdown)│
        └───────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              SYSTEM AUTO-POPULATES                          │
├─────────────────────────────────────────────────────────────┤
│  Fetch from barangay_settings table:                        │
│  • Barangay: "IBA O' ESTE"                                  │
│  • Municipality: "CALUMPIT"                                 │
│  • Province: "PROVINCE OF BULACAN"                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE TRIGGER                               │
├─────────────────────────────────────────────────────────────┤
│  Auto-generates full_address_computed:                      │
│  "HOUSE NO. 2706, PUROK MAHARLIKA, IBA O' ESTE,            │
│   CALUMPIT, PROVINCE OF BULACAN"                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              STORED IN DATABASE                             │
├─────────────────────────────────────────────────────────────┤
│  residents table:                                           │
│  • house_number: "2706"                                     │
│  • purok: "Purok Maharlika"                                 │
│  • barangay: "IBA O' ESTE"                                  │
│  • municipality: "CALUMPIT"                                 │
│  • province: "PROVINCE OF BULACAN"                          │
│  • full_address_computed: "HOUSE NO. 2706, ..."            │
│  • residential_address: (kept for backward compatibility)   │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

```sql
┌─────────────────────────────────────────────────────────────┐
│                    residents TABLE                          │
├──────────────────────────┬──────────────────────────────────┤
│ Column Name              │ Type & Description               │
├──────────────────────────┼──────────────────────────────────┤
│ id                       │ UUID (Primary Key)               │
│ first_name               │ TEXT                             │
│ last_name                │ TEXT                             │
│ ...                      │ ...                              │
├──────────────────────────┼──────────────────────────────────┤
│ 🆕 house_number          │ VARCHAR(50)                      │
│                          │ User input: "2706", "123-A"      │
├──────────────────────────┼──────────────────────────────────┤
│ 🆕 purok                 │ VARCHAR(100)                     │
│                          │ Dropdown: "Purok 1", "NV9"       │
├──────────────────────────┼──────────────────────────────────┤
│ 🆕 barangay              │ VARCHAR(100)                     │
│                          │ Auto: from barangay_settings     │
├──────────────────────────┼──────────────────────────────────┤
│ 🆕 municipality          │ VARCHAR(100)                     │
│                          │ Auto: from barangay_settings     │
├──────────────────────────┼──────────────────────────────────┤
│ 🆕 province              │ VARCHAR(100)                     │
│                          │ Default: "Province of Bulacan"   │
├──────────────────────────┼──────────────────────────────────┤
│ 🆕 full_address_computed │ TEXT                             │
│                          │ Auto-generated by trigger        │
├──────────────────────────┼──────────────────────────────────┤
│ residential_address      │ TEXT (kept for compatibility)    │
└──────────────────────────┴──────────────────────────────────┘
```

## Form UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│                  RESIDENTIAL ADDRESS                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────────────┐
│ House Number *           │ Purok / Sitio *                  │
│ ┌──────────────────────┐ │ ┌──────────────────────────────┐ │
│ │ 2706                 │ │ │ ▼ Purok Maharlika            │ │
│ └──────────────────────┘ │ └──────────────────────────────┘ │
│ Enter house/building no. │ Select your purok or sitio       │
└──────────────────────────┴──────────────────────────────────┘

┌──────────────────────────┬──────────────────────────────────┐
│ Barangay (Automatic) 🔒  │ Municipality (Automatic) 🔒      │
│ ┌──────────────────────┐ │ ┌──────────────────────────────┐ │
│ │ IBA O' ESTE          │ │ │ CALUMPIT                     │ │
│ └──────────────────────┘ │ └──────────────────────────────┘ │
│ ✓ Auto-filled from       │ ✓ Auto-filled from               │
│   system settings        │   system settings                │
└──────────────────────────┴──────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Province (Automatic) 🔒                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PROVINCE OF BULACAN                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ✓ Auto-filled from system settings                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Full Address Preview:                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ HOUSE NO. 2706, PUROK MAHARLIKA, IBA O' ESTE,          │ │
│ │ CALUMPIT, PROVINCE OF BULACAN                           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Purok Options (Dropdown)

```
┌─────────────────────────────────────┐
│ Select Purok / Sitio                │
├─────────────────────────────────────┤
│ ▼ -- SELECT PUROK --                │
│   Purok 1                           │
│   Purok 2                           │
│   Purok 3                           │
│   Purok 4                           │
│   Purok 5                           │
│   Purok 6                           │
│   NV9 (New Village 9)               │
│   Purok Maharlika                   │
│   Sitio Banawe                      │
│   Other (Specify)                   │
└─────────────────────────────────────┘
```

## Settings Source (barangay_settings)

```sql
┌─────────────────────────────────────────────────────────────┐
│              barangay_settings TABLE                        │
├─────────────────────────────────────────────────────────────┤
│ key: 'certificate_settings'                                 │
│ value: {                                                    │
│   "headerInfo": {                                           │
│     "country": "Republic of the Philippines",               │
│     "province": "Province of Bulacan",                      │
│     "municipality": "Municipality of Calumpit",             │
│     "barangayName": "BARANGAY IBA O' ESTE"                  │
│   }                                                         │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Frontend reads this    │
              │  and auto-populates:    │
              │  • Barangay field       │
              │  • Municipality field   │
              └─────────────────────────┘
```

## Implementation Steps

```
Step 1: Database Migration
├─ Run SPLIT_ADDRESS_COLUMNS.sql
├─ Adds new columns
├─ Creates trigger for auto-generation
└─ Adds indexes

Step 2: Frontend Helper
├─ Create addressHelper.js
├─ Functions for address generation
├─ Purok options array
└─ Validation functions

Step 3: Update Residents Form
├─ Replace single address input
├─ Add house_number input
├─ Add purok dropdown
├─ Add read-only barangay/municipality
└─ Add address preview

Step 4: Update API
├─ Accept new address fields
├─ Return structured data
└─ Maintain backward compatibility

Step 5: Update Portal Forms
├─ Apply same structure to certificate requests
├─ Auto-populate from tenant config
└─ Generate full address on submit

Step 6: Testing
├─ Test create/edit resident
├─ Verify auto-population
├─ Test address preview
└─ Verify database trigger
```

## Query Examples

### Filter by Purok
```sql
SELECT * FROM residents 
WHERE purok = 'Purok 1' 
AND tenant_id = 'your-tenant-id';
```

### Count residents per Purok
```sql
SELECT purok, COUNT(*) as resident_count
FROM residents
WHERE tenant_id = 'your-tenant-id'
GROUP BY purok
ORDER BY resident_count DESC;
```

### Search by house number
```sql
SELECT * FROM residents
WHERE house_number ILIKE '%2706%'
AND tenant_id = 'your-tenant-id';
```

### Get full address
```sql
SELECT 
  first_name,
  last_name,
  full_address_computed,
  house_number,
  purok,
  barangay,
  municipality
FROM residents
WHERE tenant_id = 'your-tenant-id';
```
