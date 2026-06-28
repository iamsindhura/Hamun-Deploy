const { generateJournal } = require('./app/actions/journal');

async function main() {
  const result = await generateJournal("Neutral");
  console.log(JSON.stringify(result.journal?.insights, null, 2));
}

main().catch(console.error);
