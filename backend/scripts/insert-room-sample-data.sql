-- Insert Room Sample Data
-- This script provides sample room resources for development and testing

BEGIN;

-- Insert room types
INSERT INTO room_types (id, name, label)
VALUES
('rt_living_room', 'living_room', 'Living Room'),
('rt_bedroom', 'bedroom', 'Bedroom'),
('rt_kitchen', 'kitchen', 'Kitchen'),
('rt_bathroom', 'bathroom', 'Bathroom'),
('rt_office', 'office', 'Office'),
('rt_dining_room', 'dining_room', 'Dining Room'),
('rt_study', 'study', 'Study');

-- Insert room resources with various categories and types
INSERT INTO room_resources (
    id, name, description, s3_url, s3_key, file_size, file_type, mime_type,
    room_type_id, version, unique_path, resource_id,
    is_premium, is_free, price, status, metadata, tags, keywords,
    created_at, updated_at
) VALUES
-- Living Room Category
('rm_lr_001', 'Scandinavian Living Room', 'Minimalist Scandinavian-style living room with light wood and neutral colors',
 'https://myroom-dev.s3.amazonaws.com/rooms/living/scandinavian_lr_001.glb',
 'rooms/living/scandinavian_lr_001.glb', 12582912, 'model/gltf-binary', 'model/gltf-binary',
 'rt_living_room', '1.0.0', 'living/scandinavian_001', 'LR_SCAN_001',
 false, true, NULL, 'ACTIVE',
 '{"style": "scandinavian", "color_scheme": "neutral", "furniture_pieces": 6}',
 '{"scandinavian", "minimalist", "living_room", "neutral"}',
 '{"living room", "scandinavian", "minimalist", "light wood", "neutral"}',
 NOW(), NOW()),

('rm_lr_002', 'Industrial Living Room', 'Modern industrial living room with exposed brick and metal accents',
 'https://myroom-dev.s3.amazonaws.com/rooms/living/industrial_lr_001.glb',
 'rooms/living/industrial_lr_001.glb', 16777216, 'model/gltf-binary', 'model/gltf-binary',
 'rt_living_room', '1.0.0', 'living/industrial_001', 'LR_IND_001',
 true, false, 24.99, 'ACTIVE',
 '{"style": "industrial", "features": ["exposed_brick", "metal_accents"], "furniture_pieces": 8}',
 '{"industrial", "modern", "living_room", "brick", "metal"}',
 '{"living room", "industrial", "modern", "exposed brick", "metal"}',
 NOW(), NOW()),

-- Bedroom Category
('rm_br_001', 'Bohemian Bedroom', 'Eclectic bohemian bedroom with colorful textiles and plants',
 'https://myroom-dev.s3.amazonaws.com/rooms/bedroom/bohemian_br_001.glb',
 'rooms/bedroom/bohemian_br_001.glb', 18874368, 'model/gltf-binary', 'model/gltf-binary',
 'rt_bedroom', '1.0.0', 'bedroom/bohemian_001', 'BR_BOH_001',
 false, true, NULL, 'ACTIVE',
 '{"style": "bohemian", "color_scheme": "colorful", "has_plants": true}',
 '{"bohemian", "eclectic", "bedroom", "colorful", "plants"}',
 '{"bedroom", "bohemian", "eclectic", "colorful", "textiles"}',
 NOW(), NOW()),

('rm_br_002', 'Minimalist Bedroom', 'Clean and simple minimalist bedroom with essential furniture only',
 'https://myroom-dev.s3.amazonaws.com/rooms/bedroom/minimalist_br_001.glb',
 'rooms/bedroom/minimalist_br_001.glb', 10485760, 'model/gltf-binary', 'model/gltf-binary',
 'rt_bedroom', '1.0.0', 'bedroom/minimalist_001', 'BR_MIN_001',
 false, true, NULL, 'ACTIVE',
 '{"style": "minimalist", "color_scheme": "monochrome", "furniture_count": 4}',
 '{"minimalist", "simple", "bedroom", "clean", "essential"}',
 '{"bedroom", "minimalist", "simple", "clean", "essential"}',
 NOW(), NOW()),

