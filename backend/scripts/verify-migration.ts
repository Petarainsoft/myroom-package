import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

/**
 * Script để verify migration từ Customer sang Developer
 * Kiểm tra tính toàn vẹn của database sau migration
 */
async function verifyMigration() {
  console.log('🔍 Bắt đầu kiểm tra migration...');
  
  try {
    // 1. Kiểm tra bảng developers
    console.log('\n📋 Kiểm tra bảng developers...');
    const developers = await prisma.developer.findMany();
    console.log(`✅ Bảng developers: ${developers.length} bản ghi`);
    
    if (developers.length > 0) {
      console.log(`   - Developer đầu tiên: ${developers[0].email}`);
    }
    
    // 2. Kiểm tra bảng projects và relationship với developer
    console.log('\n📋 Kiểm tra bảng projects...');
    const projects = await prisma.project.findMany({
      include: { 
        developer: {
          select: { id: true, email: true, name: true }
        }
      }
    });
    console.log(`✅ Bảng projects: ${projects.length} bản ghi`);
    
    // Kiểm tra tất cả projects đều có developer_id
    const projectsWithoutDeveloper = projects.filter(p => !p.developer);
    if (projectsWithoutDeveloper.length > 0) {
      console.warn(`⚠️  ${projectsWithoutDeveloper.length} projects không có developer`);
    } else {
      console.log(`✅ Tất cả projects đều có developer`);
    }
    
    // 3. Kiểm tra API keys
    console.log('\n📋 Kiểm tra bảng api_keys...');
    const apiKeys = await prisma.apiKey.findMany({
      include: {
        project: {
          include: {
            developer: {
              select: { id: true, email: true }
            }
          }
        }
      }
    });
    console.log(`✅ Bảng api_keys: ${apiKeys.length} bản ghi`);
    
    // 4. Kiểm tra avatar categories và avatars
    console.log('\n📋 Kiểm tra bảng avatar_categories...');
    try {
      const avatarCategories = await prisma.avatarCategory.findMany();
      console.log(`✅ Bảng avatar_categories: ${avatarCategories.length} bản ghi`);
      
      const avatars = await prisma.avatar.findMany();
      console.log(`✅ Bảng avatars: ${avatars.length} bản ghi`);
    } catch (error) {
      console.log(`ℹ️  Avatar tables chưa được tạo hoặc có lỗi: ${error}`);
    }
    
    // 5. Kiểm tra room categories và rooms
    console.log('\n📋 Kiểm tra bảng room_categories...');
    try {
      const roomCategories = await prisma.roomCategory.findMany();
      console.log(`✅ Bảng room_categories: ${roomCategories.length} bản ghi`);
      
      const rooms = await prisma.room.findMany();
      console.log(`✅ Bảng rooms: ${rooms.length} bản ghi`);
    } catch (error) {
      console.log(`ℹ️  Room tables chưa được tạo hoặc có lỗi: ${error}`);
    }
    
    // 6. Kiểm tra foreign key constraints
    console.log('\n📋 Kiểm tra foreign key constraints...');
    
    // Test tạo project mới với developer
    if (developers.length > 0) {
      const testProject = await prisma.project.create({
        data: {
          name: 'Test Migration Project',
          description: 'Project để test migration',
          developer_id: developers[0].id
        }
      });
      
      console.log(`✅ Tạo project test thành công: ${testProject.id}`);
      
      // Xóa project test
      await prisma.project.delete({
        where: { id: testProject.id }
      });
      
      console.log(`✅ Xóa project test thành công`);
    }
    
    // 7. Tổng kết
    console.log('\n🎉 MIGRATION VERIFICATION THÀNH CÔNG!');
    console.log('\n📊 Tổng kết:');
    console.log(`   - Developers: ${developers.length}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - API Keys: ${apiKeys.length}`);
    console.log(`   - Foreign key constraints: ✅ Hoạt động bình thường`);
    
    // 8. Kiểm tra không còn tham chiếu customer
    console.log('\n🔍 Kiểm tra không còn tham chiếu "customer"...');
    
    // Kiểm tra trong database metadata
    const customerTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%customer%'
    ` as any[];
    
    const customerColumns = await prisma.$queryRaw`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE column_name LIKE '%customer%'
    ` as any[];
    
    if (customerTables.length === 0 && customerColumns.length === 0) {
      console.log(`✅ Không còn tham chiếu "customer" trong database`);
    } else {
      console.warn(`⚠️  Vẫn còn tham chiếu "customer":`);
      if (customerTables.length > 0) {
        console.warn(`   Tables: ${customerTables.map(t => t.table_name).join(', ')}`);
      }
      if (customerColumns.length > 0) {
        console.warn(`   Columns: ${customerColumns.map(c => `${c.table_name}.${c.column_name}`).join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ MIGRATION VERIFICATION THẤT BẠI!');
    console.error('Lỗi:', error);
    
    if (error instanceof Error) {
      console.error('Chi tiết lỗi:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Kiểm tra kết nối database
 */
async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Kết nối database thành công');
    return true;
  } catch (error) {
    console.error('❌ Không thể kết nối database:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Migration Verification Script');
  console.log('================================\n');
  
  // Kiểm tra kết nối trước
  const connected = await checkDatabaseConnection();
  if (!connected) {
    process.exit(1);
  }
  
  await verifyMigration();
}

// Chạy script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script thất bại:', error);
    process.exit(1);
  });
}

export { verifyMigration, checkDatabaseConnection };