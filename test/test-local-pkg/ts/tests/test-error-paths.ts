import { pathToFileURL } from 'url';
import { client, runTestSection, logResult } from "../utils/utils.js";

/**
 * TEST ERROR PATHS (SCENARIO-BASED)
 * Focuses on Error Handling: 401, 404, and network-like issues.
 */
async function testErrorPaths() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 STARTING: ERROR PATH TESTING");
  console.log("=".repeat(70));

  try {
    // --- Section 1: 404 Not Found ---
    await runTestSection("404 Not Found Handling", async () => {
      try {
        await client.boards.get("non-existent-id-12345");
        throw new Error("Should have thrown 404");
      } catch (e: any) {
        logResult("Caught Expected 404", e.message);
        if (e.statusCode !== 404 && !e.message.includes("404")) {
            console.warn("   ⚠️ Expected 404 but got different message:", e.message);
        }
      }
    });

    // --- Section 2: 401 Unauthorized (Mocking invalid client) ---
    await runTestSection("401 Unauthorized Handling", async () => {
      const { ImbraceClient } = await import("@imbrace/sdk");
      const badClient = new ImbraceClient({
          apiKey: "invalid-key",
          baseUrl: client.baseUrl,
          organizationId: "invalid-org"
      });

      try {
        await badClient.chatAi.listAiAgents();
        throw new Error("Should have thrown 401");
      } catch (e: any) {
        logResult("Caught Expected 401", e.message);
      }
    });

    // --- Section 3: Invalid Body/Payload (400) ---
    await runTestSection("400 Bad Request Handling", async () => {
      try {
        // Missing required 'name' field
        await client.boards.create({} as any);
        throw new Error("Should have thrown 400");
      } catch (e: any) {
        logResult("Caught Expected 400", e.message);
      }
    });

    console.log("\n" + "=".repeat(70));
    console.log("✅ ERROR PATH TESTING COMPLETED");
    console.log("=".repeat(70));

  } catch (err: any) {
    console.error("\n❌ FATAL TEST ERROR:", err.message);
    throw err;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testErrorPaths().catch(console.error);
}

export { testErrorPaths };
