-- Seed Room Resources Data
-- This script inserts sample room resources for testing and development

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

-- Insert sample room resources
INSERT INTO room_resources (
    id,
    name,
    description,
    s3_url,
    s3_key,
    file_size,
    file_type,
    mime_type,
    room_type_id,
    version,
    unique_path,
    resource_id,
    is_premium,
    is_free,
    price,
    status,
    metadata,
    tags,
    keywords,
    created_at,
    updated_at
) VALUES
-- Living Room Resources
('room_001', 'Modern Living Room', 'Contemporary living room with modern furniture and clean lines', 
 'https://myroom-assets.s3.amazonaws.com/rooms/living_room/modern_living_room_001.glb', 
 'rooms/living_room/modern_living_room_001.glb', 15728640, 'model/gltf-binary', 'model/gltf-binary',
 'rt_living_room', '1.0.0', 'living_room/modern_living_room_001', 'LR_MOD_001',
 false, true, NULL, 'ACTIVE',
 '{"style": "modern", "furniture_count": 8, "lighting": "natural"}',
 '{"modern", "contemporary", "living_room", "furniture"}',
 '{"living room", "modern", "contemporary", "sofa", "coffee table"}',
 NOW(), NOW()),

('room_002', 'Cozy Living Room', 'Warm and cozy living room with comfortable seating and soft lighting', 
 'https://myroom-assets.s3.amazonaws.com/rooms/living_room/cozy_living_room_001.glb', 
 'rooms/living_room/cozy_living_room_001.glb', 18432000, 'model/gltf-binary', 'model/gltf-binary',
 'rt_living_room', '1.0.0', 'living_room/cozy_living_room_001', 'LR_COZ_001',
 false, true, NULL, 'ACTIVE',
 '{"style": "cozy", "furniture_count": 10, "lighting": "warm"}',
 '{"cozy", "warm", "living_room", "comfortable"}',
 '{"living room", "cozy", "warm", "comfortable", "fireplace"}',
 NOW(), NOW()),

-- Bedroom Resources
('room_003', 'Master Bedroom', 'Spacious master bedroom with king-size bed and walk-in closet', 
 'https://myroom-assets.s3.amazonaws.com/rooms/bedroom/master_bedroom_001.glb', 
 'rooms/bedroom/master_bedroom_001.glb', 22118400, 'model/gltf-binary', 'model/gltf-binary',
 'rt_bedroom', '1.0.0', 'bedroom/master_bedroom_001', 'BR_MAS_001',
 true, false, 29.99, 'ACTIVE',
 '{"style": "luxury", "bed_size": "king", "has_closet": true}',
 '{"master", "luxury", "bedroom", "king_bed"}',
 '{"bedroom", "master", "luxury", "king bed", "closet"}',
 NOW(), NOW()),

('room_004', 'Kids Bedroom', 'Colorful and fun bedroom designed for children with play area', 
 'https://myroom-assets.s3.amazonaws.com/rooms/bedroom/kids_bedroom_001.glb', 
 'rooms/bedroom/kids_bedroom_001.glb', 16777216, 'model/gltf-binary', 'model/gltf-binary',
 'rt_bedroom', '1.0.0', 'bedroom/kids_bedroom_001', 'BR_KID_001',
 false, true, NULL, 'ACTIVE',
 '{"style": "playful", "age_group": "children", "has_play_area": true}',
 '{"kids", "children", "bedroom", "playful", "colorful"}',
 '{"bedroom", "kids", "children", "playful", "toys"}',
 NOW(), NOW()),

-- Kitchen Resources
('room_005', 'Modern Kitchen', 'Sleek modern kitchen with island and high-end appliances', 
 'https://myroom-assets.s3.amazonaws.com/rooms/kitchen/modern_kitchen_001.glb', 
 'rooms/kitchen/modern_kitchen_001.glb', 25165824, 'model/gltf-binary', 'model/gltf-binary',
 'rt_kitchen', '1.0.0', 'kitchen/modern_kitchen_001', 'KT_MOD_001',
 true, false, 49.99, 'ACTIVE',
 '{"style": "modern", "has_island": true, "appliance_grade": "high_end"}',
 '{"modern", "kitchen", "island", "appliances"}',
 '{"kitchen", "modern", "island", "appliances", "cooking"}',
 NOW(), NOW()),

('room_006', 'Country Kitchen', 'Rustic country-style kitchen with wooden cabinets and farmhouse sink', 
 'https://myroom-assets.s3.amazonaws.com/rooms/kitchen/country_kitchen_001.glb', 
 'rooms/kitchen/country_kitchen_001.glb', 20971520, 'model/gltf-binary', 'model/gltf-binary',
 'rt_kitchen', '1.0.0', 'kitchen/country_kitchen_001', 'KT_COU_001',
 false, true, NULL, 'ACTIVE',
 '{"style": "country", "material": "wood", "sink_type": "farmhouse"}',
 '{"country", "rustic", "kitchen", "wood", "farmhouse"}',
 '{"kitchen", "country", "rustic", "wood", "farmhouse"}',
 NOW(), NOW()),

