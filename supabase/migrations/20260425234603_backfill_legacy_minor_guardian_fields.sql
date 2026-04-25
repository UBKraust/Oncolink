update public.clients
set
  parent_1_name = coalesce(parent_1_name, parent_name),
  parent_1_phone = coalesce(parent_1_phone, parent_phone),
  emergency_contact_name = coalesce(emergency_contact_name, parent_1_name, parent_name),
  emergency_contact_phone = coalesce(emergency_contact_phone, parent_1_phone, parent_phone),
  emergency_contact_relation = coalesce(emergency_contact_relation, 'Părinte')
where is_minor = true
  and (
    (parent_1_name is null and parent_name is not null)
    or (parent_1_phone is null and parent_phone is not null)
    or emergency_contact_name is null
    or emergency_contact_phone is null
    or emergency_contact_relation is null
  );
