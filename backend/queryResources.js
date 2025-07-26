const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const total = await prisma.resource.count();
  const free = await prisma.resource.count({ where: { isFree: true } });
  console.log('total', total, 'free', free);
  const latest = await prisma.resource.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  console.log(latest);
  await prisma.$disconnect();
})(); 