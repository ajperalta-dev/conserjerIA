-- The consortium FK determines the organization for every property record.
create or replace function private.property_write(target uuid) returns boolean
language sql stable security invoker set search_path='' as $$
 select ((select auth.jwt())->>'aal')='aal2'
   and public.has_permission(target,'consortium.update')
   and exists(select 1 from public.consortiums where id=target and archived_at is null);
$$;
revoke all on function private.property_write(uuid) from public;
grant execute on function private.property_write(uuid) to authenticated;

create table public.consortium_details (
 consortium_id uuid primary key references public.consortiums(id),
 cuit text check(cuit ~ '^[0-9]{11}$'), address text, province text, department text,
 locality text, postal_code text, latitude numeric check(latitude between -90 and 90),
 longitude numeric check(longitude between -180 and 180),
 construction_year smallint check(construction_year between 1600 and 2200),
 cadastral_code text, closing_month smallint check(closing_month between 1 and 12),
 closing_day smallint check(closing_day between 1 and 31),
 bylaws text, insurance text, emergency_contacts text,
 check((latitude is null)=(longitude is null)),
 check ((closing_month is null)=(closing_day is null) and
 (closing_day is null or closing_day<=extract(day from make_date(2000,closing_month,1)+interval '1 month - 1 day')))
);
create unique index consortium_details_cuit on public.consortium_details(cuit);
create table public.property_bank_details (
 consortium_id uuid primary key references public.consortiums(id),
 bank_name text, cbu text check(cbu ~ '^[0-9]{22}$'), bank_alias text,
 account_holder text
);
create table public.buildings (
 id uuid primary key default gen_random_uuid(), consortium_id uuid not null references public.consortiums(id),
 name text not null check(length(trim(name))>0), kind text not null check(kind in ('EDIFICIO','BLOQUE')),
 archived_at timestamptz,
 unique(consortium_id,id), unique(consortium_id,name)
);
create table public.floors (
 id uuid primary key default gen_random_uuid(), consortium_id uuid not null,
 building_id uuid not null, name text not null check(length(trim(name))>0), level integer not null,
 archived_at timestamptz, unique(consortium_id,id), unique(building_id,level),
 foreign key(consortium_id,building_id) references public.buildings(consortium_id,id)
);
create index on public.floors(consortium_id,building_id);
create table public.billing_groups (
 id uuid primary key default gen_random_uuid(), consortium_id uuid not null references public.consortiums(id),
 name text not null check(length(trim(name))>0), unique(consortium_id,id), unique(consortium_id,name)
);
create table public.units (
 id uuid primary key default gen_random_uuid(), consortium_id uuid not null,
 floor_id uuid not null, billing_group_id uuid,
 registry_code text not null check(length(trim(registry_code))>0), name text not null check(length(trim(name))>0),
 kind text not null check(kind in ('DEPARTAMENTO','DUPLEX','COCHERA','BAULERA','LOCAL','COMPLEMENTARIA','COMUN')),
 covered numeric(12,2) check(covered>=0), semi_covered numeric(12,2) check(semi_covered>=0),
 common_area numeric(12,2) check(common_area>=0), uncovered numeric(12,2) check(uncovered>=0),
 total_area numeric(13,2) generated always as (
  case when covered is null and semi_covered is null and common_area is null and uncovered is null then null
  else coalesce(covered,0)+coalesce(semi_covered,0)+coalesce(common_area,0)+coalesce(uncovered,0) end
 ) stored,
 cadastral_code text, meters text, archived_at timestamptz,
 unique(consortium_id,id), unique(consortium_id,registry_code),
 foreign key(consortium_id,floor_id) references public.floors(consortium_id,id),
 foreign key(consortium_id,billing_group_id) references public.billing_groups(consortium_id,id)
);
create index on public.units(consortium_id,floor_id);
create index on public.units(consortium_id,billing_group_id);
create table public.unit_relationships (
 id uuid primary key default gen_random_uuid(), consortium_id uuid not null, unit_id uuid not null,
 related_unit_id uuid not null, description text,
 check(unit_id<>related_unit_id),
 foreign key(consortium_id,unit_id) references public.units(consortium_id,id),
 foreign key(consortium_id,related_unit_id) references public.units(consortium_id,id)
);
create unique index unit_relationship_pair on public.unit_relationships(consortium_id,least(unit_id,related_unit_id),greatest(unit_id,related_unit_id));
create index on public.unit_relationships(consortium_id,unit_id);
create index on public.unit_relationships(consortium_id,related_unit_id);
create table public.unit_coefficients (
 id uuid primary key default gen_random_uuid(), consortium_id uuid not null, unit_id uuid not null,
 effective_from date not null, ownership numeric(9,6) not null check(ownership between 0 and 100),
 expenses numeric(9,6) not null check(expenses between 0 and 100),
 unique(unit_id,effective_from),
 foreign key(consortium_id,unit_id) references public.units(consortium_id,id)
);
create index on public.unit_coefficients(consortium_id,unit_id);
create table public.residents (
 id uuid primary key default gen_random_uuid(), consortium_id uuid not null references public.consortiums(id),
 user_id uuid, name text not null check(length(trim(name))>0), dni text check(dni ~ '^[0-9]{7,8}$'),
 cuit text check(cuit ~ '^[0-9]{11}$'), email text check(email=lower(email) and email like '%_@_%._%'),
 phone text, emergency_contact text, archived_at timestamptz, unique(consortium_id,id),
 foreign key(consortium_id,user_id) references public.consortium_members(consortium_id,user_id),
 unique(consortium_id,user_id)
);
create unique index residents_dni on public.residents(consortium_id,dni);
create unique index residents_cuit on public.residents(consortium_id,cuit);
create unique index residents_email on public.residents(consortium_id,email);

