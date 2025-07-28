const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPresets() {
  try {
    const presets = await prisma.manifest.findMany({
      where: { projectId: 'default-project' },
      select: {
        id: true,
        name: true,
        version: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log('📋 Presets for default-project:', presets.length);
    presets.forEach(p => console.log(`- ${p.name} (${p.status}) - ${p.id}`));
    
    if (presets.length === 0) {
      console.log('❌ No presets found for default-project');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPresets();