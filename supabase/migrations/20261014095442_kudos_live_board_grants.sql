-- Sun* Kudos live board (F006): who may execute what. Runs after every function exists (the schema-wide grant
-- below covers kudos_private).
-- Execute: authenticated only. PUBLIC (the built-in default) and anon (Supabase's default) are revoked.
revoke all on schema kudos_private from public;
grant usage on schema kudos_private to authenticated, service_role;
revoke execute on all functions in schema kudos_private from public, anon;
grant execute on all functions in schema kudos_private to authenticated, service_role;

revoke execute on function
  public.kudos_filter_options(), public.kudos_highlight(text, text),
  public.kudos_feed_page(text, text, timestamptz, uuid, int), public.kudos_spotlight(),
  public.kudos_sidebar(), public.toggle_kudo_like(uuid)
  from public, anon;
grant execute on function
  public.kudos_filter_options(), public.kudos_highlight(text, text),
  public.kudos_feed_page(text, text, timestamptz, uuid, int), public.kudos_spotlight(),
  public.kudos_sidebar(), public.toggle_kudo_like(uuid)
  to authenticated;
