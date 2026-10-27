# Supabase Tables Setup Guide

## Required Tables for Iba O' Este Portal

The portal requires two additional tables in Supabase for full functionality:

### 1. Events Table (for Homepage Carousel)
### 2. Facilities Table (for Facilities Section)

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `ibaoesteportal`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Create Events Table**
   ```sql
   -- Create events table for homepage carousel
   CREATE TABLE IF NOT EXISTS events (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     title VARCHAR(255) NOT NULL,
     description TEXT,
     date VARCHAR(100),
     image TEXT DEFAULT '/background.jpg',
     order_index INTEGER DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Insert default events
   INSERT INTO events (title, description, date, image, order_index) VALUES
   ('Barangay Clean-Up Drive 2026', 'Join us this Saturday for our monthly community clean-up initiative. Together, we can keep Iba O'' Este beautiful!', 'January 5, 2026', '/background.jpg', 0),
   ('Free Medical Mission', 'Free check-ups, medicines, and health consultations for all residents. Bring your Barangay ID.', 'January 10, 2026', '/background.jpg', 1),
   ('Livelihood Training Program', 'Register now for free skills training in food processing, handicrafts, and more!', 'January 15, 2026', '/background.jpg', 2);

   -- Enable Row Level Security
   ALTER TABLE events ENABLE ROW LEVEL SECURITY;

   -- Create policies for public read access
   CREATE POLICY "Allow public read access to events" ON events
     FOR SELECT USING (true);

   -- Create policies for authenticated users to manage events
   CREATE POLICY "Allow authenticated users to insert events" ON events
     FOR INSERT WITH CHECK (auth.role() = 'authenticated');

   CREATE POLICY "Allow authenticated users to update events" ON events
     FOR UPDATE USING (auth.role() = 'authenticated');

   CREATE POLICY "Allow authenticated users to delete events" ON events
     FOR DELETE USING (auth.role() = 'authenticated');
   ```

4. **Create Facilities Table**
   ```sql
   -- Create facilities table for facilities section
   CREATE TABLE IF NOT EXISTS facilities (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name VARCHAR(255) NOT NULL,
     description TEXT,
     icon VARCHAR(50) DEFAULT 'Building2',
     color VARCHAR(50) DEFAULT 'bg-blue-500',
     images TEXT[] DEFAULT ARRAY['/background.jpg'],
     features TEXT[] DEFAULT ARRAY[]::TEXT[],
     order_index INTEGER DEFAULT 0,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Insert default facilities
   INSERT INTO facilities (name, description, icon, color, images, features, order_index) VALUES
   ('Health Center', 'Primary healthcare services for residents', 'Heart', 'bg-red-500', ARRAY['/background.jpg', '/background.jpg', '/background.jpg'], ARRAY['Free Checkups', 'Vaccination', 'First Aid'], 0),
   ('Multi-purpose Hall', 'Events, meetings, and community gatherings', 'Building2', 'bg-blue-500', ARRAY['/background.jpg', '/background.jpg', '/background.jpg'], ARRAY['500 Capacity', 'AC Equipped', 'Stage'], 1),
   ('Daycare Center', 'Early childhood education and care', 'Baby', 'bg-pink-500', ARRAY['/background.jpg', '/background.jpg', '/background.jpg'], ARRAY['Ages 3-5', 'Free Education', 'Meals'], 2),
   ('Barangay Hall', 'Administrative services and assistance', 'Home', 'bg-green-500', ARRAY['/background.jpg', '/background.jpg', '/background.jpg'], ARRAY['Documents', 'Assistance', 'Info Desk'], 3),
   ('Sports Complex', 'Basketball court and fitness area', 'Award', 'bg-orange-500', ARRAY['/background.jpg', '/background.jpg', '/background.jpg'], ARRAY['Basketball', 'Volleyball', 'Gym'], 4);

   -- Enable Row Level Security
   ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

   -- Create policies for public read access
   CREATE POLICY "Allow public read access to facilities" ON facilities
     FOR SELECT USING (true);

   -- Create policies for authenticated users to manage facilities
   CREATE POLICY "Allow authenticated users to insert facilities" ON facilities
     FOR INSERT WITH CHECK (auth.role() = 'authenticated');

   CREATE POLICY "Allow authenticated users to update facilities" ON facilities
     FOR UPDATE USING (auth.role() = 'authenticated');

   CREATE POLICY "Allow authenticated users to delete facilities" ON facilities
     FOR DELETE USING (auth.role() = 'authenticated');
   ```

5. **Run the Queries**
   - Copy and paste each SQL block into the SQL Editor
   - Click "Run" to execute each query
   - Verify tables are created in the "Table Editor"

### Option 2: Using SQL Files (Alternative)

The SQL files are available in `backend/scripts/`:
- `create-events-table.sql`
- `create-facilities-table.sql`

Copy the content of these files and run them in the Supabase SQL Editor.

## Verification

After creating the tables, verify they work by:

1. **Test Events API**
   ```bash
   curl https://ibaoesteportal-production.up.railway.app/api/events
   ```

2. **Test Facilities API**
   ```bash
   curl https://ibaoesteportal-production.up.railway.app/api/facilities
   ```

3. **Check Homepage**
   - Visit https://ibaoesteportal.vercel.app
   - Verify carousel shows events from database
   - Verify facilities section shows facilities from database

## Admin Management

Once tables are created, admins can manage content through:

1. **Events Management**: `/events` page (admin login required)
2. **Facilities Management**: `/facilities` page (admin login required)

Changes made by admins will immediately appear on the homepage for all visitors.

## Troubleshooting

If you encounter issues:

1. **Check Supabase Connection**
   - Verify environment variables in Railway
   - Check Supabase project status

2. **Check API Endpoints**
   - Test API endpoints directly
   - Check browser console for errors

3. **Check Table Permissions**
   - Ensure RLS policies are correctly set
   - Verify public read access is enabled

## Current Status

- ✅ Backend API routes created
- ✅ Frontend integration completed
- ✅ SQL scripts prepared
- ⏳ **NEXT STEP: Create tables in Supabase dashboard**

Once the tables are created, the facilities customization feature will be fully functional!