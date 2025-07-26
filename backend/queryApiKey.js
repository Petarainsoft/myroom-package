const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const key = 'pk_307a6508cea8e3d309fa9bd5d4a6230e0a3d80a6b101a3c54f3f2f7ffc147e13';
  const apiKey = await prisma.apiKey.findUnique({ where: { key } });
  console.log(apiKey);
  await prisma.$disconnect();
})(); 