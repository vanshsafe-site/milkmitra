-- MilkMitra schema. Run in Supabase Dashboard > SQL Editor.
create table if not exists settings (
  owner_id uuid primary key default auth.uid() references auth.users on delete cascade,
  center_name text not null default 'MilkMitra Collection Centre',
  fat_rate numeric not null default 7,     -- Rate = Fat% x fat_rate + SNF% x snf_rate
  snf_rate numeric not null default 1.6,
  support_phone text default '+91 90000 00000',
  support_email text default 'support@milkmitra.local',
  grievance_email text default 'grievance@milkmitra.local',
  payment_upi text default 'milkmitra@upi',
  bank_name text default 'MilkMitra Cooperative Bank',
  account_holder text default 'MilkMitra Collection Centre',
  bank_account text default '000000000000',
  ifsc_code text default 'MILB0000001'
);

create table if not exists farmers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  farmer_code text,                         -- SMCC0001 (auto)
  name text not null,
  father_name text,
  mobile text,
  village text,
  district text,
  milk_type text not null default 'Buffalo' check (milk_type in ('Buffalo','Cow','Mixed')),
  animals int not null default 1,
  ifsc text,
  bank_account text,
  created_at timestamptz not null default now(),
  unique (owner_id, farmer_code)
);

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  farmer_id uuid not null references farmers on delete cascade,
  collected_on date not null default current_date,
  collected_at timestamptz not null default now(),
  shift text not null check (shift in ('Morning','Evening')),
  milk_type text not null check (milk_type in ('Buffalo','Cow')),
  litres numeric not null check (litres > 0),
  fat numeric not null,
  snf numeric not null,
  rate numeric not null,
  amount numeric not null,
  status text not null default 'Pending' check (status in ('Pending','Paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists collections_date_idx on collections (owner_id, collected_on desc);

-- Auto farmer code per operator: SMCC0001, SMCC0002...
create or replace function set_farmer_code() returns trigger language plpgsql as $$
begin
  if new.farmer_code is null then
    select 'SMCC' || lpad((coalesce(max(substring(farmer_code from 5)::int), 0) + 1)::text, 4, '0')
      into new.farmer_code from farmers where owner_id = new.owner_id;
  end if;
  return new;
end $$;
drop trigger if exists farmers_code on farmers;
create trigger farmers_code before insert on farmers for each row execute function set_farmer_code();

-- Stamp paid_at when status flips
create or replace function set_paid_at() returns trigger language plpgsql as $$
begin
  if new.status = 'Paid' and (old.status is distinct from 'Paid') then new.paid_at = now();
  elsif new.status = 'Pending' then new.paid_at = null; end if;
  return new;
end $$;
drop trigger if exists collections_paid on collections;
create trigger collections_paid before update on collections for each row execute function set_paid_at();

-- Row level security: each operator sees only their own data
alter table settings enable row level security;
alter table farmers enable row level security;
alter table collections enable row level security;
create policy "own settings" on settings for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own farmers" on farmers for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own collections" on collections for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