-- Kitchen Category
('rm_kt_001', 'Farmhouse Kitchen', 'Rustic farmhouse kitchen with shaker cabinets and butcher block counters',
 'https://myroom-dev.s3.amazonaws.com/rooms/kitchen/farmhouse_kt_001.glb',
 'rooms/kitchen/farmhouse_kt_001.glb', 23068672, 'model/gltf-binary', 'model/gltf-binary',
 'rt_kitchen', '1.0.0', 'kitchen/farmhouse_001', 'KT_FARM_001',
 true, false, 39.99, 'ACTIVE',
 '{"style": "farmhouse", "cabinet_style": "shaker", "counter_material": "butcher_block"}',
 '{"farmhouse", "rustic", "kitchen", "shaker", "butcher_block"}',
 '{"kitchen", "farmhouse", "rustic", "shaker cabinets", "butcher block"}',
 NOW(), NOW()),

('rm_kt_002', 'Contemporary Kitchen', 'Sleek contemporary kitchen with quartz countertops and stainless steel appliances',
 'https://myroom-dev.s3.amazonaws.com/rooms/kitchen/contemporary_kt_001.glb',
 'rooms/kitchen/contemporary_kt_001.glb', 26214400, 'model/gltf-binary', 'model/gltf-binary',
 'rt_kitchen', '1.0.0', 'kitchen/contemporary_001', 'KT_CONT_001',
 true, false, 54.99, 'ACTIVE',
 '{"style": "contemporary", "counter_material": "quartz", "appliances": "stainless_steel"}',
 '{"contemporary", "sleek", "kitchen", "quartz", "stainless_steel"}',
 '{"kitchen", "contemporary", "sleek", "quartz", "stainless steel"}',
 NOW(), NOW()),

-- Bathroom Category
('rm_bt_001', 'Spa Bathroom', 'Zen-inspired spa bathroom with natural stone and bamboo accents',
 'https://myroom-dev.s3.amazonaws.com/rooms/bathroom/spa_bt_001.glb',
 'rooms/bathroom/spa_bt_001.glb', 20971520, 'model/gltf-binary', 'model/gltf-binary',
 'rt_bathroom', '1.0.0', 'bathroom/spa_001', 'BT_SPA_001',
 true, false, 44.99, 'ACTIVE',
 '{"style": "zen", "materials": ["natural_stone", "bamboo"], "atmosphere": "spa"}',
 '{"spa", "zen", "bathroom", "natural_stone", "bamboo"}',
 '{"bathroom", "spa", "zen", "natural stone", "bamboo"}',
 NOW(), NOW()),

('rm_bt_002', 'Modern Bathroom', 'Clean modern bathroom with geometric tiles and floating vanity',
 'https://myroom-dev.s3.amazonaws.com/rooms/bathroom/modern_bt_001.glb',
 'rooms/bathroom/modern_bt_001.glb', 15728640, 'model/gltf-binary', 'model/gltf-binary',
 'rt_bathroom', '1.0.0', 'bathroom/modern_001', 'BT_MOD_001',
 false, true, NULL, 'ACTIVE',
 '{"style": "modern", "tile_pattern": "geometric", "vanity_type": "floating"}',
 '{"modern", "clean", "bathroom", "geometric", "floating"}',
 '{"bathroom", "modern", "clean", "geometric tiles", "floating vanity"}',
 NOW(), NOW()),

-- Office Category
('rm_of_001', 'Executive Office', 'Professional executive office with mahogany desk and leather furniture',
 'https://myroom-dev.s3.amazonaws.com/rooms/office/executive_of_001.glb',
 'rooms/office/executive_of_001.glb', 19922944, 'model/gltf-binary', 'model/gltf-binary',
 'rt_office', '1.0.0', 'office/executive_001', 'OF_EXEC_001',
 true, false, 49.99, 'ACTIVE',
 '{"style": "executive", "desk_material": "mahogany", "furniture_material": "leather"}',
 '{"executive", "professional", "office", "mahogany", "leather"}',
 '{"office", "executive", "professional", "mahogany", "leather"}',
 NOW(), NOW()),