-- Bathroom Resources
('room_007', 'Luxury Bathroom', 'Spa-like luxury bathroom with marble finishes and soaking tub', 
 'https://myroom-assets.s3.amazonaws.com/rooms/bathroom/luxury_bathroom_001.glb', 
 'rooms/bathroom/luxury_bathroom_001.glb', 19922944, 'model/gltf-binary', 'model/gltf-binary',
 'rt_bathroom', '1.0.0', 'bathroom/luxury_bathroom_001', 'BT_LUX_001',
 true, false, 39.99, 'ACTIVE',
 '{"style": "luxury", "material": "marble", "has_tub": true}',
 '{"luxury", "bathroom", "marble", "spa", "tub"}',
 '{"bathroom", "luxury", "spa", "marble", "soaking tub"}',
 NOW(), NOW()),

-- Office Resources
('room_008', 'Home Office', 'Professional home office setup with desk and bookshelf', 
 'https://myroom-assets.s3.amazonaws.com/rooms/office/home_office_001.glb', 
 'rooms/office/home_office_001.glb', 14680064, 'model/gltf-binary', 'model/gltf-binary',
 'rt_office', '1.0.0', 'office/home_office_001', 'OF_HOM_001',
 false, true, NULL, 'ACTIVE',
 '{"style": "professional", "has_bookshelf": true, "desk_type": "executive"}',
 '{"office", "professional", "home", "desk", "bookshelf"}',
 '{"office", "home office", "professional", "desk", "work"}',
 NOW(), NOW()),

-- Dining Room Resources
('room_009', 'Formal Dining Room', 'Elegant formal dining room with large table and chandelier', 
 'https://myroom-assets.s3.amazonaws.com/rooms/dining_room/formal_dining_001.glb', 
 'rooms/dining_room/formal_dining_001.glb', 17825792, 'model/gltf-binary', 'model/gltf-binary',
 'rt_dining_room', '1.0.0', 'dining_room/formal_dining_001', 'DR_FOR_001',
 false, true, NULL, 'ACTIVE',
 '{"style": "formal", "seating_capacity": 8, "has_chandelier": true}',
 '{"formal", "dining_room", "elegant", "chandelier"}',
 '{"dining room", "formal", "elegant", "chandelier", "dinner"}',
 NOW(), NOW()),

-- Study Resources
('room_010', 'Library Study', 'Traditional library study with floor-to-ceiling bookshelves', 
 'https://myroom-assets.s3.amazonaws.com/rooms/study/library_study_001.glb', 
 'rooms/study/library_study_001.glb', 21495808, 'model/gltf-binary', 'model/gltf-binary',
 'rt_study', '1.0.0', 'study/library_study_001', 'ST_LIB_001',
 true, false, 34.99, 'ACTIVE',
 '{"style": "traditional", "bookshelf_height": "floor_to_ceiling", "seating": "leather_chair"}',
 '{"library", "study", "traditional", "books", "reading"}',
 '{"study", "library", "traditional", "books", "reading"}',
 NOW(), NOW());

-- Insert sample room usage data
INSERT INTO room_usage (
    id,
    room_resource_id,
    action,
    metadata,
    created_at
) VALUES
('usage_001', 'room_001', 'LOAD', '{"session_id": "sess_001", "load_time": 2.5}', NOW() - INTERVAL '1 day'),
('usage_002', 'room_001', 'VIEW', '{"session_id": "sess_001", "view_duration": 120}', NOW() - INTERVAL '1 day'),
('usage_003', 'room_002', 'LOAD', '{"session_id": "sess_002", "load_time": 3.1}', NOW() - INTERVAL '2 hours'),
('usage_004', 'room_003', 'DOWNLOAD', '{"session_id": "sess_003", "file_size": 22118400}', NOW() - INTERVAL '3 hours'),
('usage_005', 'room_005', 'VIEW', '{"session_id": "sess_004", "view_duration": 300}', NOW() - INTERVAL '30 minutes');

-- Create some sample developer room permissions (assuming developer IDs exist)
-- Note: These will only work if you have actual developer records

INSERT INTO developer_room_permissions (
  id,
  developer_id,
    room_resource_id,
    granted_at,
    expires_at,
    is_paid,
    paid_amount,
    reason,
    created_at,
    updated_at
) VALUES
('perm_001', 'developer_001', 'room_003', NOW(), NOW() + INTERVAL '30 days', true, 29.99, 'Premium purchase', NOW(), NOW()),
('perm_002', 'developer_001', 'room_005', NOW(), NOW() + INTERVAL '30 days', true, 49.99, 'Premium purchase', NOW(), NOW()),
('perm_003', 'developer_002', 'room_007', NOW(), NOW() + INTERVAL '30 days', true, 39.99, 'Premium purchase', NOW(), NOW()),
('perm_004', 'developer_002', 'room_010', NOW(), NOW() + INTERVAL '30 days', true, 34.99, 'Premium purchase', NOW(), NOW());
*/

-- Update statistics
SELECT 'Room resources seeded successfully!' as message;
SELECT COUNT(*) as total_rooms FROM room_resources;
SELECT rt.name as room_type_name, COUNT(*) as count FROM room_resources rr JOIN room_types rt ON rr.room_type_id = rt.id GROUP BY rt.name ORDER BY rt.name;
SELECT room_type, COUNT(*) as count FROM room_resources GROUP BY room_type ORDER BY room_type;