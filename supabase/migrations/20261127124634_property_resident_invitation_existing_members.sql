-- Link a resident who already has a portal membership without changing their role.
create or replace function private.accept_invitation(invitation_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare invitation public.invitations;
begin
 if auth.uid() is null then raise exception 'Sesión requerida'; end if;
 select * into invitation from public.invitations where id=invitation_id for update;
 if invitation.id is null or invitation.accepted_at is not null or invitation.expires_at<=now()
 or invitation.email<>lower(auth.jwt()->>'email') or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null and lower(email)=invitation.email) then raise exception 'Invitación inválida'; end if;
 -- Revalidate the issuer's current scope and permission, even after revocation.
 if not exists(select 1 from public.consortium_members m join public.role_permissions p on p.role=m.role where m.user_id=invitation.created_by and m.consortium_id=invitation.consortium_id and p.permission='members.invite') then raise exception 'Invitador sin autorización'; end if;
 insert into public.organization_members(organization_id,user_id,role) values(invitation.organization_id,auth.uid(),invitation.role) on conflict(organization_id,user_id) do nothing;
 insert into public.consortium_members(organization_id,consortium_id,user_id,role) values(invitation.organization_id,invitation.consortium_id,auth.uid(),invitation.role)
 on conflict(consortium_id,user_id) do nothing;
 update public.invitations set accepted_at=now() where id=invitation.id;
end $$;
