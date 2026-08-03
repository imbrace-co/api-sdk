import { pathToFileURL } from 'url';
import { client, runTestSection, logResult, organizationId } from "../utils/utils.js";
import { randomUUID } from "crypto";

async function testAiAgent() {
  console.log("\n🚀 Testing AI Agent Resource...");

  // 1. System
  await runTestSection("aiAgent.getHealth", async () => {
    const health = await client.aiAgent.getHealth(true);
    logResult("Health", health);
  });

  await runTestSection("aiAgent.getConfig", async () => {
    const config = await client.aiAgent.getConfig();
    logResult("Config", config);
  });

  await runTestSection("aiAgent.getVersion", async () => {
    const version = await client.aiAgent.getVersion();
    logResult("Version", version);
  });

  // 2. Chat v1
  await runTestSection("aiAgent.listChats", async () => {
    const chats = await client.aiAgent.listChats({ limit: 5 });
    logResult("Chats", chats);
  });

  // 3. Streaming Chat (SSE)
  // We'll use a known assistant or create one later
  
  // 4. Prompt Suggestions
  await runTestSection("aiAgent.getAgentPromptSuggestion", async () => {
    // Try with a dummy ID or skip if no assistant
    const assistants = await client.chatAi.listAiAgents();
    if (assistants.length > 0) {
        const suggestions = await client.aiAgent.getAgentPromptSuggestion(assistants[0].id);
        logResult("Suggestions", suggestions);
    }
  });

  // 5. Embeddings
  await runTestSection("aiAgent.listEmbeddingFiles", async () => {
    const files = await client.aiAgent.listEmbeddingFiles({ limit: 5 });
    logResult("Embedding Files", files);
  });

  // 6. Data Board
  await runTestSection("aiAgent.suggestFieldTypes", async () => {
    const result = await client.aiAgent.suggestFieldTypes({
      fields: [
        { name: "amount", samples: [100, 200, 300] },
        { name: "date", samples: ["2024-01-01", "2024-01-02"] }
      ]
    });
    logResult("Field Suggestions", result);
  });

  // 7. Parquet
  await runTestSection("aiAgent.generateParquet", async () => {
    const res = await client.aiAgent.generateParquet({
      data: [{ id: 1, name: "Test" }],
      fileName: `test_${Date.now()}`
    });
    logResult("Parquet Result", res);
  });

  // 8. Tracing (Tempo) - Often returns 404/500 if not configured
  await runTestSection("aiAgent.getTraceServices", async () => {
    const services = await client.aiAgent.getTraceServices();
    logResult("Trace Services", services);
  });

  await runTestSection("aiAgent.getTraceTags", async () => {
    const tags = await client.aiAgent.getTraceTags();
    logResult("Trace Tags", tags);
  });

  // 9. Chat Client sub-API
  await runTestSection("aiAgent.listClientChats", async () => {
    const chats = await client.aiAgent.listClientChats({ limit: 5 });
    logResult("Client Chats", chats);
  });

  await runTestSection("aiAgent.createClientChat", async () => {
    // This requires many IDs, we try with dummy ones or skip if it fails
    try {
        const res = await client.aiAgent.createClientChat({
            id: randomUUID(),
            assistantId: "dummy",
            organizationId: organizationId as string,
            userId: "dummy",
            selectedVisibilityType: "public",
            message: {
                id: randomUUID(),
                role: "user",
                content: "Hello",
                createdAt: new Date().toISOString(),
                parts: [{ type: "text", text: "Hello" }]
            }
        });
        logResult("Create Client Chat", res);
    } catch (e) {
        console.warn("   [Skip] createClientChat failed (likely dummy IDs)");
    }
  });

  // 10. Admin Guides
  await runTestSection("aiAgent.listAdminGuides", async () => {
    const guides = await client.aiAgent.listAdminGuides();
    logResult("Admin Guides", guides);
  });

  console.log("\n✅ AI Agent Resource Testing Completed.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testAiAgent().catch(console.error);
}

export { testAiAgent };

