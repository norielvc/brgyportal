-- Add household_head_id to link family members to their household leader
ALTER TABLE residents 
ADD COLUMN IF NOT EXISTS household_head_id UUID REFERENCES residents(id) ON DELETE SET NULL;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_residents_household_head ON residents(household_head_id);
