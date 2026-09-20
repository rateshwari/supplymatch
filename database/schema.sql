-- ============================================================
-- SupplyMatch Database Schema
-- ============================================================

-- Enable required PostgreSQL extensions
create extension if not exists pgcrypto;
create extension if not exists vector;

-- ============================================================
-- PROFILES
-- Extends Supabase Auth users with application-specific data
-- ============================================================

create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    role text not null check (role in ('client', 'supplier')),
    name text not null,
    company text,
    created_at timestamptz default now()
);

-- ============================================================
-- CATEGORIES
-- Self-referencing hierarchy:
-- parent_id = NULL  -> top-level category
-- parent_id = ID    -> subcategory
-- ============================================================

create table if not exists categories (
    id serial primary key,
    name text not null,
    parent_id int references categories(id) on delete cascade
);

-- ============================================================
-- REQUIREMENTS
-- Posted by clients
-- ============================================================

create table if not exists requirements (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) not null,
    product text not null,
    category_id int references categories(id) not null,
    quantity text not null,
    budget text not null,
    location text not null,
    timeline text not null,
    notes text,
    embedding vector(384),
    created_at timestamptz default now()
);

-- HNSW index for semantic similarity search
create index if not exists requirements_embedding_idx
on requirements
using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- OFFERINGS
-- Posted by suppliers
-- ============================================================

create table if not exists offerings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) not null,
    product text not null,
    category_id int references categories(id) not null,
    quantity text not null,
    price text not null,
    location text not null,
    delivery text not null,
    notes text,
    embedding vector(384),
    created_at timestamptz default now()
);

-- HNSW index for semantic similarity search
create index if not exists offerings_embedding_idx
on offerings
using hnsw (embedding vector_cosine_ops);

-- ============================================================
-- VECTOR SEARCH
-- Retrieves semantically similar supplier offerings
-- ============================================================

create or replace function match_offerings(
    query_embedding vector(384),
    match_count integer default 20
)
returns table (
    id uuid,
    user_id uuid,
    product text,
    category_id integer,
    quantity text,
    price text,
    location text,
    delivery text,
    notes text,
    similarity double precision
)
language sql
stable
as $$
    select
        o.id,
        o.user_id,
        o.product,
        o.category_id,
        o.quantity,
        o.price,
        o.location,
        o.delivery,
        o.notes,
        1 - (o.embedding <=> query_embedding) as similarity
    from offerings as o
    where o.embedding is not null
    order by o.embedding <=> query_embedding
    limit match_count;
$$;

-- ============================================================
-- MATCHES
-- Connects requirements with suitable supplier offerings
-- ============================================================

create table if not exists matches (
    id uuid primary key default gen_random_uuid(),
    requirement_id uuid references requirements(id) on delete cascade,
    offering_id uuid references offerings(id) on delete cascade,
    score int not null,
    breakdown jsonb not null,
    explanation text,
    tags text[],
    status text default 'pending'
        check (status in ('pending', 'contacted', 'confirmed')),
    created_at timestamptz default now(),

    unique(requirement_id, offering_id)
);

-- Highest scoring matches first
create index if not exists matches_score_idx
on matches (score desc);

-- ============================================================
-- NOTIFICATIONS
-- In-app notifications for clients and suppliers
-- ============================================================

create table if not exists notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete cascade,
    match_id uuid references matches(id) on delete cascade,
    message text not null,
    read boolean default false,
    created_at timestamptz default now()
);
