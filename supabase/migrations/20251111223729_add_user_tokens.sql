BEGIN;

-- =========================
-- USER TOKENS TABLE
-- =========================
-- Table to store Spotify refresh tokens per user
create table if not exists public.user_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'spotify',
  refresh_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for faster lookups
create index if not exists idx_user_tokens_user on public.user_tokens (user_id);

-- =========================
-- ROW LEVEL SECURITY
-- =========================
alter table public.user_tokens enable row level security;

-- Users can only read their own tokens
create policy "read own tokens" on public.user_tokens
  for select using (auth.uid() = user_id);

-- Service role can manage all tokens (for cron jobs)
-- No insert/update policies for users - only via service role

COMMIT;

