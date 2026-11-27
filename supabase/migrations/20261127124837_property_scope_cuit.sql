-- Avoid revealing another organization's CUIT through a duplicate-key error.
drop index public.consortium_details_cuit;
