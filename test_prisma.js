const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  try {
    const journal = await prisma.journal.create({ 
      data: { 
        userId: 'clxx123456789', // random
        date: new Date(), 
        originalText: '', 
        quote: '', 
        productivityScore: 0, 
        focusStreak: 0, 
        sticker: 'Neutral', 
        insights: {} 
      } 
    });
    console.log("Success:", journal.id);
  } catch (e) {
    console.error("Prisma Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
