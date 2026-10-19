-- supabase/migrations/0003_provider_constraints.sql
--
-- One provider profile per login. Without this, a double-tap on "Finish setup"
-- could create two profiles, and every page that loads "my profile" would break.
--
-- If this fails with "could not create unique index", you already have
-- duplicate rows. Find them with:
--   select user_id, count(*) from public.providers group by user_id having count(*) > 1;
-- delete the extra rows, then run this again.

create unique index if not exists providers_user_id_key
  on public.providers (user_id);

alter table public.providers
  alter column user_id set not null;

-- Profile links: lowercase letters, numbers and single hyphens, 3–40 chars.
-- Matches validateSlug() in src/lib/validation.ts.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'providers_slug_format') then
    alter table public.providers
      add constraint providers_slug_format
      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 40)
      not valid; -- existing rows aren't checked, new and edited ones are
  end if;
end $$;