create table public.unit_ownerships (
 id uuid primary key default gen_random_uuid(), consortium_id uuid not null, unit_id uuid not null, resident_id uuid not null,
 starts_on date not null, ends_on date, share numeric(9,6) not null check(share>0 and share<=100),
 check(ends_on is null or ends_on>starts_on), unique(unit_id,resident_id,starts_on),
 foreign key(consortium_id,unit_id) references public.units(consortium_id,id),
 foreign key(consortium_id,resident_id) references public.residents(consortium_id,id)
);
create table public.occupancies (
 id uuid primary key default gen_random_uuid(), consortium_id uuid not null, unit_id uuid not null, resident_id uuid not null,
 kind text not null check(kind in ('PROPIETARIO','INQUILINO','OTRO')),
 starts_on date not null, ends_on date, check(ends_on is null or ends_on>starts_on),
 unique(unit_id,resident_id,starts_on), unique(consortium_id,unit_id,id),
 foreign key(consortium_id,unit_id) references public.units(consortium_id,id),
 foreign key(consortium_id,resident_id) references public.residents(consortium_id,id)
);
create table public.lease_contracts (
 id uuid primary key default gen_random_uuid(), consortium_id uuid not null, unit_id uuid not null,
 occupancy_id uuid not null, landlord_id uuid not null, reference text,
 starts_on date not null, ends_on date not null check(ends_on>starts_on),
 foreign key(consortium_id,unit_id,occupancy_id) references public.occupancies(consortium_id,unit_id,id),
 foreign key(consortium_id,landlord_id) references public.residents(consortium_id,id)
);
create index on public.lease_contracts(consortium_id,unit_id,occupancy_id);
create index on public.lease_contracts(consortium_id,landlord_id);
create table public.payment_responsibilities (
 id uuid primary key default gen_random_uuid(), consortium_id uuid not null, unit_id uuid not null, resident_id uuid not null,
 concept text not null check(concept in ('ORDINARIAS','EXTRAORDINARIAS','SERVICIOS')),
 starts_on date not null, ends_on date, check(ends_on is null or ends_on>starts_on),
 unique(unit_id,concept,resident_id,starts_on),
 foreign key(consortium_id,unit_id) references public.units(consortium_id,id),
 foreign key(consortium_id,resident_id) references public.residents(consortium_id,id)
);
do $$ declare t text;
begin
 foreach t in array array['unit_ownerships','occupancies','payment_responsibilities'] loop
  execute format('create index on public.%I(consortium_id,unit_id)',t);
  execute format('create index on public.%I(consortium_id,resident_id)',t);
 end loop;
