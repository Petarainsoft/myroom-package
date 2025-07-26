const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateApiKeyScope() {
  const apiKey = 'pk_561d7d362779466716a039ab26c8366316a80fa1b7391a11b8d0fe9b91af1e54';
  const newScopes = ['read', 'write', 'resource:read'];

  try {
    const updated = await prisma.apiKey.update({
      where: { key: apiKey },
      data: { scopes: newScopes }
    });
    console.log('✅ Updated API key scopes:', updated.scopes);
  } catch (error) {
    console.error('❌ Error updating API key:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateApiKeyScope(); 