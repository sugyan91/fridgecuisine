-- Seed 92 fake cooks for community realism.
-- Deterministic UUIDs so re-runs are idempotent (ON CONFLICT DO NOTHING).
WITH names AS (
  SELECT
    n AS idx,
    (ARRAY['Aiko','Marco','Sofia','Liam','Priya','Jin','Olivia','Kwame','Noor','Diego','Anika','Mateo','Leila','Hiro','Chiara','Tom','Ines','Yuki','Omar','Zara','Felix','Maya','Arjun','Ngozi','Pierre','Elena','Hugo','Sana','Theo','Amara','Ravi','Lucia','Kenji','Aya','Idris','Beatriz','Niko','Mira','Cesar','Tara','Bruno','Lin','Esme','Rashid','Yara','Jonas','Adaeze','Sara','Oskar','Maria','Tomas','Inga','Kofi','Daria','Hassan','Marta','Mei','Pedro','Anya','Rohan','Naima','Eitan','Saskia','Vikram','Camila','Otto','Aroha','Bashir','Kalea','Tariq','Iris','Sammy','Hana','Luca','Asha','Dimitri','Sienna','Kai','Petra','Joaquin','Nour','Ayla','Tobias','Renata','Soren','Layla','Caleb','Mina','Diallo','Eun','Rafael','Wren','Ezra'])[((n - 1) % 92) + 1] AS first_name,
    (ARRAY['Tanaka','Rossi','Mendez','Obrien','Patel','Park','Carter','Boateng','Khan','Vega','Singh','Silva','Haddad','Sato','Romano','Larsen','Costa','Mori','Nasser','Hussein','Becker','Garcia','Iyer','Okafor','Dubois','Petrov','Martin','Yilmaz','Schmidt','Adeyemi','Kapoor','Ferrari','Yamamoto','Nakamura','Diallo','Mendes','Janev','Voss','Lopez','Kerr','Bianchi','Wong','Ortega','Karim','Chen','Hoffmann','Eze','Okonkwo','Andersen','Reyes'])[((n * 7 - 1) % 50) + 1] AS last_name
  FROM generate_series(1, 92) AS n
),
users AS (
  SELECT
    idx,
    first_name,
    last_name,
    lower(first_name || last_name) || idx::text AS username,
    first_name || ' ' || last_name AS display_name,
    ('00000000-0000-0000-0000-' || lpad(to_hex(1000000 + idx), 12, '0'))::uuid AS user_id
  FROM names
)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user, is_anonymous
)
SELECT
  u.user_id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated',
  u.username || '@seed.fridgecuisine.local',
  '', now(), now(), now(),
  '{"provider":"seed"}'::jsonb,
  jsonb_build_object('display_name', u.display_name, 'username', u.username),
  false, false, false
FROM users u
ON CONFLICT (id) DO NOTHING;

-- Backfill avatar URLs on profiles created by the handle_new_user trigger.
UPDATE public.profiles p
SET avatar_url = 'https://i.pravatar.cc/200?u=' || p.username
WHERE p.user_id IN (
  SELECT ('00000000-0000-0000-0000-' || lpad(to_hex(1000000 + n), 12, '0'))::uuid
  FROM generate_series(1, 92) AS n
)
AND p.avatar_url IS NULL;