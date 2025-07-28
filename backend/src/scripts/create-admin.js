const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDefaultAdmin() {
  console.log('🌱 Creating default admin account...');

  try {
    // Check if any admin exists
    const existingAdminCount = await prisma.admin.count();
    
    if (existingAdminCount > 0) {
      console.log(`✅ Database already has ${existingAdminCount} admin(s). Skipping admin creation.`);
      return { success: true, message: 'Admin already exists' };
    }

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

    console.log('✅ Default super admin created successfully!');
    console.log(`📧 Email: ${defaultAdminEmail}`);
    console.log(`🔑 Password: ${defaultAdminPassword}`);
    console.log('⚠️  Please change the default password after first login!');

    // Create sample resource categories if none exist
    const categoryCount = await prisma.resourceCategory.count();
    if (categoryCount === 0) {
      const categories = [
        {
          name: 'Furniture',
          description: '3D furniture models for room visualization',
          isPremium: false,
        },
        {
          name: 'Textures',
          description: 'Material textures and patterns',
          isPremium: false,
        },
        {
          name: 'Lighting',
          description: 'Lighting fixtures and effects',
          isPremium: false,
        },
        {
          name: 'Decorations',
          description: 'Decorative items and accessories',
          isPremium: false,
        },
        {
          name: 'Premium Models',
          description: 'High-quality premium 3D models',
          isPremium: true,
          price: 49.99,
          metadata: { quality: 'premium' },
        },
      ];

      await prisma.resourceCategory.createMany({
        data: categories,
      });

      console.log('✅ Sample resource categories created!');
    }

    console.log('🎉 Admin setup completed successfully!');
    return { 
      success: true, 
      admin: { id: admin.id, email: admin.email, name: admin.name } 
    };
  } catch (error) {
    console.error('❌ Error during admin creation:', error);
    return { success: false, error: error.message };
  }
}

// Allow running as a standalone script or importing as a module
if (require.main === module) {
  createDefaultAdmin()
    .then((result) => {
      if (result.success) {
        console.log('✅ Script completed successfully');
        process.exit(0);
      } else {
        console.error('❌ Script failed:', result.error);
        process.exit(1);
      }
    })
    .catch((e) => {
      console.error('❌ Unexpected error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} else {
  // Export for use as a module
  module.exports = createDefaultAdmin;
}