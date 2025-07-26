# Avatar Management System

Hệ thống quản lý avatar GLB tách biệt với hệ thống resource chính, được thiết kế để quản lý các file GLB avatar theo giới tính và loại phần của avatar.

## Tổng quan

Hệ thống Avatar Management bao gồm:
- **Avatar Categories**: Phân loại theo giới tính (Male/Female/Unisex) và loại phần (Hair, Top, Bottom, etc.)
- **Avatar Resources**: Các file GLB avatar với metadata chi tiết

- **Permission System**: Quản lý quyền truy cập cho nội dung premium

## Cấu trúc Database

### Bảng chính

1. **avatar_categories**: Phân loại hierarchical
2. **avatar_resources**: File GLB và metadata
3. **avatar_usage**: Theo dõi việc sử dụng
4. **developer_avatar_permissions**: Quyền truy cập premium

### Enums

- `AvatarGender`: MALE, FEMALE, UNISEX
- `AvatarPartType`: BODY, HAIR, TOP, BOTTOM, SHOES, ACCESSORY, FULLSET
- `AvatarResourceStatus`: ACTIVE, INACTIVE, ARCHIVED

## Cài đặt

### 1. Tạo bảng database

```bash
# Chạy script tạo bảng
psql -d your_database -f scripts/create-avatar-tables.sql

# Insert dữ liệu mẫu
psql -d your_database -f scripts/insert-avatar-sample-data.sql
```

### 2. Cập nhật Prisma Schema

Thêm nội dung từ `prisma/avatar-schema.prisma` vào file `prisma/schema.prisma` chính:

```bash
# Generate Prisma client
npx prisma generate

# Chạy migration (nếu cần)
npx prisma db push
```

### 3. Cấu hình Routes

Thêm avatar routes vào app chính:

```typescript
// src/app.ts
import avatarRoutes from './routes/avatar';

app.use('/api/avatar', avatarRoutes);
```

## API Endpoints

### Avatar Categories

```http
# Lấy tất cả categories
GET /api/avatar/categories

# Lấy categories theo giới tính
GET /api/avatar/categories/gender/{gender}
```

### Avatar Resources

```http
# Tạo avatar resource mới (Admin only)
POST /api/avatar/resources
Content-Type: multipart/form-data

# Lấy danh sách avatar resources
GET /api/avatar/resources?gender=MALE&partType=HAIR&page=1&limit=20

# Lấy avatar resource theo ID
GET /api/avatar/resources/{id}

# Cập nhật avatar resource (Admin only)
PUT /api/avatar/resources/{id}

# Xóa avatar resource (Admin only)
DELETE /api/avatar/resources/{id}

# Lấy resources theo giới tính và loại phần
GET /api/avatar/resources/gender/{gender}/part/{partType}
```



## Ví dụ sử dụng

### 1. Upload Avatar Resource

```javascript
const formData = new FormData();
formData.append('file', glbFile);
formData.append('name', 'Male Hair Style 001');
formData.append('description', 'Classic short hair for male avatars');
formData.append('gender', 'MALE');
formData.append('partType', 'HAIR');
formData.append('categoryId', 'category-uuid');
formData.append('uniquePath', 'male/hair/male_hair_001');
formData.append('resourceId', 'male_hair_001');
formData.append('isFree', 'true');
formData.append('tags', JSON.stringify(['classic', 'short', 'professional']));

fetch('/api/avatar/resources', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer admin-token'
  },
  body: formData
});
```



### 3. Lấy Avatar Resources theo giới tính

```javascript
// Lấy tất cả hair styles cho nam
fetch('/api/avatar/resources/gender/MALE/part/HAIR?page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer api-key'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Male hair styles:', data.data);
  console.log('Pagination:', data.pagination);
});
```



## Cấu trúc thư mục S3

```
avatars/
├── male/
│   ├── body/
│   │   └── male_body_default.glb
│   ├── hair/
│   │   ├── male_hair_001.glb
│   │   ├── male_hair_002.glb
│   │   └── male_hair_003.glb
│   ├── top/
│   │   ├── male_tshirt_001.glb
│   │   └── male_shirt_formal_001.glb
│   ├── bottom/
│   │   ├── male_jeans_001.glb
│   │   └── male_pants_formal_001.glb
│   ├── shoes/
│   ├── accessory/
│   └── fullset/
├── female/
│   ├── body/
│   ├── hair/
│   ├── top/
│   ├── bottom/
│   ├── shoes/
│   ├── accessory/
│   └── fullset/
└── unisex/
    ├── accessory/
    └── shoes/
```

## Tích hợp với Frontend

### TypeScript Types

Sử dụng types từ `src/types/avatar.ts`:

```typescript
import {
  AvatarGender,
  AvatarPartType,
  AvatarResourceResponse,
  AvatarConfiguration
} from './types/avatar';
```

### Avatar Loader Service

```typescript
class AvatarLoaderService {
  async loadAvatarResources(gender: AvatarGender, partType: AvatarPartType) {
    const response = await fetch(
      `/api/avatar/resources/gender/${gender}/part/${partType}`
    );
    return response.json();
  }
  

  
  async customizeAvatar(config: AvatarConfiguration) {
    // Logic để apply cấu hình avatar
  }
}
```

