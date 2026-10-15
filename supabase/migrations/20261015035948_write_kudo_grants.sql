-- Viết Kudo (F007): who may execute the write-path functions. Runs after every function exists.
-- Execute: authenticated only; PUBLIC (the built-in default) and anon (Supabase's default) are revoked.
-- The schema-wide kudos_private grant is re-run so the new helpers follow the F006 rule.
revoke execute on all functions in schema kudos_private from public, anon;
grant execute on all functions in schema kudos_private to authenticated, service_role;

revoke execute on function
  public.search_sunners(text),
  public.create_kudo(uuid, text, text, jsonb, text[], text[], boolean, text)
  from public, anon;
grant execute on function
  public.search_sunners(text),
  public.create_kudo(uuid, text, text, jsonb, text[], text[], boolean, text)
  to authenticated;
