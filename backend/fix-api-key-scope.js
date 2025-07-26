const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixApiKeyScope() {
  const apiKey = 'pk_561d7d362779466716a039ab26c8366316a80fa1b7391a11b8d0fe9b91af1e54';
  
  try {
    console.log('🔧 Fixing API key scope...');
    
    // Update the API key with correct scopes
    const updated = await prisma.apiKey.update({
      where: { key: apiKey },
      data: { 
        scopes: ['read', 'write', 'resource:read', 'developer:read']
      }
    });
    
    console.log('✅ API key updated successfully!');
    console.log('New scopes:', updated.scopes);
    
    // Test the scope check
    const requiredScopes = ['resource:read'];
    const hasRequiredScope = requiredScopes.some(scope => 
      updated.scopes.includes(scope)
    );
    
    console.log('Has resource:read scope:', hasRequiredScope ? '✅' : '❌');
    
    if (hasRequiredScope) {
      console.log('🎉 API key should now work with resource APIs!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixApiKeyScope();