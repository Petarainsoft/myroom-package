-- Minimal Database Initialization Script for MyRoom Backend
-- This script creates only essential data without categories and seed scripts

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- 1. CREATE SUPER ADMIN
-- =========================
INSERT INTO "admins" (
  id,
  email,
  name,
  password_hash,
  role,
  status,
  created_at,
  updated_at
)
SELECT 
  'admin_' || lower(replace(cast(gen_random_uuid() AS text), '-', '')) as id,
  'admin@petarainsoft.com' as email,
  'Super Admin' as name,
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' as password_hash, -- password: password
  'SUPER_ADMIN' as role,
  'ACTIVE' as status,
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "admins" WHERE email = 'admin@petarainsoft.com'
);

-- =========================
-- 2. CREATE SAMPLE DEVELOPER AND PROJECT
-- =========================

-- Create sample developer
WITH sample_developer AS (
    INSERT INTO "developers" (
        id, email, name, password_hash, status,
        created_at, updated_at
    )
    SELECT
        'dev_' || lower(replace(cast(gen_random_uuid() AS text), '-', '')) as id,
        'anhnguyen@petarainsoft.com' as email,
        'Anh Nguyen' as name,
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' as password_hash, -- password: Admin123!
        'ACTIVE' as status,
        NOW(), NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM "developers" WHERE email = 'anhnguyen@petarainsoft.com'
    )
    RETURNING id, email
)
-- Create sample project
INSERT INTO "projects" (
    id, name, description, status, developer_id,
    created_at, updated_at
)
SELECT
    'proj_' || lower(replace(cast(gen_random_uuid() AS text), '-', '')) as id,
    'Petarain MyRoom Demo' as name,
    'Demo project for MyRoom 3D resource management' as description,
    'ACTIVE' as status,
    d.id as developer_id,
    NOW(), NOW()
FROM sample_developer d
WHERE NOT EXISTS (
    SELECT 1 FROM "projects" p 
    JOIN "developers" dev ON p.developer_id = dev.id 
    WHERE dev.email = 'anhnguyen@petarainsoft.com'
);

-- =========================
-- 3. CREATE SAMPLE API KEY
-- =========================

INSERT INTO "api_keys" (
    id, key, name, scopes, status, project_id,
    created_at, updated_at
)
SELECT
    'api_' || lower(replace(cast(gen_random_uuid() AS text), '-', '')) as id,
    'pk_9dd7a67c7c6d69c7f5ae603bd78656944d61667257ce60c59a676d35ccb6a16f' as key,
    'Petarain MyRoom API Key' as name,
    ARRAY['resources:read', 'avatar:read', 'manifests:read', 'developer:read', 'project:read', 'resource:read', 'manifest:read'] as scopes,
    'ACTIVE' as status,
    p.id as project_id,
    NOW(), NOW()
FROM "projects" p
JOIN "developers" d ON p.developer_id = d.id
WHERE d.email = 'anhnguyen@petarainsoft.com'
AND NOT EXISTS (
    SELECT 1 FROM "api_keys" ak
    JOIN "projects" proj ON ak.project_id = proj.id
    JOIN "developers" dev ON proj.developer_id = dev.id
    WHERE dev.email = 'anhnguyen@petarainsoft.com'
);

-- =========================
-- 4. SUMMARY
-- =========================

DO $$
DECLARE
    admin_count INTEGER;
    developer_count INTEGER;
    project_count INTEGER;
    api_key_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM "admins";
    SELECT COUNT(*) INTO developer_count FROM "developers";
    SELECT COUNT(*) INTO project_count FROM "projects";
    SELECT COUNT(*) INTO api_key_count FROM "api_keys";
    
    RAISE NOTICE '🎉 Minimal database initialization completed successfully!';
    RAISE NOTICE '📊 Summary:';
    RAISE NOTICE '   - Admins: %', admin_count;
    RAISE NOTICE '   - Developers: %', developer_count;
    RAISE NOTICE '   - Projects: %', project_count;
    RAISE NOTICE '   - API Keys: %', api_key_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Default Login Credentials:';
    RAISE NOTICE '   Super Admin: admin@petarainsoft.com / password';
    RAISE NOTICE '   Demo Developer: anhnguyen@petarainsoft.com / Admin123!';
    RAISE NOTICE '   Demo API Key: pk_9dd7a67c7c6d69c7f5ae603bd78656944d61667257ce60c59a676d35ccb6a16f';
END $$;