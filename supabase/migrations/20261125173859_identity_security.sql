create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create type public.app_role as enum ('SUPER_ADMIN','ADMIN','ACCOUNTANT','BOARD_MEMBER','OWNER','TENANT','MAINTENANCE');
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade, display_name text not null default '' check(length(display_name)<=120), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.organizations(id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 120), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz);
create table public.organization_members(id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), user_id uuid not null references auth.users(id), role public.app_role not null check(role <> 'SUPER_ADMIN'), created_at timestamptz not null default now(), unique(organization_id,user_id));
create index on public.organization_members(user_id);
create table public.consortiums(id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), name text not null check(length(name) between 1 and 120), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz, unique(organization_id,id));
create table public.consortium_members(id uuid primary key default gen_random_uuid(), organization_id uuid not null, consortium_id uuid not null, user_id uuid not null, role public.app_role not null check(role <> 'SUPER_ADMIN'), created_at timestamptz not null default now(), foreign key(organization_id,consortium_id) references public.consortiums(organization_id,id), foreign key(organization_id,user_id) references public.organization_members(organization_id,user_id), unique(consortium_id,user_id));
create index on public.consortium_members(user_id,organization_id);
create table public.role_permissions(id uuid primary key default gen_random_uuid(), role public.app_role not null, permission text not null, created_at timestamptz not null default now(), unique(role,permission));
insert into public.role_permissions(role,permission) values ('ADMIN','consortium.read'),('ADMIN','consortium.update'),('ADMIN','members.invite'),('ADMIN','documents.read'),('ACCOUNTANT','consortium.read'),('ACCOUNTANT','finance.read'),('BOARD_MEMBER','consortium.read'),('OWNER','consortium.read'),('TENANT','consortium.read'),('MAINTENANCE','consortium.read');
create table private.platform_admins(user_id uuid primary key references auth.users(id));
alter table private.platform_admins enable row level security;
create policy own_admin on private.platform_admins for select to authenticated using(user_id=(select auth.uid()));
grant select on private.platform_admins to authenticated;
create function public.has_permission(target uuid, action text) returns boolean language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.consortium_members m join public.role_permissions p on p.role=m.role where m.user_id=(select auth.uid()) and m.consortium_id=target and p.permission=action)
 or exists(select 1 from private.platform_admins where user_id=(select auth.uid()));
$$;
create table public.invitations(id uuid primary key default gen_random_uuid(), organization_id uuid not null, consortium_id uuid not null, email text not null check(email=lower(email)), role public.app_role not null check(role in ('OWNER','TENANT','MAINTENANCE','BOARD_MEMBER','ACCOUNTANT')), created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '7 days', accepted_at timestamptz, foreign key(organization_id,consortium_id) references public.consortiums(organization_id,id));
create index on public.invitations(email);
create table public.audit_logs(id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id), organization_id uuid references public.organizations(id), action text not null, resource_id uuid not null, created_at timestamptz not null default now());
-- No direct writes to membership tables, permission catalog or audit log.
do $$ declare t text; begin foreach t in array array['profiles','organizations','organization_members','consortiums','consortium_members','role_permissions','invitations','audit_logs'] loop execute format('alter table public.%I enable row level security',t); execute format('revoke all on public.%I from anon, authenticated',t); execute format('grant select on public.%I to authenticated',t); end loop; end $$;
create policy self_profile on public.profiles for select to authenticated using(id=(select auth.uid()));
grant update(display_name,updated_at) on public.profiles to authenticated;
create policy edit_profile on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy self_org_member on public.organization_members for select to authenticated using(user_id=(select auth.uid()));
create policy self_consortium_member on public.consortium_members for select to authenticated using(user_id=(select auth.uid()));
create policy read_permissions on public.role_permissions for select to authenticated using(true);
create policy read_org on public.organizations for select to authenticated using(exists(select 1 from public.organization_members m where m.organization_id=organizations.id and m.user_id=(select auth.uid())));
create policy read_consortium on public.consortiums for select to authenticated using(public.has_permission(id,'consortium.read'));
grant update(name,updated_at) on public.consortiums to authenticated;
create policy edit_consortium on public.consortiums for update to authenticated using(public.has_permission(id,'consortium.update') and (select auth.jwt()->>'aal')='aal2') with check(public.has_permission(id,'consortium.update') and (select auth.jwt()->>'aal')='aal2');
grant insert(organization_id,consortium_id,email,role) on public.invitations to authenticated;
create policy invite on public.invitations for insert to authenticated with check(created_by=(select auth.uid()) and public.has_permission(consortium_id,'members.invite') and (select auth.jwt()->>'aal')='aal2');
create policy read_invites on public.invitations for select to authenticated using(created_by=(select auth.uid()) or email=lower((select auth.jwt()->>'email')));
create policy read_audit on public.audit_logs for select to authenticated using(actor_id=(select auth.uid()));
-- Narrow definer functions are needed for immutable audit and atomic acceptance.
-- They never accept a role or user ID supplied by the caller.
create function private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_logs(actor_id,organization_id,action,resource_id) values(auth.uid(),new.organization_id,TG_TABLE_NAME||'.'||TG_OP,new.id);
 return new;
end $$;
revoke all on function private.audit_change() from public;
create trigger audit_consortium after update on public.consortiums for each row execute function private.audit_change();
create trigger audit_invite after insert or update on public.invitations for each row execute function private.audit_change();
create function private.accept_invitation(invitation_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare invitation public.invitations;
begin
 if auth.uid() is null then raise exception 'Sesión requerida'; end if;
 select * into invitation from public.invitations where id=invitation_id for update;
 if invitation.id is null or invitation.accepted_at is not null or invitation.expires_at<=now()
 or invitation.email<>lower(auth.jwt()->>'email') or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null and lower(email)=invitation.email) then raise exception 'Invitación inválida'; end if;
 -- Revalidate the issuer's current scope and permission, even after revocation.
 if not exists(select 1 from public.consortium_members m join public.role_permissions p on p.role=m.role where m.user_id=invitation.created_by and m.consortium_id=invitation.consortium_id and p.permission='members.invite') then raise exception 'Invitador sin autorización'; end if;
 insert into public.organization_members(organization_id,user_id,role) values(invitation.organization_id,auth.uid(),invitation.role) on conflict(organization_id,user_id) do nothing;
 insert into public.consortium_members(organization_id,consortium_id,user_id,role) values(invitation.organization_id,invitation.consortium_id,auth.uid(),invitation.role);
 update public.invitations set accepted_at=now() where id=invitation.id;
end $$;
revoke all on function private.accept_invitation(uuid) from public;
grant execute on function private.accept_invitation(uuid) to authenticated;
create function public.accept_invitation(invitation_id uuid) returns void language sql security invoker set search_path='' as $$
 select private.accept_invitation(invitation_id);
$$;
revoke all on function public.accept_invitation(uuid) from public;
grant execute on function public.accept_invitation(uuid) to authenticated;
revoke all on function public.has_permission(uuid,text) from public;
grant execute on function public.has_permission(uuid,text) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('consortium-private','consortium-private',false,10485760,array['application/pdf','image/png','image/jpeg']) on conflict(id) do nothing;
-- No object policies until document-level permissions are introduced in stage 8.
-- Signed URLs require SELECT permission, so all access currently fails closed.

grant insert(id,display_name) on public.profiles to authenticated;
create policy create_profile on public.profiles for insert to authenticated with check(id=(select auth.uid()));
