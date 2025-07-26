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
      const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@myroom.com';
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

    // Create sample resource categories if none exist
    const categoryCount = await prisma.itemCategory.count();
    if (categoryCount === 0) {
      const categories = [
        {
          name: 'Furniture',
          description: '3D furniture models for room visualization',
          isActive: true,
          path: '/furniture',
          metadata: { type: 'furniture' },
        },
        {
          name: 'Textures',
          description: 'Material textures and patterns',
          isActive: true,
          path: '/textures',
          metadata: { type: 'texture' },
        },
        {
          name: 'Lighting',
          description: 'Lighting fixtures and effects',
          isActive: true,
          path: '/lighting',
          metadata: { type: 'lighting' },
        },
        {
          name: 'Decorations',
          description: 'Decorative items and accessories',
          isActive: true,
          path: '/decorations',
          metadata: { type: 'decoration' },
        },
        {
          name: 'Premium Models',
          description: 'High-quality premium 3D models',
          isActive: true,
          path: '/premium-models',
          metadata: { type: 'premium', quality: 'premium' },
        },
      ];

      await prisma.itemCategory.createMany({
        data: categories,
      });

      logger.info(`✅ Created ${categories.length} resource categories!`);
    } else {
      logger.info(`✅ Database already has ${categoryCount} categories`);
    }

    logger.info('🎉 Database seeding completed successfully!');
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
