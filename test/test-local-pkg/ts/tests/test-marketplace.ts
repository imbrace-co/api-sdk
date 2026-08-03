import { pathToFileURL } from 'url';
import { client, runTestSection, logResult } from "../utils/utils.js";

async function testMarketplace() {
  console.log("\n🚀 Testing Marketplace Resource...");

  // Products/Orders/Installations/Categories were removed in v1.1.0 —
  // the marketplace microservice doesn't expose those endpoints. Tests below
  // cover what the new service does provide.

  await runTestSection("marketplace.listUseCaseTemplates", async () => {
    const templates = await client.marketplace.listUseCaseTemplates();
    logResult("UseCase Templates Count", templates.length);
  });

  await runTestSection("marketplace.listEmailTemplates", async () => {
    const templates = await client.marketplace.listEmailTemplates();
    logResult("Email Templates Count", templates.length);
  });

  console.log("\n✅ Marketplace Resource Testing Completed.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testMarketplace().catch(console.error);
}

export { testMarketplace };
