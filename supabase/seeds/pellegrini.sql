-- Run as database operator. Fictitious resident records only.
do $$
declare
 org constant uuid := '9bca0802-8020-4000-8000-000000000001';
 consortium constant uuid := '9bca0802-8020-4000-8000-000000000002';
 building constant uuid := '9bca0802-8020-4000-8000-000000000003';
 group_ids uuid[] := '{}';
 level_ids uuid[] := '{}';
 unit_ids uuid[] := '{}';
 item record;
 generated uuid;
 person uuid;
begin
 if exists(select 1 from public.consortiums where id=consortium) then return; end if;
 insert into public.organizations(id,name) values(org,'Administración demostración');
 insert into public.consortiums(id,organization_id,name) values(consortium,org,'Consorcio Pellegrini 802');
 insert into public.consortium_details(consortium_id,address,province,department,locality)
 values(consortium,'Pellegrini 802','Mendoza','Godoy Cruz','Godoy Cruz');
 insert into public.buildings(id,consortium_id,name,kind) values(building,consortium,'Edificio principal','EDIFICIO');
 for n in 0..2 loop
  insert into public.floors(consortium_id,building_id,level,name) values(consortium,building,n,case n when 0 then 'Planta baja' when 1 then 'Primer piso' else 'Segundo piso' end) returning id into generated;
  level_ids := array_append(level_ids,generated);
 end loop;
 for n in 1..6 loop
  insert into public.billing_groups(consortium_id,name) values(consortium,case n when 5 then 'Dúplex 1' when 6 then 'Dúplex 2' else 'Unidad '||n end) returning id into generated;
  group_ids := array_append(group_ids,generated);
 end loop;
 for item in select * from (values
  (1,'Planta baja 0-1 con cochera 06','DEPARTAMENTO',0,1,12.14),
  (2,'Planta baja 0-2','DEPARTAMENTO',0,2,22.52),
  (3,'Primer piso 1-1','DEPARTAMENTO',1,3,10.61),
  (4,'Segundo piso 2-1 con cochera 05','DEPARTAMENTO',2,4,14.12),
  (5,'Dúplex 1-2 / 2-2','DUPLEX',1,5,17.01),
  (6,'Dúplex 1-3 / 2-3','DUPLEX',1,6,17.05),
  (7,'Cochera 03','COCHERA',0,5,3.22),
  (8,'Cochera 04','COCHERA',0,6,3.33)
 ) as demo(registry,label,kind,level,group_no,coefficient) order by registry loop
  insert into public.units(consortium_id,floor_id,billing_group_id,registry_code,name,kind)
  values(consortium,level_ids[item.level+1],group_ids[item.group_no],item.registry::text,item.label,item.kind)
  returning id into generated;
  unit_ids:=array_append(unit_ids,generated);
  insert into public.unit_coefficients(consortium_id,unit_id,effective_from,ownership,expenses)
  values(consortium,generated,date '2026-01-01',item.coefficient,item.coefficient);
 end loop;
 insert into public.unit_relationships(consortium_id,unit_id,related_unit_id,description)
 values(consortium,unit_ids[5],unit_ids[7],'Cochera vinculada'),(consortium,unit_ids[6],unit_ids[8],'Cochera vinculada');
 for n in 1..6 loop
  insert into public.residents(consortium_id,name,email)
  values(consortium,'Titular ficticio '||n,'titular'||n||'@pellegrini.demo.invalid') returning id into person;
  insert into public.unit_ownerships(consortium_id,unit_id,resident_id,starts_on,share)
  values(consortium,unit_ids[n],person,date '2026-01-01',100);
  if n=5 or n=6 then
   insert into public.unit_ownerships(consortium_id,unit_id,resident_id,starts_on,share)
   values(consortium,unit_ids[n+2],person,date '2026-01-01',100);
  end if;
  if n<>2 then
   insert into public.occupancies(consortium_id,unit_id,resident_id,kind,starts_on)
   values(consortium,unit_ids[n],person,'PROPIETARIO',date '2026-01-01');
  end if;
 end loop;
 insert into public.residents(consortium_id,name,email)
 values(consortium,'Inquilino ficticio 1','inquilino1@pellegrini.demo.invalid') returning id into person;
 insert into public.occupancies(consortium_id,unit_id,resident_id,kind,starts_on)
 values(consortium,unit_ids[2],person,'INQUILINO',date '2026-01-01');
end $$;
