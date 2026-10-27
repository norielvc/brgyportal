# Officials Page Synchronization & Dynamic PDF

This update implements full synchronization between the frontend "Officials Page" configuration and the backend database, extending this dynamic data to the generated PDF certificates and the public webpage.

## 🚀 Key Features

1.  **Full Synchronization**: Changes made in the Admin Dashboard "Officials" page (names, settings, logos) are saved to the Supabase database.
2.  **Dynamic PDF Certificates**: The PDF generation service now fetches the latest officials, headers, and styling from the database. Text is no longer hardcoded.
3.  **Frontend Updates**: The public landing page (`index.js`) now displays officials with consistent naming conventions (e.g., "Brgy. Kagawad", "Brgy. Secretary").

## 🛠️ Components Updated

-   **Frontend**:
    -   `frontend/pages/officials.js`: Added API integration to fetch/save configuration.
    -   `frontend/pages/index.js`: Updated rendering logic to standardize official titles.
-   **Backend**:
    -   `backend/routes/officials-supabase.js`: Added `GET /config` and `PUT /config` endpoints.
    -   `backend/services/certificateGenerationService.js`: Refactored to use dynamic configuration from DB.

## ⚠️ Action Required: Database Setup

To enable the storage of configuration settings, you must create the `barangay_settings` table in your Supabase database. The usage of the dashboard's "Save" button will fail until this table exists.

### Run this SQL in Supabase SQL Editor:

You can find the SQL file at: `CREATE_SETTINGS_TABLE.sql`

```sql
-- Create Settings Table
CREATE TABLE IF NOT EXISTS barangay_settings (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- (Optional) Insert Default Settings if not using the Dashboard to initialize
-- Copy the content from CREATE_SETTINGS_TABLE.sql to insert defaults.
```

## How to Test

1.  **Verify Webpage**: Go to the homepage. Check the "Officials" section. Kagawads should be labeled "Brgy. Kagawad" and staff "Brgy. [Position]".
2.  **Edit Config**: Go to Admin Dashboard -> Officials. Change a name or color. Click "Save All". (Requires DB setup).
3.  **Generate Certificate**: Generate a Barangay Clearance. Use the "Preview" or "Download". Verify that the header, official names, and styles match your changes in the Dashboard.