end $$;

-- Defer the ownership check until all changes in a batch have been made. The
-- parent row lock serializes competing edits on the same unit.
create function private.validate_timeline() returns trigger language plpgsql set search_path='' as $$
declare invalid boolean;
begin
 perform 1 from public.units where id=new.unit_id for no key update;
 if TG_TABLE_NAME='unit_ownerships' then
  select exists(
   select 1 from public.unit_ownerships a join public.unit_ownerships b
    on a.unit_id=b.unit_id and a.id<>b.id and a.resident_id=b.resident_id
    and daterange(a.starts_on,a.ends_on) && daterange(b.starts_on,b.ends_on)
   where a.unit_id=new.unit_id
  ) or exists(
   select 1 from public.unit_ownerships point join public.unit_ownerships active
    on point.unit_id=active.unit_id and daterange(active.starts_on,active.ends_on) @> point.starts_on
   where point.unit_id=new.unit_id group by point.id having sum(active.share)>100
  ) into invalid;
 else
  select exists(select 1 from public.occupancies a join public.occupancies b
   on a.unit_id=b.unit_id and a.id<>b.id and a.resident_id=b.resident_id
   and daterange(a.starts_on,a.ends_on) && daterange(b.starts_on,b.ends_on)
   where a.unit_id=new.unit_id) into invalid;
 end if;
 if invalid then raise exception 'Los períodos se superponen o la titularidad supera 100%%.' using errcode='23514'; end if;
 return null;
end $$;
create constraint trigger ownership_timeline after insert or update on public.unit_ownerships deferrable initially deferred for each row execute function private.validate_timeline();
create constraint trigger occupancy_timeline after insert or update on public.occupancies deferrable initially deferred for each row execute function private.validate_timeline();

create function private.resident_self(target uuid) returns boolean
language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.residents r where r.id=target and r.user_id=(select auth.uid()) and r.archived_at is null);
$$;
create function private.unit_read(target uuid, target_consortium uuid) returns boolean
language sql stable security invoker set search_path='' as $$
 select public.has_permission(target_consortium,'property.read_all')
 or exists(select 1 from public.unit_ownerships o where o.unit_id=target and o.consortium_id=target_consortium
   and private.resident_self(o.resident_id) and daterange(o.starts_on,o.ends_on) @> (now() at time zone 'America/Argentina/Mendoza')::date)
 or exists(select 1 from public.occupancies o where o.unit_id=target and o.consortium_id=target_consortium
   and private.resident_self(o.resident_id) and daterange(o.starts_on,o.ends_on) @> (now() at time zone 'America/Argentina/Mendoza')::date);
$$;
revoke all on function private.resident_self(uuid),private.unit_read(uuid,uuid) from public;
grant execute on function private.resident_self(uuid),private.unit_read(uuid,uuid) to authenticated;
insert into public.role_permissions(role,permission) values
 ('ADMIN','property.read_all'),('ADMIN','property.people'),
 ('ACCOUNTANT','property.read_all'),('BOARD_MEMBER','property.read_all'),('MAINTENANCE','property.read_all');
create table public.property_files (
 id uuid primary key default gen_random_uuid(), consortium_id uuid not null references public.consortiums(id),
 unit_id uuid, kind text not null check(kind in ('FOTO','REGLAMENTO','SEGURO','UNIDAD')),
 label text not null, path text not null unique,
 check((kind='UNIDAD')=(unit_id is not null)),
 check(path like consortium_id::text || '/property/' || coalesce(unit_id::text,'consortium') || '/%'),
 foreign key(consortium_id,unit_id) references public.units(consortium_id,id)
);
create index on public.property_files(consortium_id,unit_id);
create table public.property_history (
 id uuid primary key default gen_random_uuid(), consortium_id uuid not null references public.consortiums(id),
 actor_id uuid references auth.users(id), entity text not null, entity_id uuid not null,
 operation text not null, fields text[] not null, created_at timestamptz not null default now()
);
create index on public.property_history(consortium_id,entity_id,created_at);
create index on public.property_history(actor_id);

