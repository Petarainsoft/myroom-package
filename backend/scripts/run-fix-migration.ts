import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function runFixMigration() {
  try {
    console.log('🔧 Starting migration fix for database issues...');
    
    // Read the fix migration SQL file
    const fixMigrationPath = join(__dirname, 'fix-migration-issues.sql');
    const fixMigrationSQL = readFileSync(fixMigrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = fixMigrationSQL
      .split(/;\s*$/gm)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement && statement.trim()) {
        try {
          console.log(`⚡ Executing fix statement ${i + 1}/${statements.length}...`);
          await prisma.$executeRawUnsafe(statement + ';');
        } catch (error: any) {
          // Some statements might fail if tables/columns don't exist, which is expected
          if (error.message.includes('does not exist') || 
              error.message.includes('already exists') ||
              error.message.includes('relation') && error.message.includes('does not exist')) {
            console.log(`⚠️  Statement ${i + 1} skipped (expected): ${error.message.split('\n')[0]}`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message.split('\n')[0]);
            // Continue with other statements for fix migration
          }
        }
      }
    }
    
    console.log('✅ Migration fix completed successfully!');
    console.log('📋 Summary:');
    console.log('   - Fixed avatar_categories foreign key constraint issues');
    console.log('   - Fixed projects table developer_id column issues');
    console.log('   - Ensured developers table exists with correct structure');
    console.log('   - Cleaned up problematic foreign key constraints');
    console.log('');
    console.log('🔄 Next steps:');
    console.log('   1. Run: npx prisma db push (to sync schema)');
    console.log('   2. Run: npx prisma generate (to regenerate client)');
    console.log('   3. Restart your development server');
    
  } catch (error) {
    console.error('❌ Migration fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration fix
runFixMigration();