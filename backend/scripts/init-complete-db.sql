-- Complete Database Initialization Script for MyRoom Backend
-- This script creates all necessary data for a fully functional system

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
  'admin_super_' || lower(replace(cast(gen_random_uuid() as text), '-', '')) as id,
  'admin@petarainsoft.com' as email,
  'Super Administrator' as name,
  '$2a$12$NhZmqzbL6mt8fqY0phFr9eQ1ymUaixRCuom7K1zUpthIMk6W2rgCK' as password_hash, -- Admin123!
  'SUPER_ADMIN' as role,
  'ACTIVE' as status,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (
  SELECT 1 FROM "admins" WHERE email = 'admin@petarainsoft.com'
);

-- =========================
-- 2. CREATE RESOURCE CATEGORIES (3D Resources)
-- =========================
WITH top_categories AS (
    INSERT INTO "resource_categories" (
        id, name, description, metadata,
        level, path,
        created_at, updated_at
    )
    SELECT
        'cat_' || lower(replace(cast(gen_random_uuid() AS text), '-', ''))            AS id,
        t.name                                                                       AS name,
        t.description                                                                AS description,
        '{}'::jsonb                                                                  AS metadata,
        0                                                                            AS level,
        lower(t.name)                                                                       AS path,
        NOW(), NOW()
    FROM (VALUES
        ('Furniture',  'Tất cả nội thất đặt trong phòng'),
        ('Lighting',   'Đèn và thiết bị chiếu sáng'),
        ('Decorations','Đồ trang trí, tạo điểm nhấn'),
        ('Premium',    'Nội dung cao cấp')
    ) AS t(name, description)
    ON CONFLICT (name, parent_id) DO NOTHING
    RETURNING id, name, path, level
),

-- Level 1 categories
level1 AS (
    INSERT INTO "resource_categories" (
        id, name, description, metadata,
        parent_id, level, path,
        created_at, updated_at
    )
    SELECT
        'cat_' || lower(replace(cast(gen_random_uuid() AS text), '-', '')),
        s.name,
        s.description,
        '{}'::jsonb,
        p.id,                    -- parent_id
        p.level + 1,             -- level = 1
        Lower(p.path || '-' || s.name), -- path = parent_path-name
        NOW(), NOW()
    FROM (VALUES
        -- Furniture
        ('Seating',  'Chairs, sofas, stools',         'Furniture'),
        ('Tables',   'All types of tables',           'Furniture'),
        ('Storage',  'Cabinets, shelves, bookcases',  'Furniture'),
        -- Lighting
        ('Ceiling',  'Ceiling lights',                'Lighting'),
        ('Wall',     'Wall-mounted lights',           'Lighting'),
        ('Floor',    'Standing lamps',                'Lighting'),
        -- Decorations
        ('Artwork',  'Paintings and sculptures',      'Decorations'),
        ('Plants',   'Decorative plants',             'Decorations'),
        ('Rugs',     'Carpets and rugs',             'Decorations')
    ) AS s(name, description, parent_name)
    JOIN top_categories p ON p.name = s.parent_name
    ON CONFLICT (name, parent_id) DO NOTHING
    RETURNING id, name, path, level
)

-- Level 2 categories
INSERT INTO "resource_categories" (
    id, name, description, metadata,
    parent_id, level, path,
    created_at, updated_at
)
SELECT
    'cat_' || lower(replace(cast(gen_random_uuid() AS text), '-', '')),
    s.name,
    s.description,
    '{}'::jsonb,
    p.id,                    -- parent_id
    p.level + 1,             -- level = 2
    LOWER(p.path || '-' || s.name),
    NOW(), NOW()
FROM (VALUES
    -- Seating
    ('Sofas',          'Các loại sofa',              'Seating'),
    ('Armchairs',      'Ghế bành',                   'Seating'),
    ('Office Chairs',  'Ghế văn phòng',              'Seating'),
    -- Tables
    ('Coffee Tables',  'Bàn trà',                    'Tables'),
    ('Side Tables',    'Bàn đầu giường / góc',       'Tables'),
    ('Dining Tables',  'Bàn ăn',                     'Tables'),
    -- Storage
    ('Bookshelves',    'Kệ sách',                    'Storage'),
    ('Cabinets',       'Tủ đa dụng',                 'Storage'),
    ('Wardrobes',      'Tủ quần áo',                 'Storage'),
    -- Ceiling
    ('Chandeliers',    'Đèn chùm',                   'Ceiling'),
    ('Pendant Lights', 'Đèn thả trần',               'Ceiling'),
    -- Wall
    ('Wall Sconces',   'Đèn hắt tường',              'Wall'),
    ('Picture Lights', 'Đèn tranh',                  'Wall'),
    -- Floor
    ('Floor Lamps',    'Đèn đứng truyền thống',      'Floor'),
    ('Tripod Lamps',   'Đèn đứng ba chân',           'Floor'),
    -- Artwork
    ('Paintings',      'Tranh vẽ',                   'Artwork'),
    ('Sculptures',     'Tượng trang trí',            'Artwork'),
    -- Plants
    ('Potted Plants',  'Cây trồng chậu',             'Plants'),
    ('Hanging Plants', 'Cây treo',                   'Plants'),
    -- Rugs
    ('Area Rugs',      'Thảm diện tích lớn',         'Rugs'),
    ('Runners',        'Thảm runner hành lang',      'Rugs')
) AS s(name, description, parent_name)
JOIN level1 p ON p.name = s.parent_name
ON CONFLICT (name, parent_id) DO NOTHING;

