-- Migration: Initial Schema Setup
-- Description: Creates the initial database schema for AIIN including:
-- - Custom ENUM types for complexity levels and log operations
-- - NPC profiles table with RLS policies
-- - NPC profile logs table
-- - Views for metrics and analytics
-- Created at: 2024-03-20 14:30:00 UTC

-- Create ENUM types
create type complexity_level as enum ('uproszczony', 'zwykły', 'szczegółowy');
create type log_operation as enum ('INSERT', 'UPDATE', 'DELETE', 'GENERATE', 'OPEN');

-- Create npc_profiles table
create table npc_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    name varchar(100) not null,
    appearance varchar(500) not null,
    profession varchar(100) not null,
    relationship_to_party varchar(500) not null,
    scene_description varchar(500) not null,
    special_traits varchar(150) not null,
    complexity_level complexity_level not null,
    is_public boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create npc_profile_logs table
create table npc_profile_logs (
    id uuid primary key default gen_random_uuid(),
    npc_profile_id uuid not null references npc_profiles(id),
    user_id uuid not null references auth.users(id),
    user_role varchar(20) not null check (user_role in ('admin', 'user')),
    operation log_operation not null,
    operation_timestamp timestamptz not null default now(),
    duration interval
);

-- Create indexes
create index idx_npc_profiles_user_id on npc_profiles(user_id);
create index idx_npc_profile_logs_profile_id on npc_profile_logs(npc_profile_id);
create index idx_npc_profile_logs_user_id on npc_profile_logs(user_id);

-- Enable Row Level Security
alter table npc_profiles enable row level security;
alter table npc_profile_logs enable row level security;

-- Create RLS Policies for npc_profiles

-- Select policies for authenticated and anonymous users
create policy "Authenticated users can view their own profiles"
    on npc_profiles
    for select
    to authenticated
    using (
        user_id = auth.uid() or 
        is_public = true or 
        exists (
            select 1 from auth.users
            where id = auth.uid() and raw_user_meta_data->>'role' = 'admin'
        )
    );

create policy "Anonymous users can view public profiles"
    on npc_profiles
    for select
    to anon
    using (is_public = true);

-- Insert policy for authenticated users
create policy "Users can create their own profiles"
    on npc_profiles
    for insert
    to authenticated
    with check (user_id = auth.uid());

-- Update and delete policies for authenticated users
create policy "Users can update their own profiles"
    on npc_profiles
    for update
    to authenticated
    using (
        user_id = auth.uid() or
        exists (
            select 1 from auth.users
            where id = auth.uid() and raw_user_meta_data->>'role' = 'admin'
        )
    );

create policy "Users can delete their own profiles"
    on npc_profiles
    for delete
    to authenticated
    using (
        user_id = auth.uid() or
        exists (
            select 1 from auth.users
            where id = auth.uid() and raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Create RLS Policies for npc_profile_logs

-- Select policies
create policy "Users can view logs of their profiles"
    on npc_profile_logs
    for select
    to authenticated
    using (
        exists (
            select 1 from npc_profiles
            where npc_profiles.id = npc_profile_id
            and (npc_profiles.user_id = auth.uid() or npc_profiles.is_public = true)
        ) or
        exists (
            select 1 from auth.users
            where id = auth.uid() and raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Insert policy
create policy "Users can create logs"
    on npc_profile_logs
    for insert
    to authenticated
    with check (
        exists (
            select 1 from npc_profiles
            where npc_profiles.id = npc_profile_id
            and (npc_profiles.user_id = auth.uid() or npc_profiles.is_public = true)
        )
    );

-- Create views
create view npc_profile_metrics as
select
    l.npc_profile_id,
    count(*) filter (where l.operation = 'UPDATE' and l.user_role <> 'admin' and l.user_id = p.user_id) as owner_edit_count,
    count(*) filter (where l.operation = 'UPDATE' and l.user_role <> 'admin' and l.user_id <> p.user_id) as other_edit_count,
    count(*) filter (where l.operation = 'OPEN' and l.user_role <> 'admin' and l.user_id = p.user_id) as owner_open_count,
    count(*) filter (where l.operation = 'OPEN' and l.user_role <> 'admin' and l.user_id <> p.user_id) as other_open_count
from npc_profile_logs l
join npc_profiles p on l.npc_profile_id = p.id
group by l.npc_profile_id, p.user_id;

create view npc_generate_avg_duration_by_complexity as
select
    p.complexity_level,
    avg(l.duration) as average_generate_duration
from npc_profile_logs l
join npc_profiles p on l.npc_profile_id = p.id
where l.operation = 'GENERATE'
group by p.complexity_level;

-- Create trigger for updating the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_npc_profiles_updated_at
    before update on npc_profiles
    for each row
    execute function update_updated_at_column(); 