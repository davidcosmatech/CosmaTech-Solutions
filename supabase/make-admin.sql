-- Run after schema.sql, replacing the placeholder with the exact email used
-- for the website account that should receive owner/admin access.
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('REPLACE_WITH_WEBSITE_SIGN_IN_EMAIL')
on conflict (user_id) do nothing;
