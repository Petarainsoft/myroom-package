import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Script để rollback migration từ Developer về Customer
 * CẢNH BÁO: Script này sẽ làm mất dữ liệu được tạo sau migration
 */
async function runRollback() {
  console.log('⚠️  CẢNH BÁO: ROLLBACK MIGRATION');
  console.log('================================');
  console.log('Script này sẽ rollback database từ Developer về Customer');
  console.log('Tất cả dữ liệu được tạo sau migration sẽ bị mất!');
  console.log('');
  
  // Confirm rollback
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise<string>((resolve) => {
    readline.question('Bạn có chắc chắn muốn rollback? (yes/no): ', resolve);
  });
  
  readline.close();
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Rollback đã bị hủy');
    return;
  }
  
  try {
    console.log('\n🔄 Bắt đầu rollback...');
    
    // 1. Backup current state
    console.log('\n📦 Tạo backup trước khi rollback...');
    const backupFile = `backup_before_rollback_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    
    try {
      execSync(`docker exec myroom-postgres pg_dump -U myroom_user myroom_db > ${backupFile}`, {
        stdio: 'inherit'
      });
      console.log(`✅ Backup đã được tạo: ${backupFile}`);
    } catch (error) {
      console.warn(`⚠️  Không thể tạo backup: ${error}`);
      console.log('Tiếp tục rollback...');
    }
    
    // 2. Disconnect Prisma
    console.log('\n🔌 Ngắt kết nối Prisma...');
    await prisma.$disconnect();
    
    // 3. Run rollback SQL script
    console.log('\n🗄️  Chạy rollback SQL script...');
    const rollbackScriptPath = path.join(__dirname, 'rollback-migration.sql');
    
    if (!fs.existsSync(rollbackScriptPath)) {
      throw new Error(`Không tìm thấy rollback script: ${rollbackScriptPath}`);
    }
    
    execSync(`docker exec -i myroom-postgres psql -U myroom_user -d myroom_db < ${rollbackScriptPath}`, {
      stdio: 'inherit'
    });
    
    console.log('✅ Rollback SQL script đã hoàn thành');
    
    // 4. Instructions for manual steps
    console.log('\n📋 CÁC BƯỚC TIẾP THEO CẦN THỰC HIỆN THỦ CÔNG:');
    console.log('==========================================');
    console.log('1. Cập nhật Prisma schema:');
    console.log('   - Đổi model Developer thành Customer');
    console.log('   - Đổi tất cả developer_id thành customer_id');
    console.log('   - Cập nhật relationships');
    console.log('');
    console.log('2. Regenerate Prisma client:');
    console.log('   npx prisma generate');
    console.log('');
    console.log('3. Cập nhật code:');
    console.log('   - API routes (developer.ts -> customer.ts)');
    console.log('   - Middleware authentication');
    console.log('   - Services và controllers');
    console.log('   - Swagger documentation');
    console.log('');
    console.log('4. Restart application:');
    console.log('   npm run dev');
    console.log('');
    console.log('🎉 ROLLBACK HOÀN THÀNH!');
    console.log('Database đã được rollback về Customer-based system');
    
  } catch (error) {
    console.error('❌ ROLLBACK THẤT BẠI!');
    console.error('Lỗi:', error);
    
    if (error instanceof Error) {
      console.error('Chi tiết:', error.message);
    }
    
    console.log('\n🔧 Hướng dẫn khắc phục:');
    console.log('1. Kiểm tra Docker containers đang chạy');
    console.log('2. Kiểm tra kết nối database');
    console.log('3. Kiểm tra file rollback-migration.sql');
    console.log('4. Restore từ backup nếu cần thiết');
    
    process.exit(1);
  }
}

/**
 * Kiểm tra prerequisites
 */
function checkPrerequisites() {
  console.log('🔍 Kiểm tra prerequisites...');
  
  try {
    // Kiểm tra Docker
    execSync('docker --version', { stdio: 'pipe' });
    console.log('✅ Docker available');
    
    // Kiểm tra PostgreSQL container
    execSync('docker exec myroom-postgres pg_isready -U myroom_user', { stdio: 'pipe' });
    console.log('✅ PostgreSQL container running');
    
    // Kiểm tra rollback script
    const rollbackScriptPath = path.join(__dirname, 'rollback-migration.sql');
    if (fs.existsSync(rollbackScriptPath)) {
      console.log('✅ Rollback script found');
    } else {
      throw new Error('Rollback script not found');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Prerequisites check failed:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔄 Database Rollback Script');
  console.log('===========================\n');
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    console.log('\n❌ Prerequisites không đủ. Vui lòng kiểm tra:');
    console.log('1. Docker đang chạy');
    console.log('2. PostgreSQL container đang hoạt động');
    console.log('3. File rollback-migration.sql tồn tại');
    process.exit(1);
  }
  
  await runRollback();
}

// Chạy script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script thất bại:', error);
    process.exit(1);
  });
}

export { runRollback };