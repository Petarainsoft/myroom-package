-- Seed Avatar Resources Script
-- This script creates sample avatar resources for testing and demo purposes

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- SAMPLE AVATAR RESOURCES
-- =========================

-- Get category IDs for avatar parts
WITH avatar_categories AS (
    SELECT 
        ac.id,
        ac.name as part_name,
        parent.name as gender_name
    FROM "avatar_categories" ac
    LEFT JOIN "avatar_categories" parent ON ac.parent_id = parent.id
    WHERE ac.category_type = 'part_type'
),

-- Create sample male avatar resources
male_resources AS (
    INSERT INTO "avatar_resources" (
        id, name, description,
        s3_url, s3_key, file_size, file_type, mime_type,
        gender, part_type, category_id,
        version, unique_path, resource_id,
        is_premium, is_free, status,
        metadata, tags, keywords,
        created_at, updated_at
    )
    SELECT
        'avatar_res_' || lower(replace(cast(gen_random_uuid() AS text), '-', '')) as id,
        r.name,
        r.description,
        'https://myravt.s3.amazonaws.com/avatars/' || r.s3_key as s3_url,
        r.s3_key,
        r.file_size,
        'model/gltf-binary' as file_type,
        'model/gltf-binary' as mime_type,
        'MALE' as gender,
        r.part_type::"AvatarPartType",
        ac.id as category_id,
        '1.0.0' as version,
        'male/' || lower(r.part_type) || '/' || r.unique_path as unique_path,
        r.resource_id,
        r.is_premium,
        r.is_free,
        'ACTIVE' as status,
        r.metadata::jsonb,
        r.tags,
        r.keywords,
        NOW(), NOW()
    FROM (
        VALUES
            -- Male Body
            ('Male Body Default', 'Cơ thể nam mặc định', 'male/body/male_body_001.glb', 'male_body_001', 2048576, 'BODY', 'male_body_001', false, true, '{"skin_tone": "medium"}', ARRAY['body', 'male', 'default'], ARRAY['body', 'male', 'skin']),
            ('Male Body Athletic', 'Cơ thể nam thể thao', 'male/body/male_body_002.glb', 'male_body_002', 2148576, 'BODY', 'male_body_002', true, false, '{"skin_tone": "medium", "build": "athletic"}', ARRAY['body', 'male', 'athletic'], ARRAY['body', 'male', 'muscular']),
            
            -- Male Hair
            ('Male Hair Short', 'Tóc nam ngắn', 'male/hair/male_hair_001.glb', 'male_hair_001', 512576, 'HAIR', 'male_hair_001', false, true, '{"color": "brown", "style": "short"}', ARRAY['hair', 'male', 'short'], ARRAY['hair', 'male', 'brown']),
            ('Male Hair Long', 'Tóc nam dài', 'male/hair/male_hair_002.glb', 'male_hair_002', 612576, 'HAIR', 'male_hair_002', false, true, '{"color": "black", "style": "long"}', ARRAY['hair', 'male', 'long'], ARRAY['hair', 'male', 'black']),
            ('Male Hair Curly', 'Tóc nam xoăn', 'male/hair/male_hair_003.glb', 'male_hair_003', 712576, 'HAIR', 'male_hair_003', true, false, '{"color": "blonde", "style": "curly"}', ARRAY['hair', 'male', 'curly'], ARRAY['hair', 'male', 'blonde']),
            
            -- Male Tops
            ('Male T-Shirt Basic', 'Áo thun nam cơ bản', 'male/top/male_top_001.glb', 'male_top_001', 412576, 'TOP', 'male_top_001', false, true, '{"color": "white", "style": "casual"}', ARRAY['top', 'male', 'tshirt'], ARRAY['top', 'male', 'casual']),
            ('Male Shirt Formal', 'Áo sơ mi nam', 'male/top/male_top_002.glb', 'male_top_002', 512576, 'TOP', 'male_top_002', false, true, '{"color": "blue", "style": "formal"}', ARRAY['top', 'male', 'shirt'], ARRAY['top', 'male', 'formal']),
            ('Male Jacket Leather', 'Áo khoác da nam', 'male/top/male_top_003.glb', 'male_top_003', 812576, 'TOP', 'male_top_003', true, false, '{"color": "black", "style": "leather"}', ARRAY['top', 'male', 'jacket'], ARRAY['top', 'male', 'leather']),
            
            -- Male Bottoms
            ('Male Jeans Regular', 'Quần jeans nam', 'male/bottom/male_bottom_001.glb', 'male_bottom_001', 612576, 'BOTTOM', 'male_bottom_001', false, true, '{"color": "blue", "style": "regular"}', ARRAY['bottom', 'male', 'jeans'], ARRAY['bottom', 'male', 'denim']),
            ('Male Pants Formal', 'Quần tây nam', 'male/bottom/male_bottom_002.glb', 'male_bottom_002', 512576, 'BOTTOM', 'male_bottom_002', false, true, '{"color": "black", "style": "formal"}', ARRAY['bottom', 'male', 'pants'], ARRAY['bottom', 'male', 'formal']),
            ('Male Shorts Casual', 'Quần short nam', 'male/bottom/male_bottom_003.glb', 'male_bottom_003', 412576, 'BOTTOM', 'male_bottom_003', false, true, '{"color": "khaki", "style": "casual"}', ARRAY['bottom', 'male', 'shorts'], ARRAY['bottom', 'male', 'casual']),
            
            -- Male Shoes
            ('Male Sneakers White', 'Giày thể thao nam trắng', 'male/shoes/male_shoes_001.glb', 'male_shoes_001', 312576, 'SHOES', 'male_shoes_001', false, true, '{"color": "white", "style": "sneakers"}', ARRAY['shoes', 'male', 'sneakers'], ARRAY['shoes', 'male', 'sport']),
            ('Male Dress Shoes', 'Giày tây nam', 'male/shoes/male_shoes_002.glb', 'male_shoes_002', 412576, 'SHOES', 'male_shoes_002', false, true, '{"color": "black", "style": "formal"}', ARRAY['shoes', 'male', 'formal'], ARRAY['shoes', 'male', 'leather']),
            
            -- Male Accessories
            ('Male Watch Classic', 'Đồng hồ nam cổ điển', 'male/accessory/male_acc_001.glb', 'male_acc_001', 112576, 'ACCESSORY', 'male_acc_001', true, false, '{"color": "silver", "style": "classic"}', ARRAY['accessory', 'male', 'watch'], ARRAY['accessory', 'male', 'jewelry']),
            ('Male Glasses Frame', 'Kính mắt nam', 'male/accessory/male_acc_002.glb', 'male_acc_002', 212576, 'ACCESSORY', 'male_acc_002', false, true, '{"color": "black", "style": "frame"}', ARRAY['accessory', 'male', 'glasses'], ARRAY['accessory', 'male', 'eyewear'])
    ) AS r(name, description, s3_key, unique_path, file_size, part_type, resource_id, is_premium, is_free, metadata, tags, keywords)
    JOIN avatar_categories ac ON ac.part_name = r.part_type AND ac.gender_name = 'Male'
    ON CONFLICT (unique_path) DO NOTHING
    RETURNING id, name, part_type
),

