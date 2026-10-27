# Resident Database Upload Guide (Updated)

Follow these steps to upload your Excel resident database to the system. The database has been adjusted to match your Excel columns.

## 1. Prepare your Excel File
Ensure your Excel file has the following column headers (the names must match exactly):

| Excel Column | Database Column | Notes |
| :--- | :--- | :--- |
| **Last Name** | `last_name` | Required |
| **First Name** | `first_name` | Required |
| **Middle Name** | `middle_name` | Optional |
| **Suffix** | `suffix` | Optional (Sr., Jr., III, etc.) |
| **Age** | `age` | Numeric |
| **Gender** | `gender` | MALE or FEMALE |
| **Civil Status** | `civil_status` | SINGLE, MARRIED, etc. |
| **Date of Birth** | `date_of_birth` | YYYY-MM-DD (e.g., 1999-01-25) |
| **Place of Birth** | `place_of_birth` | |
| **Residential Address** | `residential_address` | Full address |

## 2. Export to CSV
1. In Excel, go to **File > Save As**.
2. Select **CSV (Comma Delimited) (*.csv)** as the file type.
3. Save the file (e.g., `residents.csv`).

## 3. Upload to Supabase
1. Log in to your **Supabase Dashboard**.
2. Go to the **Table Editor** (grid icon on the left).
3. Select the `residents` table.
4. Click the **Insert** button and choose **Import data from CSV**.
5. Drag and drop your `residents.csv` file.
6. **Important**: Supabase will ask you to map "Excel Columns" to "Table Columns". Match them as shown in the table above.
   - Example: Map `Last Name` (Excel) to `last_name` (Table).
7. Click **Import**.

## 4. SQL Table Creation (Reference)
If you haven't created the table yet, run the SQL in `CREATE_RESIDENTS_TABLE.sql` in the **SQL Editor** of your Supabase dashboard first.

---

### Need help?
If the import tool gives you errors, let me know the error message and I will help you fix it!
