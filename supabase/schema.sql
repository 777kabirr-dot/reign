-- Reign Content Publisher — Supabase schema
-- Run this in the Supabase SQL editor (or psql) to provision the tables.

create extension if not exists "pgcrypto";

create table if not exists clients (
    id                uuid primary key default gen_random_uuid(),
    name              text not null,
    brand             text default '',
    industry          text default '',
    tone              text default 'Professional',
    keywords          text default '',
    brief             text default '',
    location          text default '',
    wp_url            text default '',
    wp_user           text default '',
    wp_pass           text default '',
    last_generated_at timestamptz,
    created_at        timestamptz not null default now()
);

create table if not exists content_published (
    id            uuid primary key default gen_random_uuid(),
    client_id     uuid not null references clients(id) on delete cascade,
    title         text not null,
    type          text not null,
    platform      text not null,
    url           text,
    content_text  text not null,
    word_count    integer not null default 0,
    published_at  timestamptz not null default now()
);

create index if not exists idx_content_client     on content_published (client_id);
create index if not exists idx_content_type        on content_published (type);
create index if not exists idx_content_platform    on content_published (platform);
create index if not exists idx_content_published   on content_published (published_at desc);

-- Single-operator tool: this is a service-key backend, so RLS is left disabled.
-- If you expose the anon key to a browser, enable RLS and add policies first.
