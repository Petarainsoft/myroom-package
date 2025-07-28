-- Create Super Admin for MyRoom Backend
-- This script creates a default super admin account for deployment
-- Password: Admin123! (hashed with bcrypt, salt rounds: 12)

-- Insert super admin only if no admin exists with this email
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

-- Insert some default resource categories if none exist
INSERT INTO "resource_categories" (
  id,
  name,
  description,
  is_premium,
  price,
  metadata,
  created_at,
  updated_at
)
SELECT 
  'cat_' || lower(replace(cast(gen_random_uuid() as text), '-', '')) as id,
  category_data.name,
  category_data.description,
  category_data.is_premium,
  category_data.price,
  category_data.metadata,
  NOW() as created_at,
  NOW() as updated_at
FROM (
  VALUES 
    ('Furniture', '3D furniture models for room visualization', false, NULL, '{}'),
    ('Textures', 'Material textures and patterns', false, NULL, '{}'),
    ('Lighting', 'Lighting fixtures and effects', false, NULL, '{}'),
    ('Decorations', 'Decorative items and accessories', false, NULL, '{}'),
    ('Premium Models', 'High-quality premium 3D models', true, 49.99, '{"quality": "premium"}')
) AS category_data(name, description, is_premium, price, metadata)
WHERE NOT EXISTS (
  SELECT 1 FROM "resource_categories" WHERE name = category_data.name
);

-- Print success message (PostgreSQL specific)
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM "admins" WHERE email = 'admin@petarainsoft.com') THEN
    RAISE NOTICE 'Super admin created successfully!';
    RAISE NOTICE 'Email: admin@petarainsoft.com';
    RAISE NOTICE 'Password: Admin123!';
    RAISE NOTICE 'Please change the default password after first login!';
  END IF;
END $$; 