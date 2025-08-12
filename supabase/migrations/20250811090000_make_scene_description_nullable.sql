-- Migration: Make scene_description nullable in npc_profiles
-- Description: Drops NOT NULL constraint from scene_description to align with product rules
-- Created at: 2025-08-11 09:00:00 UTC

alter table npc_profiles
  alter column scene_description drop not null;


