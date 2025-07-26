import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Migration script to import default-preset.json into database
 * This script creates a default preset for each project that doesn't have one
 */
async function migrateDefaultPreset() {
  try {
    console.log('🚀 Starting default preset migration...');

    // Read the default preset file
    const presetPath = path.join(__dirname, '../../myroom-system/public/preset/default-preset.json');
    
    if (!fs.existsSync(presetPath)) {
      console.error('❌ Default preset file not found at:', presetPath);
      process.exit(1);
    }

    const defaultPresetContent = JSON.parse(fs.readFileSync(presetPath, 'utf8'));
    console.log('✅ Default preset file loaded successfully');

    // Get all projects
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        developerId: true,
      },
    });

    console.log(`📊 Found ${projects.length} projects`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const project of projects) {
      // Check if project already has a default-preset
      const existingPreset = await prisma.manifest.findFirst({
        where: {
          projectId: project.id,
          name: 'default-preset',
        },
      });

      if (existingPreset) {
        console.log(`⏭️  Project "${project.name}" already has default-preset, skipping...`);
        skippedCount++;
        continue;
      }

      // Create default preset for this project
      const preset = await prisma.manifest.create({
        data: {
          name: 'default-preset',
          description: 'Default room and avatar configuration',
          version: '1.0.0',
          projectId: project.id,
          status: 'ACTIVE',
          config: defaultPresetContent,
        },
      });

      console.log(`✅ Created default-preset for project "${project.name}" (ID: ${preset.id})`);
      createdCount++;
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   • Created: ${createdCount} presets`);
    console.log(`   • Skipped: ${skippedCount} projects (already had default-preset)`);
    console.log(`   • Total projects: ${projects.length}`);
    console.log('\n🎉 Default preset migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Create a global default preset that can be accessed by any API key
 * This is for backward compatibility with existing MyRoom systems
 */
async function createGlobalDefaultPreset() {
  try {
    console.log('🌍 Creating global default preset...');

    // Check if global default preset already exists
    // We'll use a special project ID or create a system project
    const systemProject = await prisma.project.findFirst({
      where: {
        name: 'system-presets',
      },
    });

    let projectId: string;

    if (!systemProject) {
      // Create system project for global presets
      // Note: This requires a system developer ID - you may need to adjust this
      const systemDeveloper = await prisma.developer.findFirst({
        where: {
          email: 'system@myroom.com', // Adjust as needed
        },
      });

      if (!systemDeveloper) {
        console.log('⚠️  No system developer found. Creating global preset under first available developer...');
        const firstDeveloper = await prisma.developer.findFirst();
        if (!firstDeveloper) {
          console.error('❌ No developers found in database');
          return;
        }
        
        const newSystemProject = await prisma.project.create({
          data: {
            name: 'system-presets',
            description: 'System-wide preset configurations',
            developerId: firstDeveloper.id,
          },
        });
        projectId = newSystemProject.id;
      } else {
        const newSystemProject = await prisma.project.create({
          data: {
            name: 'system-presets',
            description: 'System-wide preset configurations',
            developerId: systemDeveloper.id,
          },
        });
        projectId = newSystemProject.id;
      }
    } else {
      projectId = systemProject.id;
    }

    // Check if global default preset already exists
    const existingGlobalPreset = await prisma.manifest.findFirst({
      where: {
        projectId,
        name: 'default-preset',
      },
    });

    if (existingGlobalPreset) {
      console.log('✅ Global default preset already exists');
      return;
    }

    // Read the default preset file
    const presetPath = path.join(__dirname, '../../myroom-system/public/preset/default-preset.json');
    const defaultPresetContent = JSON.parse(fs.readFileSync(presetPath, 'utf8'));

    // Create global default preset
    const globalPreset = await prisma.manifest.create({
      data: {
        name: 'default-preset',
        description: 'Global default room and avatar configuration',
        version: '1.0.0',
        projectId,
        status: 'ACTIVE',
        config: defaultPresetContent,
      },
    });

    console.log(`✅ Created global default-preset (ID: ${globalPreset.id})`);
    console.log(`   Project ID: ${projectId}`);
    
  } catch (error) {
    console.error('❌ Failed to create global default preset:', error);
  }
}

// Main execution
async function main() {
  console.log('🔄 MyRoom Default Preset Migration');
  console.log('===================================\n');

  await migrateDefaultPreset();
  await createGlobalDefaultPreset();

  console.log('\n🏁 All migration tasks completed!');
}

// Run the migration
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
}

export { migrateDefaultPreset, createGlobalDefaultPreset };