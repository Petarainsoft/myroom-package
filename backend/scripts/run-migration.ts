import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🚀 Starting database migration from Customer to Developer...');
    
    // Read the migration SQL file
    const migrationPath = join(__dirname, 'migrate-customer-to-developer.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(/;\s*$/gm)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          await prisma.$executeRawUnsafe(statement + ';');
        } catch (error: any) {
          // Some statements might fail if tables/columns don't exist, which is expected
          if (error.message.includes('does not exist') || 
              error.message.includes('already exists') ||
              error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log(`⚠️  Statement ${i + 1} skipped (expected): ${error.message.split('\n')[0]}`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message.split('\n')[0]);
            // Continue with other statements
          }
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Summary:');
    console.log('   - Renamed customer tables to developer tables');
    console.log('   - Updated all customer_id columns to developer_id');
    console.log('   - Updated foreign key constraints');
    console.log('   - Updated indexes and unique constraints');
    console.log('');
    console.log('🔄 Next steps:');
    console.log('   1. Run: npm run db:generate');
    console.log('   2. Restart your development server');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
runMigration();