do $$ declare t text; predicate text;
begin
 foreach t in array array['consortium_details','property_bank_details','buildings','floors','billing_groups','units','unit_relationships','unit_coefficients','residents','unit_ownerships','occupancies','lease_contracts','payment_responsibilities','property_files','property_history'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public, anon, authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  predicate := case t
   when 'consortium_details' then 'public.has_permission(consortium_id,''consortium.read'')'
   when 'buildings' then 'public.has_permission(consortium_id,''consortium.read'')'
   when 'floors' then 'public.has_permission(consortium_id,''consortium.read'')'
   when 'units' then 'private.unit_read(id,consortium_id)'
   when 'unit_coefficients' then 'private.unit_read(unit_id,consortium_id)'
   when 'unit_relationships' then 'private.unit_read(unit_id,consortium_id) and private.unit_read(related_unit_id,consortium_id)'
   when 'billing_groups' then 'public.has_permission(consortium_id,''property.read_all'')'
   when 'residents' then 'public.has_permission(consortium_id,''property.people'') or user_id=(select auth.uid())'
   when 'unit_ownerships' then 'public.has_permission(consortium_id,''property.people'') or private.resident_self(resident_id)'
   when 'occupancies' then 'public.has_permission(consortium_id,''property.people'') or private.resident_self(resident_id)'
   when 'payment_responsibilities' then 'public.has_permission(consortium_id,''property.people'') or private.resident_self(resident_id)'
   when 'property_files' then 'case when unit_id is null then public.has_permission(consortium_id,''consortium.read'') else public.has_permission(consortium_id,''property.people'') or (not public.has_permission(consortium_id,''property.read_all'') and private.unit_read(unit_id,consortium_id)) end'
   else 'public.has_permission(consortium_id,''property.people'')'
  end;
  execute format('create policy property_read on public.%I for select to authenticated using (%s)',t,predicate);
  if t <> 'property_history' then
   execute format('grant insert on public.%I to authenticated',t);
   execute format('create policy property_insert on public.%I for insert to authenticated with check (private.property_write(consortium_id))',t);
   if t not in ('unit_coefficients','property_files') then
    execute format('create policy property_edit on public.%I for update to authenticated using (private.property_write(consortium_id)) with check (private.property_write(consortium_id))',t);
   end if;
  end if;
 end loop;
end $$;
grant update(cuit,address,province,department,locality,postal_code,latitude,longitude,construction_year,cadastral_code,closing_month,closing_day,bylaws,insurance,emergency_contacts) on public.consortium_details to authenticated;
grant update(bank_name,cbu,bank_alias,account_holder) on public.property_bank_details to authenticated;
grant update(name,kind,archived_at) on public.buildings to authenticated;
grant update(name,level,archived_at) on public.floors to authenticated;
grant update(name) on public.billing_groups to authenticated;
grant update(name,kind,floor_id,billing_group_id,registry_code,covered,semi_covered,common_area,uncovered,cadastral_code,meters,archived_at) on public.units to authenticated;
grant update(description) on public.unit_relationships to authenticated;
grant update(name,dni,cuit,email,phone,emergency_contact,archived_at) on public.residents to authenticated;
grant update(ends_on) on public.unit_ownerships,public.occupancies,public.payment_responsibilities to authenticated;
grant update(reference,ends_on) on public.lease_contracts to authenticated;
grant delete on public.unit_relationships to authenticated;
create policy unlink on public.unit_relationships for delete to authenticated using(private.property_write(consortium_id));
revoke insert on public.residents from authenticated;
grant insert(consortium_id,name,dni,cuit,email,phone,emergency_contact) on public.residents to authenticated;

create function private.log_property() returns trigger language plpgsql security definer set search_path='' as $$
declare snapshot jsonb := case when TG_OP='DELETE' then to_jsonb(old) else to_jsonb(new) end;
declare previous jsonb := case when TG_OP='INSERT' then '{}'::jsonb else to_jsonb(old) end;
declare keys text[];
begin
 select array_agg(k order by k) into keys from jsonb_object_keys(snapshot) k
 where TG_OP='DELETE' or snapshot->k is distinct from previous->k;
 if keys is not null then
  insert into public.property_history(consortium_id,actor_id,entity,entity_id,operation,fields)
  values(coalesce((snapshot->>'consortium_id')::uuid,(snapshot->>'id')::uuid),auth.uid(),TG_TABLE_NAME,
    coalesce((snapshot->>'id')::uuid,(snapshot->>'consortium_id')::uuid),TG_OP,keys);
 end if;
 return null;
end $$;
revoke all on function private.log_property() from public;
do $$ declare t text; begin
 foreach t in array array['consortiums','consortium_details','property_bank_details','buildings','floors','billing_groups','units','unit_relationships','unit_coefficients','residents','unit_ownerships','occupancies','lease_contracts','payment_responsibilities','property_files'] loop
  execute format('create trigger property_audit after insert or update or delete on public.%I for each row execute function private.log_property()',t);
 end loop;
end $$;

create function private.create_property_consortium(org uuid, label text) returns uuid
language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 if auth.uid() is null or ((select auth.jwt())->>'aal') is distinct from 'aal2'
  or not exists(select 1 from public.organization_members m join public.organizations o on o.id=m.organization_id
   where m.organization_id=org and m.user_id=auth.uid() and m.role='ADMIN' and o.archived_at is null)
 then raise insufficient_privilege; end if;
 insert into public.consortiums(organization_id,name) values(org,trim(label)) returning id into target;
 insert into public.consortium_members(organization_id,consortium_id,user_id,role) values(org,target,auth.uid(),'ADMIN');
 return target;
end $$;
revoke all on function private.create_property_consortium(uuid,text) from public;
grant execute on function private.create_property_consortium(uuid,text) to authenticated;
create function public.create_property_consortium(org uuid,label text) returns uuid
language sql security invoker set search_path='' as $$ select private.create_property_consortium(org,label); $$;
revoke all on function public.create_property_consortium(uuid,text) from public, anon;
grant execute on function public.create_property_consortium(uuid,text) to authenticated;
grant update(archived_at) on public.consortiums to authenticated;

alter table public.invitations add column resident_id uuid;
alter table public.invitations add foreign key(consortium_id,resident_id) references public.residents(consortium_id,id);
create index on public.invitations(consortium_id,resident_id);
grant insert(resident_id) on public.invitations to authenticated;
alter policy invite on public.invitations with check(
 created_by=(select auth.uid()) and public.has_permission(consortium_id,'members.invite') and ((select auth.jwt())->>'aal')='aal2'
 and (resident_id is null or exists(select 1 from public.residents r where r.id=resident_id
   and r.consortium_id=invitations.consortium_id and r.email=invitations.email and r.archived_at is null and r.user_id is null))
);
create function private.link_portal_resident() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.resident_id is not null and old.accepted_at is null and new.accepted_at is not null then
  update public.residents set user_id=auth.uid() where id=new.resident_id and email=new.email and user_id is null and archived_at is null;
  if not found then raise exception 'La ficha de residente cambió. Solicitá una nueva invitación.'; end if;
 end if;
 return null;
end $$;
revoke all on function private.link_portal_resident() from public;
create trigger link_portal_resident after update of accepted_at on public.invitations for each row execute function private.link_portal_resident();

create policy property_upload on storage.objects for insert to authenticated with check(
 bucket_id='consortium-private' and split_part(name,'/',2)='property'
 and private.property_write(case when split_part(name,'/',1) ~ '^[0-9a-f-]{36}$' and pg_input_is_valid(split_part(name,'/',1),'uuid')
 then split_part(name,'/',1)::uuid end)
);
create policy property_download on storage.objects for select to authenticated using(
 bucket_id='consortium-private' and exists(select 1 from public.property_files f where f.path=name)
);
create policy property_cleanup on storage.objects for delete to authenticated using(
 bucket_id='consortium-private' and split_part(name,'/',2)='property'
 and private.property_write(case when pg_input_is_valid(split_part(name,'/',1),'uuid') then split_part(name,'/',1)::uuid end)
);

-- Staff can see incomplete uploads for cleanup. Residents still need a metadata
-- row and RLS access to the document's unit.
alter policy property_download on storage.objects using(
 bucket_id='consortium-private' and (
 exists(select 1 from public.property_files f where f.path=name) or
 (split_part(name,'/',2)='property' and private.property_write(
  case when pg_input_is_valid(split_part(name,'/',1),'uuid') then split_part(name,'/',1)::uuid end))
 )
);
create function private.check_lease() returns trigger language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from public.occupancies o where o.id=new.occupancy_id and o.kind='INQUILINO'
  and daterange(o.starts_on,o.ends_on) @> daterange(new.starts_on,new.ends_on))
 or not exists(select 1 from public.unit_ownerships o where o.unit_id=new.unit_id and o.resident_id=new.landlord_id
  and daterange(o.starts_on,o.ends_on) @> new.starts_on)
 then raise exception 'El contrato debe corresponder a una ocupación de alquiler y a un titular.' using errcode='23514'; end if;
 return new;
