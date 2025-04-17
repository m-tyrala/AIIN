-- Migration: Disable RLS Policies for Development
-- Description: Temporarily disables all Row Level Security policies for development purposes
-- Created at: 2024-03-20 14:45:00 UTC

-- Disable RLS on tables
alter table npc_profiles disable row level security;
alter table npc_profile_logs disable row level security;

-- Drop existing policies for npc_profiles
drop policy if exists "Authenticated users can view their own profiles" on npc_profiles;
drop policy if exists "Anonymous users can view public profiles" on npc_profiles;
drop policy if exists "Users can create their own profiles" on npc_profiles;
drop policy if exists "Users can update their own profiles" on npc_profiles;
drop policy if exists "Users can delete their own profiles" on npc_profiles;

-- Drop existing policies for npc_profile_logs
drop policy if exists "Users can view logs of their profiles" on npc_profile_logs;
drop policy if exists "Users can create logs" on npc_profile_logs; 