-- =========================
-- 3. CREATE AVATAR CATEGORIES
-- =========================

-- Gender categories
WITH gender_categories AS (
    INSERT INTO "avatar_categories" (
        id, name, description, category_type,
        level, path, sort_order,
        created_at, updated_at
    )
    SELECT
        'avatar_cat_' || lower(replace(cast(gen_random_uuid() AS text), '-', '')) as id,
        g.name,
        g.description,
        'gender' as category_type,
        0 as level,
        lower(g.name) as path,
        g.sort_order,
        NOW(), NOW()
    FROM (VALUES
        ('Male', 'Avatar nam giới', 1),
        ('Female', 'Avatar nữ giới', 2)
    ) AS g(name, description, sort_order)
    ON CONFLICT (name, parent_id) DO NOTHING
    RETURNING id, name, path
)

-- Part type categories for each gender
INSERT INTO "avatar_categories" (
    id, name, description, category_type,
    parent_id, level, path, sort_order,
    created_at, updated_at
)
SELECT
    'avatar_cat_' || lower(replace(cast(gen_random_uuid() AS text), '-', '')) as id,
    p.name,
    p.description,
    'part_type' as category_type,
    g.id as parent_id,
    1 as level,
    LOWER(g.path || '-' || p.name) as path,
    p.sort_order,
    NOW(), NOW()
FROM (VALUES
    ('Body', 'Cơ thể avatar', 1),
    ('Hair', 'Tóc và kiểu tóc', 2),
    ('Top', 'Áo và trang phục trên', 3),
    ('Bottom', 'Quần và trang phục dưới', 4),
    ('Shoes', 'Giày dép', 5),
    ('Accessory', 'Phụ kiện', 6),
    ('Fullset', 'Bộ trang phục hoàn chỉnh', 7)
) AS p(name, description, sort_order)
CROSS JOIN gender_categories g
ON CONFLICT (name, parent_id) DO NOTHING;

-- =========================
-- 4. CREATE SAMPLE DEVELOPERS AND PROJECTS
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
        'Petarain Developer' as name,
        '$2a$12$NhZmqzbL6mt8fqY0phFr9eQ1ymUaixRCuom7K1zUpthIMk6W2rgCK' as password_hash, -- Admin123!
        'ACTIVE' as status,
        NOW(), NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM "developers" WHERE email = 'anhnguyen@petarainsoft.com'
    )
    RETURNING id, email
)

-- Create sample project for the developer
INSERT INTO "projects" (
    id, name, description, status, developer_id,
    created_at, updated_at
)
SELECT
    'proj_' || lower(replace(cast(gen_random_uuid() AS text), '-', '')) as id,
    'Petarain MyRoom Landing-Page Project' as name,
    'Dự án demo cho developer mẫu' as description,
    'ACTIVE' as status,
    d.id as developer_id,
    NOW(), NOW()
FROM sample_developer d
WHERE NOT EXISTS (
    SELECT 1 FROM "projects" p 
    JOIN sample_developer sd ON p.developer_id = sd.id 
    WHERE p.name = 'Petarain MyRoom Landing-Page Project'
);

-- =========================
-- 5. CREATE SAMPLE API KEYS
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
  AND p.name = 'Petarain MyRoom Landing-Page Project'
  AND NOT EXISTS (
    SELECT 1 FROM "api_keys" ak 
    WHERE ak.key = 'pk_9dd7a67c7c6d69c7f5ae603bd78656944d61667257ce60c59a676d35ccb6a16f'
  );

-- =========================
-- 6. SEED AVATAR RESOURCES
-- =========================

\i /app/scripts/seed-avatar-resources.sql

-- =========================
-- 7. PRINT SUCCESS MESSAGES
-- =========================

DO $$
DECLARE
    admin_count INTEGER;
    category_count INTEGER;
    avatar_category_count INTEGER;
    developer_count INTEGER;
    project_count INTEGER;
    api_key_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM "admins";
    SELECT COUNT(*) INTO category_count FROM "resource_categories";
    SELECT COUNT(*) INTO avatar_category_count FROM "avatar_categories";
    SELECT COUNT(*) INTO developer_count FROM "developers";
    SELECT COUNT(*) INTO project_count FROM "projects";
    SELECT COUNT(*) INTO api_key_count FROM "api_keys";
    
    RAISE NOTICE '🎉 Database initialization completed successfully!';
    RAISE NOTICE '📊 Summary:';
    RAISE NOTICE '   - Admins: %', admin_count;
    RAISE NOTICE '   - Resource Categories: %', category_count;
    RAISE NOTICE '   - Avatar Categories: %', avatar_category_count;
    RAISE NOTICE '   - Developers: %', developer_count;
    RAISE NOTICE '   - Projects: %', project_count;
    RAISE NOTICE '   - API Keys: %', api_key_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Default Credentials:';
    RAISE NOTICE '   Super Admin:';
    RAISE NOTICE '     Email: admin@petarainsoft.com';
    RAISE NOTICE '     Password: Admin123!';
    RAISE NOTICE '   Demo Developer:';
    RAISE NOTICE '     Email: demo@developer.com';
    RAISE NOTICE '     Password: Admin123!';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Please change default passwords after first login!';
END $$;