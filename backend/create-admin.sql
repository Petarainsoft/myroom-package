-- Create default super admin account
-- Password: Admin123! (hashed with bcrypt)
INSERT INTO admins (id, email, name, password_hash, role, status, created_at, updated_at)
SELECT 
  'admin_' || substr(md5(random()::text), 1, 20) as id,
  'admin@petarainsoft.com' as email,
  'Super Administrator' as name,
  '$2a$12$NhZmqzbL6mt8fqY0phFr9eQ1ymUaixRCuom7K1zUpthIMk6W2rgCK' as password_hash, -- Admin123!
  'SUPER_ADMIN' as role,
  'ACTIVE' as status,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (
  SELECT 1 FROM admins WHERE email = 'admin@petarainsoft.com'
);