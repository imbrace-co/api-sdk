import { pathToFileURL } from 'url';
import { client, runTestSection, logResult } from "../utils/utils.js";

async function testMarketplace() {
  console.log("\n🚀 Testing Marketplace Resource...");

  // 1. Products
  await runTestSection("marketplace.listProducts", async () => {
    const products = await client.marketplace.listProducts({ limit: 5 });
    logResult("Products Count", products.data.length);
  });

  // 2. Orders
  await runTestSection("marketplace.listOrders", async () => {
    const orders = await client.marketplace.listOrders({ limit: 5 });
    logResult("Orders Count", orders.data.length);
  });

  // 3. Misc
  await runTestSection("marketplace.listUseCaseTemplates", async () => {
    const templates = await client.marketplace.listUseCaseTemplates();
    logResult("UseCase Templates Count", templates.length);
  });

  await runTestSection("marketplace.listCategories", async () => {
    const categories = await client.marketplace.listCategories();
    logResult("Categories Count", categories.length);
  });

  console.log("\n✅ Marketplace Resource Testing Completed.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testMarketplace().catch(console.error);
}

export { testMarketplace };

