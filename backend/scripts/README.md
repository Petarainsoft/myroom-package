# Migration Scripts

Thư mục này chứa các scripts để migration database từ Customer sang Developer và các công cụ liên quan.

## Tổng quan Scripts

### Migration Scripts
- `migrate-customer-to-developer.sql` - Script SQL chính để migration
- `fix-migration-issues.sql` - Script khắc phục các vấn đề migration
- `run-migration.ts` - Script TypeScript để chạy migration
- `run-fix-migration.ts` - Script TypeScript để khắc phục lỗi

### Verification Scripts
- `verify-migration.ts` - Script kiểm tra migration thành công

### Rollback Scripts
- `rollback-migration.sql` - Script SQL để rollback về Customer
- `run-rollback.ts` - Script TypeScript để chạy rollback

## Cách sử dụng

### 1. Migration từ Customer sang Developer

```bash
# Bước 1: Backup database
docker exec myroom-postgres pg_dump -U myroom_user myroom_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Bước 2: Chạy fix migration (nếu gặp lỗi)
npx ts-node scripts/run-fix-migration.ts

# Bước 3: Chạy migration chính
docker exec -i myroom-postgres psql -U myroom_user -d myroom_db < scripts/migrate-customer-to-developer.sql

# Bước 4: Sync Prisma schema
npx prisma db push --force-reset
npx prisma generate

# Bước 5: Verify migration
npx ts-node scripts/verify-migration.ts
```

### 2. Verification

```bash
# Kiểm tra migration thành công
npx ts-node scripts/verify-migration.ts
```

### 3. Rollback (nếu cần)

```bash
# Rollback về Customer system
npx ts-node scripts/run-rollback.ts

# Hoặc chạy trực tiếp SQL
docker exec -i myroom-postgres psql -U myroom_user -d myroom_db < scripts/rollback-migration.sql
```

## Các vấn đề thường gặp

### 1. Foreign Key Constraint Error
```
ERROR: update or delete on table "avatar_categories" violates foreign key constraint
```
**Giải pháp:** Chạy `fix-migration-issues.sql` trước

### 2. Missing Default Value Error
```
Added the required column 'developer_id' to the 'projects' table without a default value
```
**Giải pháp:** Script `fix-migration-issues.sql` sẽ xử lý vấn đề này

### 3. Table Not Found
```
Table 'customers' doesn't exist
```
**Giải pháp:** Kiểm tra database schema hiện tại, có thể đã migration rồi

## Lưu ý quan trọng

⚠️ **LUÔN BACKUP DATABASE** trước khi chạy migration

⚠️ **TEST TRÊN DEVELOPMENT** trước khi áp dụng lên production

⚠️ **ROLLBACK SẼ MẤT DỮ LIỆU** được tạo sau migration

## Troubleshooting

### Kiểm tra Docker containers
```bash
docker-compose ps
```

### Kiểm tra database connection
```bash
docker exec myroom-postgres pg_isready -U myroom_user
```

### Xem logs database
```bash
docker logs myroom-postgres
```

### Reset hoàn toàn database
```bash
docker-compose down -v
docker-compose up -d postgres
npx prisma db push --force-reset
```

## Liên hệ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs chi tiết
2. Chạy verification script
3. Tham khảo MIGRATION_GUIDE.md
4. Liên hệ team development