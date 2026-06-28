const { saveJournal } = require('./app/actions/journal');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Mocking DB...");
  const dateStr = new Date().toISOString();
  
  // Create a journal with aiAnalysis directly in DB
  const user = await prisma.user.findFirst();
  let j = await prisma.journal.findFirst({ orderBy: { date: 'desc' } });
  
  // Let's manually push aiAnalysis into it
  const insights = j.insights || {};
  insights.aiAnalysis = { score: 99, label: "Test" };
  
  await prisma.journal.update({
    where: { id: j.id },
    data: { insights }
  });
  
  console.log("Saved aiAnalysis to DB. Checking it...");
  j = await prisma.journal.findUnique({ where: { id: j.id } });
  console.log("DB Insights:", JSON.stringify(j.insights, null, 2));
  
  // Now call saveJournal mimicking the frontend
  // The frontend passes metadata.insights without aiAnalysis
  const metadata = {
    quote: "Quote",
    sticker: "Sticker",
    tags: [],
    productivityScore: 0,
    focusStreak: 0,
    insights: { title: "New Title", emotion: "Happy" }
  };
  
  console.log("Calling saveJournal...");
  const result = await saveJournal(dateStr, j.content, metadata);
  console.log("Result insights:", JSON.stringify(result.journal.insights, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
