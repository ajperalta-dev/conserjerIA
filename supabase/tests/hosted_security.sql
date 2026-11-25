begin;
insert into auth.users(id,email,email_confirmed_at) values
('10000000-0000-4000-8000-000000000001','admin-security@demo.invalid',now()),
('10000000-0000-4000-8000-000000000002','owner-security@demo.invalid',now()),
('10000000-0000-4000-8000-000000000003','tenant-security@demo.invalid',now());
insert into organizations(id,name) values ('20000000-0000-4000-8000-000000000001','DEMO seguridad A'),('20000000-0000-4000-8000-000000000002','DEMO seguridad B');
insert into consortiums(id,organization_id,name) values ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','DEMO A'),('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','DEMO B');
insert into organization_members(organization_id,user_id,role) select '20000000-0000-4000-8000-000000000001',id,case email when 'admin-security@demo.invalid' then 'ADMIN'::app_role when 'owner-security@demo.invalid' then 'OWNER'::app_role else 'TENANT'::app_role end from auth.users where email in ('admin-security@demo.invalid','owner-security@demo.invalid','tenant-security@demo.invalid');
insert into consortium_members(organization_id,consortium_id,user_id,role) select organization_id,'30000000-0000-4000-8000-000000000001',user_id,role from organization_members where organization_id='20000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1","email":"admin-security@demo.invalid"}',true);
do $$ begin
if (select count(*) from consortiums)<>1 then raise exception 'Aislamiento ADMIN falló'; end if;
update consortiums set name='No debe cambiar';
if found then raise exception 'MFA no aplicado'; end if;
begin update consortium_members set role='SUPER_ADMIN'; raise exception 'Escalamiento permitido'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal2","email":"owner-security@demo.invalid"}',true);
do $$ begin
if (select count(*) from consortiums)<>1 then raise exception 'Aislamiento OWNER falló'; end if;
update consortiums set name='No debe cambiar';
if found then raise exception 'OWNER escribió'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal2","email":"tenant-security@demo.invalid"}',true);
do $$ begin
if has_permission('30000000-0000-4000-8000-000000000001','finance.read') then raise exception 'TENANT financiero'; end if;
if exists(select 1 from profiles where id<>auth.uid()) then raise exception 'Perfil ajeno expuesto'; end if;
begin insert into invitations(organization_id,consortium_id,email,role) values('20000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','x@demo.invalid','OWNER'); raise exception 'Invitación sin permiso'; exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
if exists(select 1 from consortiums where id in ('30000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002') and name not in ('DEMO A','DEMO B')) then raise exception 'Datos alterados por rechazo'; end if;
end $$;
rollback;
select 'PASS: aislamiento ADMIN/OWNER/TENANT, MFA, escalamiento y rechazo sin cambios; fixtures revertidos' as verification;
