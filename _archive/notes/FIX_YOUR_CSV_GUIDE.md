# How to Fix Your CSV File for Upload

## Step-by-Step Instructions

### Step 1: Open Your Excel File
Open your original Excel file with the resident data

### Step 2: Fix Column Headers (Row 1)
Replace the first row with these exact headers (copy-paste):
```
last_name,first_name,middle_name,suffix,date_of_birth,age,gender,civil_status,place_of_birth,house_number,purok,barangay,municipality,province,contact_number
```

Important:
- All lowercase
- Use underscores `_` not spaces
- No extra spaces before or after

### Step 3: Fix Date Format
1. Select the entire `date_of_birth` column (column E)
2. Right-click → Format Cells
3. Choose "Custom"
4. In the Type field, enter: `yyyy-mm-dd`
5. Click OK

Your dates should now show as: 1990-01-15 (not 1/15/1990)

### Step 4: Clear Age Column
1. Select the entire `age` column (column F)
2. Delete all values (leave it empty)
3. The system will auto-calculate ages from birth dates

### Step 5: Fix Text Values
Check these columns for proper values:

**Gender** (column G):
- Must be: MALE or FEMALE (all caps)
- Not: M, F, Male, Female

**Civil Status** (column H):
- Must be: SINGLE, MARRIED, WIDOWED, or SEPARATED (all caps)
- Not: Single, Married, etc.

**Barangay** (column L):
- Should be: IBA O' ESTE
- Check the apostrophe is straight `'` not curly `'`

**Municipality** (column M):
- Should be: CALUMPIT

**Province** (column N):
- Should be: BULACAN or PROVINCE OF BULACAN

### Step 6: Remove Empty Rows
1. Scroll through your data
2. Delete any completely empty rows
3. Make sure data starts at row 2 (row 1 is headers)

### Step 7: Remove Extra Columns
1. If you have columns after `contact_number`, delete them
2. Only keep the 15 columns listed in the header

### Step 8: Save as CSV UTF-8
1. File → Save As
2. Choose location
3. In "Save as type" dropdown, select: **CSV UTF-8 (Comma delimited) (*.csv)**
4. NOT "CSV (Comma delimited)" - must be UTF-8!
5. Click Save
6. If Excel asks "Do you want to keep that format?", click YES

### Step 9: Verify Your CSV
1. Close Excel
2. Open the CSV file in Notepad (Windows) or TextEdit (Mac)
3. Check:
   - First line is the headers (lowercase with underscores)
   - Dates are YYYY-MM-DD format
   - No weird characters
   - Each row has 15 values separated by commas

### Step 10: Upload
1. Go to Settings → Import & Export
2. Upload your fixed CSV file
3. Review the preview
4. Click "FINALIZE & COMMENCE IMPORT"

## Common Mistakes to Avoid

❌ **Don't use regular CSV** - Must be CSV UTF-8
❌ **Don't have spaces in headers** - Use underscores
❌ **Don't use Excel date format** - Must be YYYY-MM-DD
❌ **Don't fill in age column** - Leave empty for auto-calculation
❌ **Don't use lowercase for gender/civil_status** - Must be UPPERCASE
❌ **Don't have empty rows** - Delete them
❌ **Don't have extra columns** - Only 15 columns

## Example of Correct Row

```
DELA CRUZ,JUAN,SANTOS,JR,1990-01-15,,MALE,MARRIED,MANILA,123,Purok 1,IBA O' ESTE,CALUMPIT,BULACAN,09171234567
```

Notice:
- Date: 1990-01-15 (YYYY-MM-DD)
- Age: empty (two commas ,,)
- Gender: MALE (uppercase)
- Civil Status: MARRIED (uppercase)
- All fields separated by single comma

## Still Having Issues?

If your CSV still doesn't work:
1. Copy 5-10 rows from your Excel
2. Paste into the working BULK_TEST_500_RESIDENTS.csv
3. Replace the sample data with your real data
4. Keep the same format
5. Upload that file

This way you know the format is correct!

## Need Help?

Compare your CSV file with BULK_TEST_500_RESIDENTS.csv:
- Open both in Notepad
- Check if the format matches
- Pay attention to commas, quotes, and line endings

