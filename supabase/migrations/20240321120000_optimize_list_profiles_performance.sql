-- Migration: Optimize List Profiles Performance
-- Description: Adds optimized indexes for the list NPC profiles endpoint
-- AND the retrieve single profile endpoint (GET /api/npc_profiles/{id})
-- - Composite index for permission-based queries with sorting
-- - Index for name-based sorting
-- - Partial indexes for public profiles
-- - Optimized index for single profile retrieval with access control
-- Created at: 2024-03-21 12:00:00 UTC

-- Composite index for the most common query pattern:
-- user_id filtering + is_public filtering + created_at sorting
-- This covers the default "user's profiles + public profiles" query with date ordering
CREATE INDEX idx_npc_profiles_user_public_created 
ON npc_profiles(user_id, is_public, created_at DESC);

-- Index specifically for name-based sorting (both directions)
-- This will be used when sort parameter is "name asc" or "name desc"
CREATE INDEX idx_npc_profiles_name ON npc_profiles(name);

-- Partial index for public profiles only (optimizes queries filtering by is_public = true)
-- This is useful for anonymous users or filtering by public profiles only
CREATE INDEX idx_npc_profiles_public_created 
ON npc_profiles(created_at DESC) 
WHERE is_public = true;

-- Composite index for updated_at sorting with permissions
-- Used when sorting by updated_at instead of created_at
CREATE INDEX idx_npc_profiles_user_public_updated 
ON npc_profiles(user_id, is_public, updated_at DESC);

-- Index for efficient user_id filtering (when requesting specific user's profiles)
-- This complements the existing user_id index with additional sorting support
CREATE INDEX idx_npc_profiles_user_created 
ON npc_profiles(user_id, created_at DESC);

-- Index for full permission queries with name sorting
-- Used for queries that need to filter by permissions and sort by name
CREATE INDEX idx_npc_profiles_user_public_name 
ON npc_profiles(user_id, is_public, name);

-- OPTIMIZATION FOR GET /api/npc_profiles/{id} ENDPOINT:
-- The primary key index on 'id' already provides O(1) lookup for single profile retrieval
-- However, we can optimize access control checks by adding a composite index
-- This index speeds up the permission validation logic in getProfileById method
CREATE INDEX idx_npc_profiles_id_access_control 
ON npc_profiles(id, user_id, is_public)
INCLUDE (name, created_at, updated_at);

-- This index helps with:
-- 1. Fast single profile lookup by ID (first column)
-- 2. Immediate access to ownership info (user_id) for permission checks
-- 3. Immediate access to visibility (is_public) for access control
-- 4. Included columns reduce the need for additional table lookups

-- Add statistics collection for better query planning
-- This helps PostgreSQL optimize queries with better cardinality estimates
ANALYZE npc_profiles; 