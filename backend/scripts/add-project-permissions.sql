-- Thêm project mới
INSERT INTO projects (id, name, developer_id, created_at, updated_at)
VALUES ('[project_id]', 'API Project', '[developer_id]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Thêm quyền truy cập avatar cho project
INSERT INTO project_avatar_permissions (id, project_id, avatar_id, created_at, updated_at)
SELECT gen_random_uuid(), '[project_id]', id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM avatars;

-- Thêm quyền truy cập item cho project
INSERT INTO project_item_permissions (id, project_id, item_id, created_at, updated_at)
SELECT gen_random_uuid(), '[project_id]', id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM items;

-- Ví dụ sử dụng:
-- Thay thế [project_id] bằng ID của project (ví dụ: api_da3f58a2024c4a23b268b74cb3cda225)
-- Thay thế [developer_id] bằng ID của developer (ví dụ: dev_f4b57fc6a92b41c98df060f78bec1adc)