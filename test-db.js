const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const j = await prisma.journal.findFirst({ orderBy: { date: 'desc' } });
  console.log(JSON.stringify(j.insights, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