('rm_of_002', 'Creative Studio', 'Bright creative studio office with standing desk and inspiration boards',
 'https://myroom-dev.s3.amazonaws.com/rooms/office/creative_of_001.glb',
 'rooms/office/creative_of_001.glb', 17825792, 'model/gltf-binary', 'model/gltf-binary',
 'rt_office', '1.0.0', 'office/creative_001', 'OF_CREAT_001',
 false, true, NULL, 'ACTIVE',
 '{"style": "creative", "desk_type": "standing", "features": ["inspiration_boards", "bright_lighting"]}',
 '{"creative", "studio", "office", "standing_desk", "inspiration"}',
 '{"office", "creative", "studio", "standing desk", "inspiration"}',
 NOW(), NOW()),

-- Dining Room Category
('rm_dr_001', 'Traditional Dining Room', 'Classic traditional dining room with wooden table and upholstered chairs',
 'https://myroom-dev.s3.amazonaws.com/rooms/dining/traditional_dr_001.glb',
 'rooms/dining/traditional_dr_001.glb', 21495808, 'model/gltf-binary', 'model/gltf-binary',
 'rt_dining_room', '1.0.0', 'dining/traditional_001', 'DR_TRAD_001',
 false, true, NULL, 'ACTIVE',
 '{"style": "traditional", "table_material": "wood", "seating": "upholstered_chairs"}',
 '{"traditional", "classic", "dining_room", "wooden", "upholstered"}',
 '{"dining room", "traditional", "classic", "wooden table", "upholstered"}',
 NOW(), NOW()),

-- Study Category
('rm_st_001', 'Vintage Study', 'Cozy vintage study with antique desk and floor-to-ceiling bookshelves',
 'https://myroom-dev.s3.amazonaws.com/rooms/study/vintage_st_001.glb',
 'rooms/study/vintage_st_001.glb', 24117248, 'model/gltf-binary', 'model/gltf-binary',
 'rt_study', '1.0.0', 'study/vintage_001', 'ST_VINT_001',
 true, false, 34.99, 'ACTIVE',
 '{"style": "vintage", "desk_type": "antique", "bookshelf_height": "floor_to_ceiling"}',
 '{"vintage", "cozy", "study", "antique", "bookshelves"}',
 '{"study", "vintage", "cozy", "antique desk", "bookshelves"}',
 NOW(), NOW());

-- Insert sample usage data
INSERT INTO room_usage (
    id, room_resource_id, action, metadata, created_at
) VALUES
('usage_rm_001', 'rm_lr_001', 'LOAD', '{"load_time_ms": 2340, "user_agent": "MyRoom/1.0"}', NOW() - INTERVAL '2 hours'),
('usage_rm_002', 'rm_lr_001', 'VIEW', '{"view_duration_seconds": 180, "interactions": 5}', NOW() - INTERVAL '2 hours'),
('usage_rm_003', 'rm_lr_002', 'LOAD', '{"load_time_ms": 3120, "user_agent": "MyRoom/1.0"}', NOW() - INTERVAL '1 hour'),
('usage_rm_004', 'rm_br_001', 'VIEW', '{"view_duration_seconds": 240, "interactions": 8}', NOW() - INTERVAL '45 minutes'),
('usage_rm_005', 'rm_kt_001', 'DOWNLOAD', '{"download_size_bytes": 23068672, "download_time_ms": 5600}', NOW() - INTERVAL '30 minutes'),
('usage_rm_006', 'rm_bt_001', 'LOAD', '{"load_time_ms": 2890, "user_agent": "MyRoom/1.0"}', NOW() - INTERVAL '15 minutes'),
('usage_rm_007', 'rm_of_001', 'VIEW', '{"view_duration_seconds": 300, "interactions": 12}', NOW() - INTERVAL '10 minutes'),
('usage_rm_008', 'rm_dr_001', 'LOAD', '{"load_time_ms": 2650, "user_agent": "MyRoom/1.0"}', NOW() - INTERVAL '5 minutes');

COMMIT;

-- Display summary
SELECT 'Room sample data inserted successfully!' as status;
SELECT 
    rt.name as room_type_name,
    COUNT(*) as total_rooms,
    SUM(CASE WHEN rr.is_premium THEN 1 ELSE 0 END) as premium_rooms,
    SUM(CASE WHEN rr.is_free THEN 1 ELSE 0 END) as free_rooms
FROM room_resources rr
JOIN room_types rt ON rr.room_type

SELECT 
    room_type,
    COUNT(*) as count,
    AVG(file_size) as avg_file_size
FROM room_resources 
GROUP BY room_type 
ORDER BY room_type;