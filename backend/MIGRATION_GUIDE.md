# Migration Guide: Customer to Developer

Hướng dẫn chi tiết để migration từ hệ thống Customer sang Developer một cách an toàn.

## Tổng quan

Quá trình migration này chuyển đổi toàn bộ hệ thống từ Customer-based sang Developer-based, bao gồm:
- Đổi tên bảng `customers` thành `developers`
- Cập nhật tất cả các cột `customer_id` thành `developer_id`
- Xử lý các ràng buộc khóa ngoại (foreign key constraints)
- Cập nhật indexes và constraints

## Các vấn đề thường gặp

### 1. Foreign Key Constraint Violations
**Lỗi:** `update or delete on table "avatar_categories" violates foreign key constraint "avatars_category_id_fkey"`

**Nguyên nhân:** Bảng `avatars` đang tham chiếu đến `avatar_categories`, không thể xóa dữ liệu.

### 2. Missing Default Value
**Lỗi:** `Added the required column 'developer_id' to the 'projects' table without a default value`

**Nguyên nhân:** Prisma không thể thêm cột NOT NULL mà không có giá trị mặc định khi bảng đã có dữ liệu.

## Các bước Migration an toàn

### Bước 1: Backup Database
```bash
# Backup database trước khi migration
docker exec myroom-postgres pg_dump -U myroom_user myroom_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Bước 2: Dừng Application
```bash
# Dừng container để tránh xung đột
docker-compose down
```

### Bước 3: Chạy Migration Script
```bash
# Khởi động chỉ database
docker-compose up -d postgres

# Chờ database sẵn sàng
sleep 10

# Chạy fix migration script
docker exec -i myroom-postgres psql -U myroom_user -d myroom_db < scripts/fix-migration-issues.sql

# Chạy main migration script
docker exec -i myroom-postgres psql -U myroom_user -d myroom_db < scripts/migrate-customer-to-developer.sql
```

### Bước 4: Reset và Sync Prisma Schema
```bash
# Force reset database schema (sẽ mất dữ liệu)
npx prisma db push --force-reset

# Hoặc nếu muốn giữ dữ liệu, chỉ sync schema
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### Bước 5: Khởi động lại Application
```bash
# Khởi động toàn bộ stack
docker-compose up -d

# Hoặc chỉ khởi động API
npm run dev
```

## Scripts có sẵn

### 1. `fix-migration-issues.sql`
- Xử lý foreign key constraint issues
- Thêm cột `developer_id` với giá trị mặc định
- Tạo default developer nếu cần
- Dọn dẹp các constraint có vấn đề

### 2. `migrate-customer-to-developer.sql`
- Migration chính từ Customer sang Developer
- Đổi tên bảng và cột
- Cập nhật foreign keys và indexes
- Xử lý tất cả bảng liên quan

### 3. `run-fix-migration.ts`
- Script TypeScript để chạy migration
- Có thể chạy từ Node.js environment

## Verification Scripts

### Kiểm tra Migration thành công
```sql
-- Kiểm tra bảng developers đã tồn tại
SELECT table_name FROM information_schema.tables WHERE table_name = 'developers';

-- Kiểm tra cột developer_id trong projects
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'developer_id';

-- Kiểm tra foreign key constraints
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE constraint_name LIKE '%developer%';
```

### Script TypeScript để verify
```typescript
// Chạy: npx ts-node scripts/verify-migration.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  try {
    // Test developers table
    const developers = await prisma.developer.findMany();
    console.log(`✅ Developers table: ${developers.length} records`);
    
    // Test projects with developer relationship
    const projects = await prisma.project.findMany({
      include: { developer: true }
    });
    console.log(`✅ Projects table: ${projects.length} records`);
    
    console.log('🎉 Migration verification successful!');
  } catch (error) {
    console.error('❌ Migration verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();
```

## Troubleshooting

### Nếu gặp lỗi "table does not exist"
```bash
# Reset hoàn toàn database
docker-compose down -v
docker-compose up -d postgres
npx prisma db push --force-reset
```

### Nếu gặp lỗi foreign key constraint
```sql
-- Tạm thời disable foreign key checks
SET foreign_key_checks = 0;
-- Chạy migration
-- Enable lại
SET foreign_key_checks = 1;
```

### Nếu cần rollback
```bash
# Restore từ backup
docker exec -i myroom-postgres psql -U myroom_user -d myroom_db < backup_YYYYMMDD_HHMMSS.sql
```

## Checklist sau Migration

- [ ] Database schema đã được cập nhật
- [ ] Prisma client đã được regenerate
- [ ] API endpoints hoạt động bình thường
- [ ] Authentication middleware hoạt động
- [ ] Swagger documentation đã được cập nhật
- [ ] Tests pass (nếu có)
- [ ] Frontend integration hoạt động (nếu có)

## Lưu ý quan trọng

1. **Luôn backup database** trước khi chạy migration
2. **Test trên environment development** trước khi áp dụng lên production
3. **Kiểm tra tất cả API endpoints** sau migration
4. **Cập nhật documentation** và code comments
5. **Thông báo cho team** về các thay đổi API

## Liên hệ hỗ trợ

Nếu gặp vấn đề trong quá trình migration, vui lòng:
1. Kiểm tra logs chi tiết
2. Chạy verification scripts
3. Tham khảo troubleshooting section
4. Liên hệ team development để được hỗ trợ