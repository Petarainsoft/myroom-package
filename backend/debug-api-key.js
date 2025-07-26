const { PrismaClient } = require('@prisma/client');

console.log('🚀 Starting debug script...');

const prisma = new PrismaClient();

async function debugApiKey() {
  const apiKey = 'pk_9dd7a67c7c6d69c7f5ae603bd78656944d61667257ce60c59a676d35ccb6a16f';
  
  try {
    console.log('🔍 Debugging API key:', apiKey);
    
    // Test database connection
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // Get API key from database
    console.log('🔍 Querying API key from database...');
    const key = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        project: {
          include: {
            developer: true
          }
        }
      }
    });

    console.log('Query result:', key);

    if (!key) {
      console.log('❌ API Key not found');
      return;
    }

    console.log('✅ API Key found in database:');
    console.log('ID:', key.id);
    console.log('Name:', key.name);
    console.log('Scopes (from DB):', key.scopes);
    console.log('Scopes type:', typeof key.scopes);
    console.log('Scopes length:', key.scopes.length);
    console.log('Scopes includes resource:read:', key.scopes.includes('resource:read'));
    
    // Test the requireScope logic
    const requiredScopes = ['resource:read'];
    const hasRequiredScope = requiredScopes.some(scope => 
      key.scopes.includes(scope) || key.scopes.includes('*')
    );
    
    console.log('\n🔍 Testing requireScope logic:');
    console.log('Required scopes:', requiredScopes);
    console.log('API key scopes:', key.scopes);
    console.log('Has required scope:', hasRequiredScope);
    
    // Test each scope individually
    requiredScopes.forEach(scope => {
      const hasScope = key.scopes.includes(scope);
      console.log(`Scope "${scope}": ${hasScope ? '✅' : '❌'}`);
    });

    console.log('\n📋 Developer info:');
  console.log('Developer ID:', key.project.developer.id);
  console.log('Developer Name:', key.project.developer.name);
  console.log('Developer Email:', key.project.developer.email);
  console.log('Developer Status:', key.project.developer.status);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error stack:', error.stack);
  } finally {
    console.log('🔌 Disconnecting from database...');
    await prisma.$disconnect();
    console.log('✅ Disconnected');
  }
}

debugApiKey().catch(console.error);