## Quản lý Premium Content

### Cấp quyền truy cập

```sql
-- Cấp quyền truy cập avatar resource premium
INSERT INTO developer_avatar_permissions (
developer_id, avatar_resource_id, is_paid, paid_amount, granted_by
) VALUES (
'developer-id', 'premium-resource-id', true, 9.99, 'admin-id'
);


```

### Kiểm tra quyền truy cập

```typescript
class AvatarPermissionService {
  async checkResourceAccess(developerId: string, resourceId: string): Promise<boolean> {
  const permission = await prisma.developerAvatarPermission.findFirst({
    where: {
      developerId,
        avatarResourceId: resourceId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    
    return !!permission;
  }
}
```

## Monitoring và Analytics

### Theo dõi sử dụng

```typescript
// Track avatar usage
await prisma.avatarUsage.create({
  data: {
    avatarResourceId: resourceId,
    developerId: developerId,
    action: 'LOAD',
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
    metadata: { sessionId: sessionId }
  }
});
```

### Báo cáo thống kê

```sql
-- Top 10 avatar resources được sử dụng nhiều nhất
SELECT 
  ar.name,
  ar.gender,
  ar.part_type,
  COUNT(au.id) as usage_count
FROM avatar_resources ar
LEFT JOIN avatar_usage au ON ar.id = au.avatar_resource_id
WHERE au.created_at >= NOW() - INTERVAL '30 days'
GROUP BY ar.id, ar.name, ar.gender, ar.part_type
ORDER BY usage_count DESC
LIMIT 10;
```

## Bảo mật

### Authentication & Authorization

- **Public endpoints**: Lấy danh sách resources (với API key)
- **Admin endpoints**: Upload, update, delete resources
- **Premium content**: Kiểm tra quyền truy cập developer

### File Upload Security

- Chỉ chấp nhận file GLB
- Giới hạn kích thước file (50MB)
- Scan virus trước khi upload
- Validate file format

## Performance Optimization

### Caching Strategy

```typescript
// Cache avatar categories
const categories = await redis.get('avatar:categories');
if (!categories) {
  const data = await avatarService.getAvatarCategories();
  await redis.setex('avatar:categories', 3600, JSON.stringify(data));
}
```

### Database Indexing

- Index trên `gender`, `part_type`, `status`
- Composite index cho queries phổ biến
- GIN index cho arrays (tags, keywords)

## Troubleshooting

### Common Issues

1. **File upload fails**
   - Kiểm tra file format (phải là .glb)
   - Kiểm tra kích thước file (<50MB)
   - Kiểm tra S3 permissions

2. **Avatar not loading**
   - Kiểm tra S3 URL accessibility
   - Verify resource status (ACTIVE)
   - Check developer permissions for premium content

3. **Performance issues**
   - Enable caching
   - Optimize database queries
   - Use CDN for static assets

### Logs và Debugging

```typescript
// Enable debug logging
const logger = new Logger('AvatarService', { level: 'debug' });

// Monitor API performance
app.use('/api/avatar', (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});
```

## Migration từ hệ thống cũ

### Script migration

```sql
-- Migrate existing avatar data from resources table
INSERT INTO avatar_resources (
  name, description, s3_url, s3_key, file_size, 
  gender, part_type, category_id, unique_path, resource_id,
  is_premium, is_free, status, created_at, updated_at
)
SELECT 
  r.name,
  r.description,
  r.s3_url,
  r.s3_key,
  r.file_size,
  CASE 
    WHEN r.unique_path LIKE 'male/%' THEN 'MALE'
    WHEN r.unique_path LIKE 'female/%' THEN 'FEMALE'
    ELSE 'UNISEX'
  END as gender,
  CASE 
    WHEN r.unique_path LIKE '%/hair/%' THEN 'HAIR'
    WHEN r.unique_path LIKE '%/top/%' THEN 'TOP'
    WHEN r.unique_path LIKE '%/bottom/%' THEN 'BOTTOM'
    WHEN r.unique_path LIKE '%/shoes/%' THEN 'SHOES'
    WHEN r.unique_path LIKE '%/accessory/%' THEN 'ACCESSORY'
    WHEN r.unique_path LIKE '%/body/%' THEN 'BODY'
    ELSE 'FULLSET'
  END as part_type,
  'default-category-id' as category_id,
  r.unique_path,
  r.unique_path as resource_id,
  r.is_premium,
  r.is_free,
  r.status,
  r.created_at,
  r.updated_at
FROM resources r
WHERE r.file_type = 'model/gltf-binary'
  AND r.unique_path IS NOT NULL;
```

## Kết luận

Hệ thống Avatar Management cung cấp:

✅ **Tách biệt rõ ràng** với hệ thống resource chính
✅ **Phân loại chi tiết** theo giới tính và loại phần

✅ **Premium content** với permission system
✅ **API RESTful** đầy đủ
✅ **TypeScript support** cho frontend
✅ **Monitoring và analytics**
✅ **Scalable architecture**

Hệ thống này cho phép quản lý avatar GLB một cách hiệu quả, dễ mở rộng và tích hợp tốt với frontend applications.