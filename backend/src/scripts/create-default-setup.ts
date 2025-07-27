import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('🚀 Creating default developer and project setup...');

  try {
    // Check if default developer exists
    let developer = await prisma.developer.findUnique({
      where: { email: 'developer@myroom.com' },
    });

    if (!developer) {
      // Create default developer
      const hashedPassword = await bcrypt.hash('Developer123!', 12);
      
      developer = await prisma.developer.create({
        data: {
          name: 'Default Developer',
          email: 'developer@myroom.com',
          passwordHash: hashedPassword,
          status: 'ACTIVE',
        },
      });
      
      logger.info('✅ Default developer created successfully!');
      logger.info(`📧 Email: developer@myroom.com`);
      logger.info(`🔑 Password: Developer123!`);
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
      const keyValue = 'pk_test_1234567890abcdef1234567890abcdef';
      
      apiKey = await prisma.apiKey.create({
        data: {
          name: 'Default API Key',
          key: keyValue,
          projectId: project.id,
          status: 'ACTIVE',
          scopes: 'manifest:read,manifest:write,resource:read,project:read',
        },
      });
      
      logger.info('✅ Default API key created successfully!');
      logger.info(`🔑 API Key: ${keyValue}`);
    } else {
      logger.info('✅ Default API key already exists');
      logger.info(`🔑 API Key: ${apiKey.key}`);
    }

    logger.info('🎉 Default setup completed successfully!');
    logger.info('\n📋 Summary:');
    logger.info(`   Developer ID: ${developer.id}`);
    logger.info(`   Project ID: ${project.id}`);
    logger.info(`   API Key: ${apiKey.key}`);
    
  } catch (error) {
    logger.error('❌ Error during default setup:', error);
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