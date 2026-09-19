-- ============================================================
-- SupplyMatch Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table categories enable row level security;
alter table requirements enable row level security;
alter table offerings enable row level security;
alter table matches enable row level security;
alter table notifications enable row level security;


-- ============================================================
-- PROFILES
-- Users can read profiles and update their own profile.
-- ============================================================

create policy "profiles_select"
on profiles
for select
to authenticated
using (true);

create policy "profiles_insert_own"
on profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);


-- ============================================================
-- CATEGORIES
-- Categories are public reference data.
-- ============================================================

create policy "categories_select"
on categories
for select
to authenticated
using (true);


-- ============================================================
-- REQUIREMENTS
-- Users can read requirements and modify only their own.
-- ============================================================

create policy "requirements_select_own"
on requirements
for select
to authenticated
using (auth.uid() = user_id);

create policy "requirements_insert_own"
on requirements
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "requirements_update_own"
on requirements
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "requirements_delete_own"
on requirements
for delete
to authenticated
using (auth.uid() = user_id);


-- ============================================================
-- OFFERINGS
-- Users can read offerings and modify only their own.
-- ============================================================

create policy "offerings_select_own"
on offerings
for select
to authenticated
using (auth.uid() = user_id);

create policy "offerings_insert_own"
on offerings
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "offerings_update_own"
on offerings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "offerings_delete_own"
on offerings
for delete
to authenticated
using (auth.uid() = user_id);


-- ============================================================
-- MATCHES
-- Authenticated users can view matches involving their data.
-- Match modifications will later be handled by the backend.
-- ============================================================

create policy "matches_select_own"
on matches
for select
to authenticated
using (
    exists (
        select 1
        from requirements r
        where r.id = matches.requirement_id
        and r.user_id = auth.uid()
    )
    or
    exists (
        select 1
        from offerings o
        where o.id = matches.offering_id
        and o.user_id = auth.uid()
    )
);


-- ============================================================
-- NOTIFICATIONS
-- Users can access only their own notifications.
-- ============================================================

create policy "notifications_select_own"
on notifications
for select
to authenticated
using (auth.uid() = user_id);

create policy "notifications_update_own"
on notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);