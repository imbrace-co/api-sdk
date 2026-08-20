import { ImbraceClient } from "@imbrace/sdk";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Make sure we load the correct .env file from the current directory
dotenv.config({ path: resolve(process.cwd(), ".env") });

const apiKey = process.env.IMBRACE_API_KEY;
const accessToken = process.env.IMBRACE_ACCESS_TOKEN;
const organizationId = process.env.IMBRACE_ORGANIZATION_ID;
const baseUrl = process.env.IMBRACE_GATEWAY_URL || "https://app-gatewayv2.imbrace.co";
const timeout = parseInt(process.env.IMBRACE_TIMEOUT || "60000");

console.log("\n--- Configuration check ---");
console.log("Base URL:", baseUrl);
console.log("API Key:", apiKey ? "Loaded (prefix: " + apiKey.substring(0, 5) + "...)" : "Empty");
console.log("Access Token:", accessToken ? "Loaded (prefix: " + accessToken.substring(0, 5) + "...)" : "Empty");
console.log("Organization ID:", organizationId ? "Loaded" : "Empty");
console.log("Timeout:", timeout, "ms");

if ((!apiKey && !accessToken) || !organizationId) {
  console.error("\n❌ ERROR: Missing configuration values in .env!");
  process.exit(1);
}

// Prefer the Access Token when both are present, since it has broader permissions across services
const useAccessToken = !!accessToken;
const client = new ImbraceClient({
  apiKey: !useAccessToken ? (apiKey || undefined) : undefined,
  accessToken: useAccessToken ? accessToken : undefined,
  baseUrl,
  timeout,
  organizationId: organizationId || undefined,
});

async function runTest() {
  const mode = useAccessToken ? "Access Token" : "API Key";
  console.log(`\n🚀 Starting Full Flow Test (Mode: ${mode})...`);

  try {
    // 0. Sanity Check - Use Health Check instead of getMe to avoid permission errors
    console.log("\n--- 0. Connectivity check (Health Check) ---");
    try {
      const health = await client.health.check();
      console.log("Gateway status:", JSON.stringify(health));
    } catch (e: any) {
      console.warn("Warning: Health check did not respond (the endpoint may not exist), trying the next step...");
    }

    console.log("\n--- 1. Assistant check ---");
    const assistants = await client.chatAi.listAiAgents();
    console.log("Existing assistants:", assistants.length);

    const assistant = await client.chatAi.createAiAgent({
      name: `SDK_TEST_${Date.now()}`,
      workflow_name: `test_bot_${Date.now()}`,
      description: "Test",
    });
    const assistantId = assistant.id;
    console.log("✅ Assistant created:", assistantId);

    // Clean up right after creation to test the delete feature
    await client.chatAi.deleteAiAgent(assistantId);
    console.log("✅ Assistant deleted successfully.");

    console.log("\n--- 2. Boards check ---");
    const boards = await client.boards.list({ limit: 1 });
    console.log("Number of CRM boards:", boards.data?.length ?? 0);

    console.log("\n✅ CONCLUSION: The SDK is working correctly!");

  } catch (error: any) {
    console.error("\n❌ TEST FAILED!");
    console.error("Error message:", error.message);
    if (error.statusCode) console.error("HTTP status code:", error.statusCode);
    console.error("Error details:", error);
  }
}

runTest();

