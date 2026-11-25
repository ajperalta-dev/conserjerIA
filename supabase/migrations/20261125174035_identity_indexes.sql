create index audit_logs_actor_idx on public.audit_logs(actor_id);
create index audit_logs_organization_idx on public.audit_logs(organization_id);
create index consortium_members_org_consortium_idx on public.consortium_members(organization_id,consortium_id);
create index consortium_members_org_user_idx on public.consortium_members(organization_id,user_id);
create index invitations_created_by_idx on public.invitations(created_by);
create index invitations_org_consortium_idx on public.invitations(organization_id,consortium_id);
alter policy edit_consortium on public.consortiums using(public.has_permission(id,'consortium.update') and ((select auth.jwt())->>'aal')='aal2') with check(public.has_permission(id,'consortium.update') and ((select auth.jwt())->>'aal')='aal2');
alter policy invite on public.invitations with check(created_by=(select auth.uid()) and public.has_permission(consortium_id,'members.invite') and ((select auth.jwt())->>'aal')='aal2');
alter policy read_invites on public.invitations using(created_by=(select auth.uid()) or email=lower((select auth.jwt())->>'email'));
