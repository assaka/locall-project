-- Workspaces
create table if not exists workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default now(),
  booking_link TEXT
);

-- Users
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  name text,
  created_at timestamp with time zone default now()
);

-- Workspace Members
create table if not exists workspace_members (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id),
  workspace_id uuid references workspaces(id),
  role text,
  joined_at timestamp with time zone default now()
);

-- Add workspace_id to calls, numbers, and form_submissions if not present
alter table calls add column if not exists workspace_id uuid references workspaces(id);
alter table numbers add column if not exists workspace_id uuid references workspaces(id);
alter table form_submissions add column if not exists workspace_id uuid references workspaces(id); 