-- Create sample female avatar resources
female_resources AS (
    INSERT INTO "avatar_resources" (
        id, name, description,
        s3_url, s3_key, file_size, file_type, mime_type,
        gender, part_type, category_id,
        version, unique_path, resource_id,
        is_premium, is_free, status,
        metadata, tags, keywords,
        created_at, updated_at
    )
    SELECT
        'avatar_res_' || lower(replace(cast(gen_random_uuid() AS text), '-', '')) as id,
        r.name,
        r.description,
        'https://myravt.s3.amazonaws.com/avatars/' || r.s3_key as s3_url,
        r.s3_key,
        r.file_size,
        'model/gltf-binary' as file_type,
        'model/gltf-binary' as mime_type,
        'FEMALE' as gender,
        r.part_type::"AvatarPartType",
        ac.id as category_id,
        '1.0.0' as version,
        'female/' || lower(r.part_type) || '/' || r.unique_path as unique_path,
        r.resource_id,
        r.is_premium,
        r.is_free,
        'ACTIVE' as status,
        r.metadata::jsonb,
        r.tags,
        r.keywords,
        NOW(), NOW()
    FROM (
        VALUES
            -- Female Body
            ('Female Body Default', 'Cơ thể nữ mặc định', 'female/body/female_body_001.glb', 'female_body_001', 2048576, 'BODY', 'female_body_001', false, true, '{"skin_tone": "medium"}', ARRAY['body', 'female', 'default'], ARRAY['body', 'female', 'skin']),
            ('Female Body Slim', 'Cơ thể nữ mảnh mai', 'female/body/female_body_002.glb', 'female_body_002', 2148576, 'BODY', 'female_body_002', true, false, '{"skin_tone": "fair", "build": "slim"}', ARRAY['body', 'female', 'slim'], ARRAY['body', 'female', 'elegant']),
            
            -- Female Hair
            ('Female Hair Long Straight', 'Tóc nữ dài thẳng', 'female/hair/female_hair_001.glb', 'female_hair_001', 712576, 'HAIR', 'female_hair_001', false, true, '{"color": "brown", "style": "long_straight"}', ARRAY['hair', 'female', 'long'], ARRAY['hair', 'female', 'straight']),
            ('Female Hair Bob Cut', 'Tóc nữ bob', 'female/hair/female_hair_002.glb', 'female_hair_002', 512576, 'HAIR', 'female_hair_002', false, true, '{"color": "black", "style": "bob"}', ARRAY['hair', 'female', 'bob'], ARRAY['hair', 'female', 'short']),
            ('Female Hair Curly Long', 'Tóc nữ xoăn dài', 'female/hair/female_hair_003.glb', 'female_hair_003', 812576, 'HAIR', 'female_hair_003', true, false, '{"color": "blonde", "style": "curly_long"}', ARRAY['hair', 'female', 'curly'], ARRAY['hair', 'female', 'blonde']),
            
            -- Female Tops
            ('Female Blouse White', 'Áo blouse nữ trắng', 'female/top/female_top_001.glb', 'female_top_001', 412576, 'TOP', 'female_top_001', false, true, '{"color": "white", "style": "blouse"}', ARRAY['top', 'female', 'blouse'], ARRAY['top', 'female', 'elegant']),
            ('Female T-Shirt Casual', 'Áo thun nữ', 'female/top/female_top_002.glb', 'female_top_002', 312576, 'TOP', 'female_top_002', false, true, '{"color": "pink", "style": "casual"}', ARRAY['top', 'female', 'tshirt'], ARRAY['top', 'female', 'casual']),
            ('Female Dress Evening', 'Váy dạ hội', 'female/top/female_top_003.glb', 'female_top_003', 912576, 'TOP', 'female_top_003', true, false, '{"color": "red", "style": "evening"}', ARRAY['top', 'female', 'dress'], ARRAY['top', 'female', 'formal']),
            
            -- Female Bottoms
            ('Female Jeans Skinny', 'Quần jeans nữ ôm', 'female/bottom/female_bottom_001.glb', 'female_bottom_001', 512576, 'BOTTOM', 'female_bottom_001', false, true, '{"color": "blue", "style": "skinny"}', ARRAY['bottom', 'female', 'jeans'], ARRAY['bottom', 'female', 'skinny']),
            ('Female Skirt Mini', 'Chân váy ngắn', 'female/bottom/female_bottom_002.glb', 'female_bottom_002', 312576, 'BOTTOM', 'female_bottom_002', false, true, '{"color": "black", "style": "mini"}', ARRAY['bottom', 'female', 'skirt'], ARRAY['bottom', 'female', 'mini']),
            ('Female Pants Formal', 'Quần tây nữ', 'female/bottom/female_bottom_003.glb', 'female_bottom_003', 412576, 'BOTTOM', 'female_bottom_003', false, true, '{"color": "navy", "style": "formal"}', ARRAY['bottom', 'female', 'pants'], ARRAY['bottom', 'female', 'formal']),
            
            -- Female Shoes
            ('Female Heels Black', 'Giày cao gót đen', 'female/shoes/female_shoes_001.glb', 'female_shoes_001', 312576, 'SHOES', 'female_shoes_001', false, true, '{"color": "black", "style": "heels"}', ARRAY['shoes', 'female', 'heels'], ARRAY['shoes', 'female', 'formal']),
            ('Female Sneakers Pink', 'Giày thể thao nữ hồng', 'female/shoes/female_shoes_002.glb', 'female_shoes_002', 312576, 'SHOES', 'female_shoes_002', false, true, '{"color": "pink", "style": "sneakers"}', ARRAY['shoes', 'female', 'sneakers'], ARRAY['shoes', 'female', 'sport']),
            
            -- Female Accessories
            ('Female Earrings Pearl', 'Bông tai ngọc trai', 'female/accessory/female_acc_001.glb', 'female_acc_001', 112576, 'ACCESSORY', 'female_acc_001', true, false, '{"color": "white", "style": "pearl"}', ARRAY['accessory', 'female', 'earrings'], ARRAY['accessory', 'female', 'jewelry']),
            ('Female Handbag Leather', 'Túi xách da nữ', 'female/accessory/female_acc_002.glb', 'female_acc_002', 412576, 'ACCESSORY', 'female_acc_002', true, false, '{"color": "brown", "style": "leather"}', ARRAY['accessory', 'female', 'handbag'], ARRAY['accessory', 'female', 'bag'])
    ) AS r(name, description, s3_key, unique_path, file_size, part_type, resource_id, is_premium, is_free, metadata, tags, keywords)
    JOIN avatar_categories ac ON ac.part_name = r.part_type AND ac.gender_name = 'Female'
    ON CONFLICT (unique_path) DO NOTHING
    RETURNING id, name, part_type
)

-- Avatar collections have been removed from the system

-- Print success message
DO $$
DECLARE
    male_resource_count INTEGER;
    female_resource_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO male_resource_count FROM "avatar_resources" WHERE gender = 'MALE';
    SELECT COUNT(*) INTO female_resource_count FROM "avatar_resources" WHERE gender = 'FEMALE';
    -- Collection count removed as collections are no longer used
    
    RAISE NOTICE '🎭 Avatar resources seeded successfully!';
    RAISE NOTICE '   - Male Avatar Resources: %', male_resource_count;
    RAISE NOTICE '   - Female Avatar Resources: %', female_resource_count;
    -- Avatar Collections: removed from system
END $$;