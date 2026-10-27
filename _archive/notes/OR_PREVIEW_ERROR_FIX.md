# OR Preview Error Fix

## Problem
The OR preview section was showing "OR file not found" error because:
1. The backend generates OR files with timestamps in the filename (e.g., `OR_12345_2026-03-07T...html`)
2. The frontend was trying to fetch using just the OR number (e.g., `OR_12345.html`)
3. The filename mismatch caused 404 errors

## Solution

### 1. Database Schema Update
Added `file_path` column to `official_receipts` table to store the actual filename:
- File: `backend/ADD_FILE_PATH_TO_OR.sql`
- Stores the complete filename with timestamp for accurate file retrieval

### 2. Backend Changes
Updated OR generation API to save the file_path:
- File: `backend/routes/official-receipts-supabase.js`
- Now stores `orResult.filePath` in the database when creating OR record
- This ensures we always have the correct filename for retrieval

### 3. Frontend Changes
Updated ORPreviewSection component to:
- First try to fetch using `file_path` from the OR record (most reliable)
- Fallback to simple filename if `file_path` is not available
- Gracefully handle missing files by showing OR summary without full preview
- Disable print/download buttons if file content is not available
- Show helpful tooltips when buttons are disabled

### 4. User Experience Improvements
- OR summary card always displays (shows payment details)
- Print/Download buttons are disabled if file not available (with tooltip)
- "View Full OR" button is disabled if file not available
- No error messages - graceful degradation
- Users can still see OR details even if file is temporarily unavailable

## Files Modified
1. `backend/ADD_FILE_PATH_TO_OR.sql` - Migration to add file_path column
2. `backend/routes/official-receipts-supabase.js` - Store file_path in database
3. `frontend/pages/requests.js` - Updated ORPreviewSection to use file_path

## Migration Steps
1. Run the SQL migration to add `file_path` column to `official_receipts` table
2. Restart the backend server
3. Generate new ORs - they will now have file_path stored
4. Existing ORs without file_path will still work (fallback to simple filename)

## Testing
- Open a business permit request in oic_review status
- OR preview section should load without errors
- If OR file exists, all buttons should be enabled
- If OR file is missing, buttons should be disabled with helpful tooltips
- OR summary card should always display payment details