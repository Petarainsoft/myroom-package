const { PrismaClient } = require('@prisma/client');

// Connect to PostgreSQL running in Docker
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://anh:db123456@localhost:5432/myroom_db'
    }
  }
});

async function checkResource() {
  try {
    const resourceId = 'cmdj3bz9e009vgnx79raifn28';
    
    console.log(`Checking resource with ID: ${resourceId}`);
    
    // Check in items table
    const item = await prisma.item.findFirst({
      where: { resourceId: resourceId },
      select: {
        id: true,
        name: true,
        resourceId: true,
        status: true,
        isPremium: true,
        s3Key: true
      }
    });
    
    console.log('Item found:', item);
    
    // Check in avatars table
    const avatar = await prisma.avatar.findFirst({
      where: { resourceId: resourceId },
      select: {
        id: true,
        name: true,
        resourceId: true,
        isPremium: true,
        isFree: true,
        s3Key: true,
        deletedAt: true
      }
    });
    
    console.log('Avatar found:', avatar);
    
    // If item found, check permissions
    if (item) {
      const permissions = await prisma.developerResourcePermission.findMany({
        where: { resourceId: resourceId },
        select: {
          developerId: true,
          expiredAt: true
        }
      });
      console.log('Item permissions:', permissions);
    }
    
    // If avatar found, check permissions
    if (avatar) {
      const permissions = await prisma.developerAvatarPermission.findMany({
        where: { avatarResourceId: avatar.id },
        select: {
          developerId: true,
          expiresAt: true
        }
      });
      console.log('Avatar permissions:', permissions);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkResource();