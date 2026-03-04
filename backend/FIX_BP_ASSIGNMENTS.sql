-- ============================================================
-- DIRECT FIX: Assign Brook dono to all pending Business Permit requests
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Check what Business Permit requests exist and their current assignments
SELECT 
  cr.id as request_id,
  cr.reference_number,
  cr.full_name,
  cr.status,
  wa.id as assignment_id,
  wa.assigned_user_id,
  wa.step_id,
  wa.step_name,
  wa.status as assignment_status,
  u.first_name || ' ' || u.last_name as assigned_to
FROM certificate_requests cr
LEFT JOIN workflow_assignments wa ON wa.request_id = cr.id AND wa.status = 'pending'
LEFT JOIN users u ON u.id = wa.assigned_user_id
WHERE cr.certificate_type = 'business_permit'
ORDER BY cr.created_at DESC;

-- ============================================================
-- Step 2: Find Brook dono's user ID
-- ============================================================
SELECT id, first_name, last_name, email, role
FROM users
WHERE LOWER(first_name) LIKE '%brook%'
ORDER BY first_name;

-- ============================================================
-- Step 3: THE FULL FIX
-- This will:
-- a) Delete ALL existing pending workflow_assignments for business_permit
-- b) Re-insert them with Brook dono's user ID
-- 
-- IMPORTANT: Replace the UUID below with Brook dono's actual ID from Step 2
-- ============================================================

DO $$
DECLARE
  brook_dono_id UUID;
  req RECORD;
  first_approval_step_id TEXT;
  first_approval_step_name TEXT;
BEGIN
  -- Get Brook dono's user ID (first match)
  SELECT id INTO brook_dono_id
  FROM users
  WHERE LOWER(first_name) LIKE '%brook%'
  LIMIT 1;

  IF brook_dono_id IS NULL THEN
    RAISE EXCEPTION 'Brook dono user not found! Check the users table.';
  END IF;

  RAISE NOTICE 'Found Brook dono with ID: %', brook_dono_id;

  -- Get the first approval step from business_permit workflow config
  SELECT 
    (step->>'id') AS step_id,
    (step->>'name') AS step_name
  INTO first_approval_step_id, first_approval_step_name
  FROM workflow_configurations,
       json_array_elements(workflow_config->'steps') AS step
  WHERE certificate_type = 'business_permit'
    AND (step->>'requiresApproval')::boolean = true
  ORDER BY (step->>'id')::int
  LIMIT 1;

  -- Fallback if no config found
  IF first_approval_step_id IS NULL THEN
    first_approval_step_id := '111';
    first_approval_step_name := 'Review Request Team';
    RAISE NOTICE 'No workflow config found for business_permit, using default step 111';
  ELSE
    RAISE NOTICE 'Found first approval step: % - %', first_approval_step_id, first_approval_step_name;
  END IF;

  -- Loop through all active (staff_review) business permit requests
  FOR req IN
    SELECT id, reference_number
    FROM certificate_requests
    WHERE certificate_type = 'business_permit'
      AND status IN ('pending', 'submitted', 'staff_review', 'returned')
  LOOP
    RAISE NOTICE 'Processing request: % (%)', req.reference_number, req.id;

    -- Delete ALL existing pending assignments for this request
    DELETE FROM workflow_assignments
    WHERE request_id = req.id AND status = 'pending';

    -- Create fresh assignment for Brook dono
    INSERT INTO workflow_assignments (
      request_id, request_type, step_id, step_name,
      assigned_user_id, status
    ) VALUES (
      req.id, 'business_permit', first_approval_step_id, first_approval_step_name,
      brook_dono_id, 'pending'
    );

    RAISE NOTICE 'Assigned % to request %', 'Brook dono', req.reference_number;
  END LOOP;

  RAISE NOTICE 'Done! All business_permit requests assigned to Brook dono.';
END $$;

-- ============================================================
-- Step 4: VERIFY - Check the assignments are now correct
-- ============================================================
SELECT 
  cr.reference_number,
  cr.full_name,
  cr.status as request_status,
  wa.step_name,
  wa.status as assignment_status,
  u.first_name || ' ' || u.last_name as assigned_to
FROM certificate_requests cr
JOIN workflow_assignments wa ON wa.request_id = cr.id AND wa.status = 'pending'
JOIN users u ON u.id = wa.assigned_user_id
WHERE cr.certificate_type = 'business_permit'
ORDER BY cr.created_at DESC;
