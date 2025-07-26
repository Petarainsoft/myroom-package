-- Insert sample data for Avatar Management System
-- This script populates the avatar tables with initial categories and sample resources

-- Insert Gender Categories (Top Level)
INSERT INTO avatar_categories (id, name, description, category_type, parent_id, level, path, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Male', 'Male avatar parts and accessories', 'gender', NULL, 0, 'male', 1),
('550e8400-e29b-41d4-a716-446655440002', 'Female', 'Female avatar parts and accessories', 'gender', NULL, 0, 'female', 2),
('550e8400-e29b-41d4-a716-446655440003', 'Unisex', 'Gender-neutral avatar parts', 'gender', NULL, 0, 'unisex', 3);

-- Insert Part Type Categories for Male
INSERT INTO avatar_categories (id, name, description, category_type, parent_id, level, path, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'Body', 'Male body parts', 'part_type', '550e8400-e29b-41d4-a716-446655440001', 1, 'male/body', 1),
('550e8400-e29b-41d4-a716-446655440012', 'Hair', 'Male hairstyles', 'part_type', '550e8400-e29b-41d4-a716-446655440001', 1, 'male/hair', 2),
('550e8400-e29b-41d4-a716-446655440013', 'Top', 'Male upper body clothing', 'part_type', '550e8400-e29b-41d4-a716-446655440001', 1, 'male/top', 3),
('550e8400-e29b-41d4-a716-446655440014', 'Bottom', 'Male lower body clothing', 'part_type', '550e8400-e29b-41d4-a716-446655440001', 1, 'male/bottom', 4),
('550e8400-e29b-41d4-a716-446655440015', 'Shoes', 'Male footwear', 'part_type', '550e8400-e29b-41d4-a716-446655440001', 1, 'male/shoes', 5),
('550e8400-e29b-41d4-a716-446655440016', 'Accessory', 'Male accessories', 'part_type', '550e8400-e29b-41d4-a716-446655440001', 1, 'male/accessory', 6),
('550e8400-e29b-41d4-a716-446655440017', 'Fullset', 'Male complete outfits', 'part_type', '550e8400-e29b-41d4-a716-446655440001', 1, 'male/fullset', 7);

-- Removed duplicate 'Male/Accessory' path to fix unique constraint error

-- Insert Part Type Categories for Female
INSERT INTO avatar_categories (id, name, description, category_type, parent_id, level, path, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440021', 'Body', 'Female body parts', 'part_type', '550e8400-e29b-41d4-a716-446655440002', 1, 'female/body', 1),
('550e8400-e29b-41d4-a716-446655440022', 'Hair', 'Female hairstyles', 'part_type', '550e8400-e29b-41d4-a716-446655440002', 1, 'female/hair', 2),
('550e8400-e29b-41d4-a716-446655440023', 'Top', 'Female upper body clothing', 'part_type', '550e8400-e29b-41d4-a716-446655440002', 1, 'female/top', 3),
('550e8400-e29b-41d4-a716-446655440024', 'Bottom', 'Female lower body clothing', 'part_type', '550e8400-e29b-41d4-a716-446655440002', 1, 'female/bottom', 4),
('550e8400-e29b-41d4-a716-446655440025', 'Shoes', 'Female footwear', 'part_type', '550e8400-e29b-41d4-a716-446655440002', 1, 'female/shoes', 5),
('550e8400-e29b-41d4-a716-446655440026', 'Accessory', 'Female accessories', 'part_type', '550e8400-e29b-41d4-a716-446655440002', 1, 'female/accessory', 6);
-- Removed duplicate 'Female/Accessory' path to fix unique constraint error
('550e8400-e29b-41d4-a716-446655440027', 'Fullset', 'Female complete outfits', 'part_type', '550e8400-e29b-41d4-a716-446655440002', 1, 'female/fullset', 7);

-- Insert Part Type Categories for Unisex
INSERT INTO avatar_categories (id, name, description, category_type, parent_id, level, path, sort_order) VALUES
('550e8400-e29b-41d4-a716-446655440031', 'Accessory', 'Unisex accessories', 'part_type', '550e8400-e29b-41d4-a716-446655440003', 1, 'unisex/accessory', 1);
-- Removed duplicate 'Unisex/Accessory' path to fix unique constraint error
('550e8400-e29b-41d4-a716-446655440032', 'Shoes', 'Unisex footwear', 'part_type', '550e8400-e29b-41d4-a716-446655440003', 1, 'unisex/shoes', 2);

-- Insert Sample Male Avatar Resources
INSERT INTO avatar_resources (id, name, description, s3_url, s3_key, file_size, gender, part_type, category_id, unique_path, resource_id, is_free, tags, keywords) VALUES
-- Male Hair
('650e8400-e29b-41d4-a716-446655440001', 'Male Hair Style 001', 'Classic short hair for male avatars', '/models/male/male_hair/male_hair_001.glb', 'avatars/male/hair/male_hair_001.glb', 524288, 'male', 'hair', '550e8400-e29b-41d4-a716-446655440012', 'male/hair/male_hair_001', 'male_hair_001', true, '{"classic", "short", "professional"}', '{"hair", "male", "short", "classic"}'),
('650e8400-e29b-41d4-a716-446655440002', 'Male Hair Style 002', 'Modern styled hair for male avatars', '/models/male/male_hair/male_hair_002.glb', 'avatars/male/hair/male_hair_002.glb', 612352, 'male', 'hair', '550e8400-e29b-41d4-a716-446655440012', 'male/hair/male_hair_002', 'male_hair_002', true, '{"modern", "styled", "trendy"}', '{"hair", "male", "modern", "styled"}'),
('650e8400-e29b-41d4-a716-446655440003', 'Male Hair Style 003', 'Long hair style for male avatars', '/models/male/male_hair/male_hair_003.glb', 'avatars/male/hair/male_hair_003.glb', 698240, 'male', 'hair', '550e8400-e29b-41d4-a716-446655440012', 'male/hair/male_hair_003', 'male_hair_003', false, '{"long", "flowing", "artistic"}', '{"hair", "male", "long", "artistic"}'),

-- Male Body
('650e8400-e29b-41d4-a716-446655440011', 'Male Body Default', 'Default male body mesh', '/models/male/male_body/male_body_default.glb', 'avatars/male/body/male_body_default.glb', 1048576, 'male', 'body', '550e8400-e29b-41d4-a716-446655440011', 'male/body/male_body_default', 'male_body_default', true, '{"default", "base", "standard"}', '{"body", "male", "default", "base"}'),

-- Male Tops
('650e8400-e29b-41d4-a716-446655440021', 'Male T-Shirt Basic', 'Basic t-shirt for male avatars', '/models/male/male_top/male_tshirt_001.glb', 'avatars/male/top/male_tshirt_001.glb', 327680, 'male', 'top', '550e8400-e29b-41d4-a716-446655440013', 'male/top/male_tshirt_001', 'male_tshirt_001', true, '{"casual", "basic", "everyday"}', '{"top", "male", "tshirt", "casual"}'),
('650e8400-e29b-41d4-a716-446655440022', 'Male Formal Shirt', 'Formal dress shirt for male avatars', '/models/male/male_top/male_shirt_formal_001.glb', 'avatars/male/top/male_shirt_formal_001.glb', 425984, 'male', 'top', '550e8400-e29b-41d4-a716-446655440013', 'male/top/male_shirt_formal_001', 'male_shirt_formal_001', false, '{"formal", "business", "professional"}', '{"top", "male", "shirt", "formal"}'),

-- Male Bottoms
('650e8400-e29b-41d4-a716-446655440031', 'Male Jeans Classic', 'Classic blue jeans for male avatars', '/models/male/male_bottom/male_jeans_001.glb', 'avatars/male/bottom/male_jeans_001.glb', 389120, 'male', 'bottom', '550e8400-e29b-41d4-a716-446655440014', 'male/bottom/male_jeans_001', 'male_jeans_001', true, '{"casual", "denim", "classic"}', '{"bottom", "male", "jeans", "casual"}'),
('650e8400-e29b-41d4-a716-446655440032', 'Male Formal Pants', 'Formal dress pants for male avatars', '/models/male/male_bottom/male_pants_formal_001.glb', 'avatars/male/bottom/male_pants_formal_001.glb', 356352, 'male', 'bottom', '550e8400-e29b-41d4-a716-446655440014', 'male/bottom/male_pants_formal_001', 'male_pants_formal_001', false, '{"formal", "business", "professional"}', '{"bottom", "male", "pants", "formal"}');

-- Insert Sample Female Avatar Resources
INSERT INTO avatar_resources (id, name, description, s3_url, s3_key, file_size, gender, part_type, category_id, unique_path, resource_id, is_free, tags, keywords) VALUES
-- Female Hair
('650e8400-e29b-41d4-a716-446655440101', 'Female Hair Style 001', 'Long wavy hair for female avatars', '/models/female/female_hair/female_hair_001.glb', 'avatars/female/hair/female_hair_001.glb', 756736, 'female', 'hair', '550e8400-e29b-41d4-a716-446655440022', 'female/hair/female_hair_001', 'female_hair_001', true, '{"long", "wavy", "elegant"}', '{"hair", "female", "long", "wavy"}'),
('650e8400-e29b-41d4-a716-446655440102', 'Female Hair Style 002', 'Short bob cut for female avatars', '/models/female/female_hair/female_hair_002.glb', 'avatars/female/hair/female_hair_002.glb', 524288, 'female', 'hair', '550e8400-e29b-41d4-a716-446655440022', 'female/hair/female_hair_002', 'female_hair_002', true, '{"short", "bob", "modern"}', '{"hair", "female", "short", "bob"}'),

-- Female Body
('650e8400-e29b-41d4-a716-446655440111', 'Female Body Default', 'Default female body mesh', '/models/female/female_body/female_body_default.glb', 'avatars/female/body/female_body_default.glb', 1048576, 'female', 'body', '550e8400-e29b-41d4-a716-446655440021', 'female/body/female_body_default', 'female_body_default', true, '{"default", "base", "standard"}', '{"body", "female", "default", "base"}'),

-- Female Tops
('650e8400-e29b-41d4-a716-446655440121', 'Female Blouse Casual', 'Casual blouse for female avatars', '/models/female/female_top/female_blouse_001.glb', 'avatars/female/top/female_blouse_001.glb', 389120, 'female', 'top', '550e8400-e29b-41d4-a716-446655440023', 'female/top/female_blouse_001', 'female_blouse_001', true, '{"casual", "comfortable", "everyday"}', '{"top", "female", "blouse", "casual"}'),
('650e8400-e29b-41d4-a716-446655440122', 'Female Dress Elegant', 'Elegant dress for female avatars', '/models/female/female_top/female_dress_001.glb', 'avatars/female/top/female_dress_001.glb', 524288, 'female', 'top', '550e8400-e29b-41d4-a716-446655440023', 'female/top/female_dress_001', 'female_dress_001', false, '{"elegant", "formal", "dress"}', '{"top", "female", "dress", "elegant"}'),

-- Female Bottoms
('650e8400-e29b-41d4-a716-446655440131', 'Female Skirt Casual', 'Casual skirt for female avatars', '/models/female/female_bottom/female_skirt_001.glb', 'avatars/female/bottom/female_skirt_001.glb', 294912, 'female', 'bottom', '550e8400-e29b-41d4-a716-446655440024', 'female/bottom/female_skirt_001', 'female_skirt_001', true, '{"casual", "comfortable", "skirt"}', '{"bottom", "female", "skirt", "casual"}'),
('650e8400-e29b-41d4-a716-446655440132', 'Female Jeans Skinny', 'Skinny jeans for female avatars', '/models/female/female_bottom/female_jeans_001.glb', 'avatars/female/bottom/female_jeans_001.glb', 356352, 'female', 'bottom', '550e8400-e29b-41d4-a716-446655440024', 'female/bottom/female_jeans_001', 'female_jeans_001', true, '{"casual", "denim", "skinny"}', '{"bottom", "female", "jeans", "skinny"}');

-- Avatar Collections removed - no longer needed

-- Avatar Collection Items removed - no longer needed

-- Update timestamps
UPDATE avatar_categories SET updated_at = CURRENT_TIMESTAMP;
UPDATE avatar_resources SET updated_at = CURRENT_TIMESTAMP;
-- Avatar collections update removed

-- Verify data insertion
SELECT 'Avatar Categories' as table_name, COUNT(*) as record_count FROM avatar_categories
UNION ALL
SELECT 'Avatar Resources' as table_name, COUNT(*) as record_count FROM avatar_resources;