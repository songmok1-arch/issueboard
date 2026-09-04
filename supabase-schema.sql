-- 이슈보드 — Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 Run 하세요.

create extension if not exists pgcrypto;

create table if not exists ib_boards (
  id uuid primary key default gen_random_uuid(),
  share_code text unique not null,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists ib_issues (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references ib_boards(id) on delete cascade,
  title text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  owner text,
  status text not null default 'open' check (status in ('open', 'doing', 'resolved')),
  memo text,
  created_at timestamptz not null default now()
);

create index if not exists ib_issues_board_id_idx on ib_issues (board_id);

alter table ib_boards enable row level security;
alter table ib_issues enable row level security;

-- MVP 정책: 링크(share_code)를 아는 사람은 누구나 읽고 쓸 수 있습니다.
drop policy if exists "public read ib_boards" on ib_boards;
create policy "public read ib_boards" on ib_boards for select using (true);
drop policy if exists "public insert ib_boards" on ib_boards;
create policy "public insert ib_boards" on ib_boards for insert with check (true);

drop policy if exists "public read ib_issues" on ib_issues;
create policy "public read ib_issues" on ib_issues for select using (true);
drop policy if exists "public insert ib_issues" on ib_issues;
create policy "public insert ib_issues" on ib_issues for insert with check (true);
drop policy if exists "public update ib_issues" on ib_issues;
create policy "public update ib_issues" on ib_issues for update using (true);
drop policy if exists "public delete ib_issues" on ib_issues;
create policy "public delete ib_issues" on ib_issues for delete using (true);
