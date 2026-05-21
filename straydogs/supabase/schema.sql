-- Stray Dogs Directory — Supabase Schema
-- Run in Supabase SQL editor

create extension if not exists "uuid-ossp";

-- Profiles
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  city text default 'Chennai',
  created_at timestamptz default now()
);

create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles(id, name, email, city)
  values(new.id, new.raw_user_meta_data->>'name', new.email, coalesce(new.raw_user_meta_data->>'city','Chennai'));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure handle_new_user();

-- Dogs
create table if not exists dogs (
  id uuid default uuid_generate_v4() primary key,
  dog_id text unique,  -- human-readable like SD-001
  breed text,
  color text,
  size text,
  sex text default 'unknown',
  age text,
  injured boolean default false,
  injury_notes text,
  confidence integer,
  breed_confidence integer,
  notes text,
  reporter_name text,
  reporter_id uuid references profiles(id),
  lat double precision,
  lng double precision,
  area text,
  city text,
  photo_url text,
  vaccinated boolean default false,
  vaccination_notes text,
  status text default 'sighted',        -- 'sighted' | 'being_rescued' | 'in_shelter' | 'reunited'
  report_type text default 'stray',     -- 'stray' | 'lost_pet'
  pet_name text,
  owner_phone text,
  date_lost text,
  feature_vector float8[],              -- 128-dim embedding from MobileNetV2, stored by backend
  created_at timestamptz default now()
);

-- Auto-generate dog_id like SD-001
create or replace function set_dog_id() returns trigger as $$
declare
  count_val integer;
begin
  select count(*) + 1 into count_val from dogs;
  new.dog_id := 'SD-' || lpad(count_val::text, 3, '0');
  return new;
end;
$$ language plpgsql;

drop trigger if exists before_dog_insert on dogs;
create trigger before_dog_insert before insert on dogs
  for each row execute procedure set_dog_id();

create index if not exists dogs_created_at_idx on dogs(created_at desc);
create index if not exists dogs_city_idx on dogs(city);
create index if not exists dogs_breed_idx on dogs(breed);
create index if not exists dogs_color_idx on dogs(color);

-- RLS
alter table profiles enable row level security;
create policy "Profiles readable by all" on profiles for select using (true);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

alter table dogs enable row level security;
create policy "Dogs readable by all" on dogs for select using (true);
create policy "Authenticated users insert dogs" on dogs for insert with check (auth.role() = 'authenticated');
create policy "Reporter can update own dog" on dogs for update using (auth.uid() = reporter_id);
create policy "Reporter can delete own dog" on dogs for delete using (auth.uid() = reporter_id);

-- Seed data
insert into dogs (breed, color, size, sex, age, injured, confidence, breed_confidence, reporter_name, lat, lng, area, city, vaccinated, vaccination_notes)
values
  ('Indian Pariah Dog','tan','medium','male','adult (1.5–7 yr)',false,87,72,'Arun K.',13.0415,80.2337,'T. Nagar','Chennai',false,null),
  ('Labrador mix','black & white','large','female','adult (1.5–7 yr)',false,91,68,'Meena S.',13.0012,80.2565,'Adyar','Chennai',true,'Rabies – Mar 2024'),
  ('Indian Spitz mix','white','small','female','juvenile (6–18 mo)',true,79,61,'Priya N.',13.0569,80.2425,'T. Nagar','Chennai',false,null),
  ('Indian Pariah Dog','brown','medium','male','senior (7+ yr)',false,83,80,'Ravi M.',12.9823,80.2209,'Velachery','Chennai',false,null);
