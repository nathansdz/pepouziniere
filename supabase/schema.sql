-- Schéma Supabase pour Potachill
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query -> coller -> Run

create extension if not exists "pgcrypto";

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  budget numeric default 0,
  priority text not null check (priority in ('urgent', 'normal', 'later')),
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.todo_likes (
  todo_id uuid not null references public.todos(id) on delete cascade,
  user_key uuid not null,
  created_at timestamptz not null default now(),
  primary key (todo_id, user_key)
);

create index if not exists idx_todo_likes_todo on public.todo_likes(todo_id);

-- RLS : lecture et écriture ouvertes à toute personne avec la clé anon
-- (suffisant pour un usage interne entre internes de confiance)
alter table public.todos enable row level security;
alter table public.todo_likes enable row level security;

drop policy if exists "todos lisibles par tous" on public.todos;
create policy "todos lisibles par tous" on public.todos
  for select using (true);

drop policy if exists "todos insérables par tous" on public.todos;
create policy "todos insérables par tous" on public.todos
  for insert with check (true);

drop policy if exists "todos supprimables par tous" on public.todos;
create policy "todos supprimables par tous" on public.todos
  for delete using (true);

drop policy if exists "todo_likes lisibles par tous" on public.todo_likes;
create policy "todo_likes lisibles par tous" on public.todo_likes
  for select using (true);

drop policy if exists "todo_likes insérables par tous" on public.todo_likes;
create policy "todo_likes insérables par tous" on public.todo_likes
  for insert with check (true);

drop policy if exists "todo_likes supprimables par tous" on public.todo_likes;
create policy "todo_likes supprimables par tous" on public.todo_likes
  for delete using (true);

-- Fonction : liker / dé-liker une proposition (met à jour le compteur)
create or replace function public.toggle_like(p_todo_id uuid, p_user_key uuid)
returns void
language plpgsql
security definer
as $$
begin
  if exists (
    select 1 from public.todo_likes
    where todo_id = p_todo_id and user_key = p_user_key
  ) then
    delete from public.todo_likes
    where todo_id = p_todo_id and user_key = p_user_key;

    update public.todos
    set likes_count = greatest(0, likes_count - 1)
    where id = p_todo_id;
  else
    insert into public.todo_likes (todo_id, user_key)
    values (p_todo_id, p_user_key);

    update public.todos
    set likes_count = likes_count + 1
    where id = p_todo_id;
  end if;
end;
$$;

grant execute on function public.toggle_like(uuid, uuid) to anon, authenticated;

-- ---------- Profils (inscription) ----------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nom text not null,
  prenom text not null,
  pseudo text not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles lisibles par tous" on public.profiles;
create policy "profiles lisibles par tous" on public.profiles
  for select using (true);

drop policy if exists "profile modifiable par son propriétaire" on public.profiles;
create policy "profile modifiable par son propriétaire" on public.profiles
  for update using (auth.uid() = id);

-- ---------- Solde de la cagnotte (mise à jour manuelle) ----------

create table if not exists public.pot_balance (
  id int primary key default 1 check (id = 1),
  amount numeric not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.pot_balance (id, amount) values (1, 0)
on conflict (id) do nothing;

alter table public.pot_balance enable row level security;

drop policy if exists "pot_balance lisible par tous" on public.pot_balance;
create policy "pot_balance lisible par tous" on public.pot_balance
  for select using (true);

drop policy if exists "pot_balance modifiable par les connectés" on public.pot_balance;
create policy "pot_balance modifiable par les connectés" on public.pot_balance
  for update using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Crée automatiquement le profil à l'inscription (métadonnées de signup)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nom, prenom, pseudo)
  values (
    new.id,
    new.raw_user_meta_data->>'nom',
    new.raw_user_meta_data->>'prenom',
    new.raw_user_meta_data->>'pseudo'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