end $$;
create trigger validate_lease before insert or update on public.lease_contracts for each row execute function private.check_lease();
alter policy property_read on public.lease_contracts using(
 public.has_permission(consortium_id,'property.people') or private.resident_self(landlord_id)
 or exists(select 1 from public.occupancies o where o.id=occupancy_id and private.resident_self(o.resident_id))
);
create function private.property_admins(target uuid) returns table(user_id uuid, display_name text)
language sql stable security definer set search_path='' as $$
 select m.user_id,coalesce(nullif(p.display_name,''),'Administrador')
 from public.consortium_members m left join public.profiles p on p.id=m.user_id
 where auth.uid() is not null and m.consortium_id=target and m.role='ADMIN'
 and exists(select 1 from public.consortium_members caller where caller.consortium_id=target and caller.user_id=auth.uid());
$$;
revoke all on function private.property_admins(uuid) from public;
grant execute on function private.property_admins(uuid) to authenticated;
create function public.property_admins(target uuid) returns table(user_id uuid,display_name text)
language sql stable security invoker set search_path='' as $$ select * from private.property_admins(target); $$;
revoke all on function public.property_admins(uuid) from public, anon;
grant execute on function public.property_admins(uuid) to authenticated;

create function private.validate_archive() returns trigger language plpgsql set search_path='' as $$
begin
 if new.archived_at is null then return new; end if;
 if TG_TABLE_NAME='buildings' and exists(select 1 from public.floors where building_id=new.id and archived_at is null)
 or TG_TABLE_NAME='floors' and exists(select 1 from public.units where floor_id=new.id and archived_at is null)
 then raise exception 'Archivá primero los registros dependientes.' using errcode='23514'; end if;
 return new;
end $$;
create trigger building_archive before update of archived_at on public.buildings for each row execute function private.validate_archive();
create trigger floor_archive before update of archived_at on public.floors for each row execute function private.validate_archive();
create function private.active_parent() returns trigger language plpgsql set search_path='' as $$
declare parent_archived timestamptz;
begin
 if new.archived_at is not null then return new; end if;
 if TG_TABLE_NAME='floors' then
  select archived_at into parent_archived from public.buildings where id=new.building_id for share;
 else
  select archived_at into parent_archived from public.floors where id=new.floor_id for share;
 end if;
 if parent_archived is not null then raise exception 'El registro superior está archivado.' using errcode='23514'; end if;
 return new;
end $$;
create trigger floor_active_parent before insert or update on public.floors for each row execute function private.active_parent();
create trigger unit_active_parent before insert or update on public.units for each row execute function private.active_parent();
