require('dotenv').config();
// Programmatically clear simulation variables to test actual provider API calls
delete process.env.SIMULATE_FAIL_PROVIDERS;

const { generateJournal } = require('./app/actions/journal');

async function main() {
  console.log("Running real generateJournal call to diagnose actual API responses...");
  const start = Date.now();
  try {
    const result = await generateJournal("Neutral");
    console.log("SUCCESS in", Date.now() - start, "ms!");
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("CRITICAL FAILURE in", Date.now() - start, "ms!");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    if (error.cause) {
      console.error("Error Cause:", error.cause);
      if (error.cause.cause) {
        console.error("Inner Error Cause:", error.cause.cause);
      }
    }
    if (error.stack) {
      console.error("Error Stack:", error.stack);
    }
  }
}

main().catch(console.error);
