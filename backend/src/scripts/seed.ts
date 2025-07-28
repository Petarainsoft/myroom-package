import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Starting database seeding...');

  try {
    // Check if any admin exists
    const existingAdminCount = await prisma.admin.count();

    if (existingAdminCount > 0) {
      logger.info(
        `✅ Database already has ${existingAdminCount} admin(s). Skipping admin creation.`
      );
    } else {
      // Create default super admin
      const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@petarainsoft.com';
      const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';
      const defaultAdminName = process.env.DEFAULT_ADMIN_NAME || 'Super Administrator';

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(defaultAdminPassword, saltRounds);

      const admin = await prisma.admin.create({
        data: {
          name: defaultAdminName,
          email: defaultAdminEmail,
          passwordHash: hashedPassword,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
        },
      });

      logger.info('✅ Default super admin created successfully!');
      logger.info(`📧 Email: ${defaultAdminEmail}`);
      logger.info(`🔑 Password: ${defaultAdminPassword}`);
      logger.info('⚠️  Please change the default password after first login!');
    }

    // Create default developer and project setup
    logger.info('🚀 Creating default developer and project setup...');
    
    // Check if default developer exists
    let developer = await prisma.developer.findUnique({
      where: { email: 'developer@petarainsoft.com' },
    });

    if (!developer) {
      // Create default developer
      const hashedPassword = await bcrypt.hash('Dev123!', 12);
      
      developer = await prisma.developer.create({
        data: {
          name: 'Default Developer',
          email: 'developer@myroom.com',
          passwordHash: hashedPassword,
          status: 'ACTIVE',
        },
      });
      
      logger.info('✅ Default developer created successfully!');
      logger.info(`📧 Email: developer@petarainsoft.com`);
      logger.info(`🔑 Password: Dev123!`);
    } else {
      logger.info('✅ Default developer already exists');
    }

    // Check if default project exists
    let project = await prisma.project.findFirst({
      where: {
        developerId: developer.id,
        name: 'Default Project',
      },
    });

    if (!project) {
      // Create default project
      project = await prisma.project.create({
        data: {
          id: 'default-project', // Set specific ID
          name: 'Default Project',
          description: 'Default project for MyRoom development',
          developerId: developer.id,
          status: 'ACTIVE',
        },
      });
      
      logger.info('✅ Default project created successfully!');
      logger.info(`🆔 Project ID: ${project.id}`);
    } else {
      logger.info('✅ Default project already exists');
    }

    // Check if API key exists for this project
    let apiKey = await prisma.apiKey.findFirst({
      where: {
        projectId: project.id,
        status: 'ACTIVE',
      },
    });

    if (!apiKey) {
      // Create default API key
      const keyValue = 'pk_9dd7a67c7c6d69c7f5ae603bd78656944d61667257ce60c59a676d35ccb6a16f';
      
      apiKey = await prisma.apiKey.create({
        data: {
          name: 'Default API Key',
          key: keyValue,
          projectId: project.id,
          status: 'ACTIVE',
          scopes: 'developer:read,developer:write,project:read,project:write,apikey:read,resource:read,manifest:read,manifest:write,resources:read,avatar:read,manifests:read',
        },
      });
      
      logger.info('✅ Default API key created successfully!');
      logger.info(`🔑 API Key: ${keyValue}`);
    } else {
      logger.info('✅ Default API key already exists');
      logger.info(`🔑 API Key: ${apiKey.key}`);
    }

    // Create sample resource categories if none exist
    // const categoryCount = await prisma.itemCategory.count();
    // if (categoryCount === 0) {
    //   const categories = [
    //     {
    //       name: 'Furniture',
    //       description: '3D furniture models for room visualization',
    //       isActive: true,
    //       path: '/furniture',
    //       metadata: { type: 'furniture' },
    //     },
    //     {
    //       name: 'Textures',
    //       description: 'Material textures and patterns',
    //       isActive: true,
    //       path: '/textures',
    //       metadata: { type: 'texture' },
    //     },
    //     {
    //       name: 'Lighting',
    //       description: 'Lighting fixtures and effects',
    //       isActive: true,
    //       path: '/lighting',
    //       metadata: { type: 'lighting' },
    //     },
    //     {
    //       name: 'Decorations',
    //       description: 'Decorative items and accessories',
    //       isActive: true,
    //       path: '/decorations',
    //       metadata: { type: 'decoration' },
    //     },
    //     {
    //       name: 'Premium Models',
    //       description: 'High-quality premium 3D models',
    //       isActive: true,
    //       path: '/premium-models',
    //       metadata: { type: 'premium', quality: 'premium' },
    //     },
    //   ];

    //   await prisma.itemCategory.createMany({
    //     data: categories,
    //   });

    //   logger.info(`✅ Created ${categories.length} resource categories!`);
    // } else {
    //   logger.info(`✅ Database already has ${categoryCount} categories`);
    // }

    logger.info('🎉 Database seeding completed successfully!');
    logger.info('\n📋 Summary:');
    logger.info(`   Developer ID: ${developer.id}`);
    logger.info(`   Project ID: ${project.id}`);
    logger.info(`   API Key: ${apiKey.key}`);
  } catch (error) {
    logger.error('❌ Error during database seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
