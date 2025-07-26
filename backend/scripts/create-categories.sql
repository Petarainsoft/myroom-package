-- Bảo đảm tiện ích sinh UUID đã sẵn sàng
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- 1️⃣  CẤP 0  (TOP-LEVEL)
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
        t.name                                                                       AS path,
        NOW(), NOW()
    FROM (VALUES
        ('Furniture',  'Tất cả nội thất đặt trong phòng'),
        ('Lighting',   'Đèn và thiết bị chiếu sáng'),
        ('Decorations','Đồ trang trí, tạo điểm nhấn')
    ) AS t(name, description)
    ON CONFLICT (name, parent_id) DO NOTHING
    RETURNING id, name, path, level
),

-- =========================
-- 2️⃣  CẤP 1  (SUB-CATEGORY)
-- =========================
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
        p.level + 1,             -- level = 1
        p.path || '/' || s.name, -- path = parent_path/name
        NOW(), NOW()
    FROM (VALUES
        -- Furniture
        ('Seating',  'Ghế, sofa, stool',         'Furniture'),
        ('Tables',   'Bàn các loại',             'Furniture'),
        ('Storage',  'Tủ, kệ, tủ sách',          'Furniture'),
        -- Lighting
        ('Ceiling',  'Đèn trần',                 'Lighting'),
        ('Wall',     'Đèn gắn tường',            'Lighting'),
        ('Floor',    'Đèn đứng',                 'Lighting'),
        -- Decorations
        ('Artwork',  'Tranh, tượng',             'Decorations'),
        ('Plants',   'Cây cảnh',                 'Decorations'),
        ('Rugs',     'Thảm',                     'Decorations')
    ) AS s(name, description, parent_name)
    JOIN top_categories p ON p.name = s.parent_name
    ON CONFLICT (name, parent_id) DO NOTHING
    RETURNING id, name, path, level
),

-- =========================
-- 3️⃣  CẤP 2  (LEAF-CATEGORY)
-- =========================
level2 AS (
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
        p.level + 1,             -- level = 2
        p.path || '/' || s.name, -- path = grand_parent_path/parent/name
        NOW(), NOW()
    FROM (VALUES
        -- Seating
        ('Sofas',          'Các loại sofa',              'Seating'),
        ('Armchairs',      'Ghế bành',                   'Seating'),
        -- Tables
        ('Coffee Tables',  'Bàn trà',                    'Tables'),
        ('Side Tables',    'Bàn đầu giường / góc',       'Tables'),
        -- Storage
        ('Bookshelves',    'Kệ sách',                    'Storage'),
        ('Cabinets',       'Tủ đa dụng',                 'Storage'),
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
    ON CONFLICT (name, parent_id) DO NOTHING
    RETURNING id, name, path, level
)

-- Trả về số lượng bản ghi được chèn (tuỳ mục đích kiểm tra)
SELECT
    (SELECT COUNT(*) FROM top_categories)  AS inserted_top,
    (SELECT COUNT(*) FROM level1)          AS inserted_level1,
    (SELECT COUNT(*) FROM level2)          AS inserted_level2;
