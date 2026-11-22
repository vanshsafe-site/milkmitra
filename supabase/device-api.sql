-- Run after schema.sql in Supabase SQL Editor.
-- ESP32 credentials are hashed and are never available to browser clients.
create table if not exists api_devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at timestamptz
);

create table if not exists api_device_credentials (
  device_id uuid primary key references api_devices on delete cascade,
  key_hash text not null unique check (char_length(key_hash) = 64),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists milk_device_readings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  device_id uuid not null references api_devices on delete cascade,
  device_label text,
  milk_type text check (milk_type in ('Cow', 'Buffalo', 'Mixed')),
  weight_kg numeric check (weight_kg between 0 and 100000),
  turbidity_ntu numeric check (turbidity_ntu between 0 and 100000),
  temperature_c numeric check (temperature_c between -20 and 100),
  fat_percent numeric check (fat_percent between 0 and 100),
  snf_percent numeric check (snf_percent between 0 and 100),
  ph numeric check (ph between 0 and 14),
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists api_devices_owner_idx on api_devices (owner_id, created_at desc);
create index if not exists milk_device_readings_owner_time_idx on milk_device_readings (owner_id, measured_at desc);

alter table api_devices enable row level security;
alter table api_device_credentials enable row level security;
alter table milk_device_readings enable row level security;
drop policy if exists "own api devices read" on api_devices;
create policy "own api devices read" on api_devices for select to authenticated using (owner_id = auth.uid());
drop policy if exists "own device readings read" on milk_device_readings;
create policy "own device readings read" on milk_device_readings for select to authenticated using (owner_id = auth.uid());
-- No authenticated policies on api_device_credentials: only the server service-role key may access it.
revoke all on api_device_credentials from anon, authenticated;
grant select on api_devices, milk_device_readings to authenticated;
