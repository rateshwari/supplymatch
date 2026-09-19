-- ============================================================
-- SupplyMatch Database Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists pgcrypto;

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