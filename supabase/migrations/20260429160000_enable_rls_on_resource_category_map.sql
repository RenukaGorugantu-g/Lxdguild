-- Harden internal resource mapping data so it is not publicly accessible.
-- This table is used for server-side catalog synchronization and should not be
-- readable or writable from anon/authenticated browser clients.

ALTER TABLE public.resource_category_map ENABLE ROW LEVEL SECURITY;
