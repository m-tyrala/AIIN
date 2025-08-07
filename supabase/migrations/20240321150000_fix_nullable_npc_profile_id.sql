-- Migration: Fix nullable npc_profile_id
-- Description: Makes npc_profile_id nullable in npc_profile_logs table to support
-- GENERATE operations that don't have a profile ID yet
-- Created at: 2024-03-21 15:00:00 UTC

-- Drop existing foreign key constraint
ALTER TABLE npc_profile_logs DROP CONSTRAINT IF EXISTS npc_profile_logs_npc_profile_id_fkey;

-- Modify the column to allow NULL values
ALTER TABLE npc_profile_logs ALTER COLUMN npc_profile_id DROP NOT NULL;

-- Recreate foreign key constraint with ON DELETE CASCADE for cleanup
ALTER TABLE npc_profile_logs 
ADD CONSTRAINT npc_profile_logs_npc_profile_id_fkey 
FOREIGN KEY (npc_profile_id) REFERENCES npc_profiles(id) ON DELETE CASCADE;

-- Update the RLS policy for logs to handle NULL npc_profile_id
DROP POLICY IF EXISTS "Users can view logs of their profiles" ON npc_profile_logs;
DROP POLICY IF EXISTS "Users can create logs" ON npc_profile_logs;

-- Create new RLS policies that handle NULL npc_profile_id
CREATE POLICY "Users can view logs of their profiles"
    ON npc_profile_logs
    FOR SELECT
    TO authenticated
    USING (
        -- Allow if user is the one who created the log (for GENERATE operations)
        user_id = auth.uid() OR
        -- Allow if the profile belongs to the user or is public
        (npc_profile_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM npc_profiles
            WHERE npc_profiles.id = npc_profile_id
            AND (npc_profiles.user_id = auth.uid() OR npc_profiles.is_public = true)
        )) OR
        -- Allow admins to view all logs
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Users can create logs"
    ON npc_profile_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Allow if user is creating their own log entry
        user_id = auth.uid() AND (
            -- For GENERATE operations (npc_profile_id is NULL)
            npc_profile_id IS NULL OR
            -- For other operations, profile must exist and be accessible
            EXISTS (
                SELECT 1 FROM npc_profiles
                WHERE npc_profiles.id = npc_profile_id
                AND (npc_profiles.user_id = auth.uid() OR npc_profiles.is_public = true)
            )
        )
    );

-- Update the metrics view to handle NULL npc_profile_id
DROP VIEW IF EXISTS npc_profile_metrics;
CREATE VIEW npc_profile_metrics AS
SELECT
    l.npc_profile_id,
    COUNT(*) FILTER (WHERE l.operation = 'UPDATE' AND l.user_role <> 'admin' AND l.user_id = p.user_id) as owner_edit_count,
    COUNT(*) FILTER (WHERE l.operation = 'UPDATE' AND l.user_role <> 'admin' AND l.user_id <> p.user_id) as other_edit_count,
    COUNT(*) FILTER (WHERE l.operation = 'OPEN' AND l.user_role <> 'admin' AND l.user_id = p.user_id) as owner_open_count,
    COUNT(*) FILTER (WHERE l.operation = 'OPEN' AND l.user_role <> 'admin' AND l.user_id <> p.user_id) as other_open_count
FROM npc_profile_logs l
LEFT JOIN npc_profiles p ON l.npc_profile_id = p.id
WHERE l.npc_profile_id IS NOT NULL  -- Only include logs with actual profile IDs
GROUP BY l.npc_profile_id, p.user_id;

-- Update the generate duration view to handle NULL npc_profile_id
DROP VIEW IF EXISTS npc_generate_avg_duration_by_complexity;
CREATE VIEW npc_generate_avg_duration_by_complexity AS
SELECT
    p.complexity_level,
    AVG(l.duration) as average_generate_duration
FROM npc_profile_logs l
LEFT JOIN npc_profiles p ON l.npc_profile_id = p.id
WHERE l.operation = 'GENERATE' AND p.complexity_level IS NOT NULL
GROUP BY p.complexity_level; 