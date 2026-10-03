revoke execute on function public.grant_owner_admin() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;