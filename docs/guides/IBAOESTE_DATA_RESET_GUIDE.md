# Ibaoeste Data Reset & Bulk Upload Guide

## Current Status
✅ Database migration completed - all address columns created
✅ Frontend form updated - structured address fields working
✅ CSV template updated - tenant-aware address values
✅ Bulk insert endpoint ready - handles new address structure automatically

## Step 1: Delete All Ibaoeste Test Data

### Option A: Run the Complete Deletion Script (Recommended)

1. Open Supabase SQL Editor
2. Copy and paste the entire content from `DELETE_IBAOESTE_ALL_DATA.sql`
3. Click "Run" to execute all steps

The script will:
- Show you what will be deleted (counts)
- Delete in correct order to avoid FK errors:
  1. workflow_history
  2. workflow_assignments
  3. certificate_requests
  4. residents
- Verify deletion (all counts should be 0)
- Show remaining residents in other tenants (demo should be unaffected)

### Option B: Quick Delete (If you're confident)

Just run this single query:
```sql
-- Delete workflow history
DELETE FROM workflow_history WHERE tenant_id = 'ibaoeste';

-- Delete workflow assignments
DELETE FROM workflow_assignments WHERE tenant_id = 'ibaoeste';

-- Delete certificate requests
DELETE FROM certificate_requests WHERE tenant_id = 'ibaoeste';

-- Delete residents
DELETE FROM residents WHERE tenant_id = 'ibaoeste';
```

## Step 2: Prepare Your CSV File

### CSV Format (with new address structure)

Your CSV must have these columns in this order:
```
last_name,first_name,middle_name,suffix,date_of_birth,age,gender,civil_status,place_of_birth,house_number,purok,barangay,municipality,province,contact_number
```

### Example Row for Ibaoeste:
```
DELA CRUZ,JUAN,SANTOS,JR,1990-05-15,35,MALE,MARRIED,MANILA,123,Purok 1,IBA O' ESTE,CALUMPIT,PROVINCE OF BULACAN,09171234567
```

### Important Notes:
- **house_number**: User's house number (e.g., "123", "810C")
- **purok**: Must be one of: Purok 1, Purok 2, Purok 3, Purok 4, Purok 5, Purok 6, NV9, Purok Maharlika, Sitio Banawe, Other
- **barangay**: Should be "IBA O' ESTE" for ibaoeste tenant
- **municipality**: Should be "CALUMPIT" for ibaoeste tenant
- **province**: Should be "PROVINCE OF BULACAN" for ibaoeste tenant
- **date_of_birth**: Format YYYY-MM-DD
- **age**: Will be auto-calculated in the form, but include it in CSV
- **gender**: MALE or FEMALE
- **civil_status**: SINGLE, MARRIED, WIDOWED, SEPARATED, DIVORCED

### Download Template from System:
1. Login to ibaoeste tenant
2. Go to Settings → Import & Export tab
3. Click "Sample Template" button
4. The downloaded CSV will have ibaoeste-specific values pre-filled

## Step 3: Bulk Upload

1. Login to your system as ibaoeste admin
2. Go to Settings page
3. Click on "Import & Export" tab
4. Click "Choose File" and select your prepared CSV
5. Review the preview (first 5 rows will be shown)
6. Click "Import Residents" button
7. Wait for success message

## Step 4: Verify Upload

### Check in UI:
1. Go to Residents page
2. Verify residents are showing with structured addresses
3. Click "View Details" on a resident
4. Confirm all address fields are populated correctly

### Check in Database:
```sql
-- Count imported residents
SELECT COUNT(*) as total_residents
FROM residents
WHERE tenant_id = 'ibaoeste';

-- Sample 5 residents with address breakdown
SELECT 
    first_name,
    last_name,
    house_number,
    purok,
    barangay,
    municipality,
    province,
    full_address_computed
FROM residents
WHERE tenant_id = 'ibaoeste'
LIMIT 5;

-- Verify full_address_computed is auto-generated
SELECT 
    COUNT(*) as residents_with_computed_address
FROM residents
WHERE tenant_id = 'ibaoeste'
AND full_address_computed IS NOT NULL
AND full_address_computed != '';
```

## Troubleshooting

### Issue: CSV Upload Fails
- Check CSV format matches exactly (15 columns)
- Ensure no extra commas or line breaks in data
- Verify date format is YYYY-MM-DD
- Check purok values match the allowed list

### Issue: Addresses Not Showing Correctly
- Verify database trigger is active:
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'update_full_address_trigger';
```
- If trigger is disabled, enable it:
```sql
ALTER TABLE residents ENABLE TRIGGER update_full_address_trigger;
```

### Issue: Some Residents Missing full_address_computed
- Run manual update:
```sql
UPDATE residents
SET full_address_computed = 
    CONCAT_WS(', ',
        NULLIF(CONCAT('HOUSE NO. ', house_number), 'HOUSE NO. '),
        NULLIF(purok, ''),
        NULLIF(barangay, ''),
        NULLIF(municipality, ''),
        NULLIF(province, '')
    )
WHERE tenant_id = 'ibaoeste'
AND (full_address_computed IS NULL OR full_address_computed = '');
```

## Expected Results

After successful completion:
- All old ibaoeste test data deleted
- New residents imported with structured addresses
- Each resident has:
  - Individual fields: house_number, purok, barangay, municipality, province
  - Auto-generated full_address_computed field
- Residents page shows structured address in details modal
- Certificate requests can reference residents properly

## Next Steps After Upload

1. Test resident registration form (add a new resident manually)
2. Test certificate request creation with imported residents
3. Verify address appears correctly on generated certificates
4. Check that workflow assignments work properly with new residents

## Safety Notes

✅ Only ibaoeste data will be deleted
✅ Demo tenant and other tenants are unaffected
✅ All deletions are scoped by tenant_id
✅ Foreign key constraints are handled in correct order
✅ You can re-run the deletion script if needed (it's idempotent)

---

**Ready to proceed?** Start with Step 1 (deletion) in Supabase SQL Editor.
