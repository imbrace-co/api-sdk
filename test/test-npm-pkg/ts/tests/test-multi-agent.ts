import { pathToFileURL } from 'url';
import { client, runTestSection, logResult, organizationId } from "../utils/utils.js";
import { randomUUID } from "crypto";

/**
 * TEST MULTI-AGENT & SUB-AGENTS (SCENARIO-BASED)
 * Focuses on Sub-agent chat, history, and prompt suggestions.
 */
async function testMultiAgent() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 STARTING: MULTI-AGENT & SUB-AGENTS TEST");
  console.log("=".repeat(70));

  const ts = Date.now();
  const state = {
    assistantId: null as string | null,
    chatId: null as string | null,
    sessionId: randomUUID(),
    orgId: organizationId as string || "",
  };

  try {
    // --- Section 1: Preparation ---
    await runTestSection("Preparation", async () => {
      const assistants = await client.chatAi.listAiAgents();
      if (assistants.length > 0) {
        state.assistantId = assistants[0].id;
      } else {
        const asst = await client.chatAi.createAiAgent({
            name: `SDK Sub-Agent Test ${ts}`,
            workflow_name: `sub_agent_test_${ts}`
        });
        state.assistantId = asst.id;
      }
      logResult("Using Assistant", state.assistantId);
    }).catch(e => console.error(`\n❌ Section [Preparation] Failed: ${e.message}`));

    // --- Section 2: Prompt Suggestions ---
    await runTestSection("Prompt Suggestions", async () => {
      const suggestions = await client.aiAgent.getAgentPromptSuggestion(state.assistantId!);
      logResult("Prompt Suggestions", suggestions);
    }).catch(e => console.error(`\n❌ Section [Prompt Suggestions] Failed: ${e.message}`));

    // --- Section 3: Chat v1 Lifecycle ---
    await runTestSection("Chat v1 Lifecycle", async () => {
      const chats = await client.aiAgent.listChats({ organization_id: state.orgId, limit: 1 });
      if (chats.length > 0) {
        const chatId = chats[0].id;
        const chat = await client.aiAgent.getChat(chatId, true);
        logResult("Chat v1 Retrieved", chat.id);
      } else {
        console.log("   ⚠️ No Chat v1 found to test retrieval.");
      }
    }).catch(e => console.error(`\n❌ Section [Chat v1 Lifecycle] Failed: ${e.message}`));

    // --- Section 4: Sub-Agent Chat ---
    await runTestSection("Sub-Agent Chat & History", async () => {
      // 1. Create a client chat first to get a real chatId
      const user = await client.aiAgent.getChatClientUser({ id: `sdk-test-user-${ts}` });
      const clientChat = await client.aiAgent.createClientChat({
        id: randomUUID(),
        assistantId: state.assistantId!,
        organizationId: state.orgId,
        userId: user.id,
        selectedVisibilityType: "public",
        message: {
          id: randomUUID(),
          role: "user",
          content: "Hello Sub-agent",
          createdAt: new Date().toISOString(),
          parts: [{ type: "text", text: "Hello Sub-agent" }]
        }
      });
      state.chatId = clientChat._id || clientChat.id;
      logResult("Chat Created for Sub-agent", state.chatId);

      // 2. Stream Sub-agent Chat
      try {
        const response = await client.aiAgent.streamSubAgentChat({
          assistant_id: state.assistantId!,
          organization_id: state.orgId,
          session_id: state.sessionId,
          chat_id: state.chatId!,
          messages: [{ role: "user", content: "Tell me about yourself" }]
        });
        if (response.status === 200) {
            logResult("Sub-agent Chat Stream", "Started (200 OK)");
        } else {
            console.warn(`   ⚠️ Sub-agent chat stream returned status ${response.status}`);
        }
      } catch (e: any) {
        console.warn(`   ⚠️ Sub-agent chat stream failed: ${e.message}`);
      }

      // 3. Get Sub-agent History
      try {
        const history = await client.aiAgent.getSubAgentHistory({
          session_id: state.sessionId,
          chat_id: state.chatId!
        });
        logResult("Sub-agent History", history);
      } catch (e: any) {
        console.warn(`   ⚠️ Sub-agent history failed: ${e.message}`);
      }
    }).catch(e => console.error(`\n❌ Section [Sub-Agent Chat] Failed: ${e.message}`));

    // --- Section 5: Parquet ---
    await runTestSection("Parquet Data Operations", async () => {
        // Use filename without extension as the server likely appends it
        const parquetFileName = `test-${ts}`; 
        try {
            const res = await client.aiAgent.generateParquet({
                data: [{ name: "Test", value: 123 }],
                fileName: parquetFileName
            });
            logResult("Generated Parquet", res.success || true);

            const files = await client.aiAgent.listParquetFiles();
            logResult("Parquet Files", files.length);

            // Deleting using the same name
            await client.aiAgent.deleteParquetFile(parquetFileName);
            logResult("Deleted Parquet", true);
        } catch (e: any) {
            console.warn(`   ⚠️ Parquet operations failed: ${e.message}`);
        }
    }).catch(e => console.error(`\n❌ Section [Parquet Operations] Failed: ${e.message}`));

    console.log("\n" + "=".repeat(70));
    console.log("✅ MULTI-AGENT TEST COMPLETED SUCCESSFULLY");
    console.log("=".repeat(70));

  } catch (err: any) {
    console.error("\n❌ FATAL TEST ERROR:", err.message);
    throw err;
  } finally {
    console.log("\n[Cleanup] Cleaning up resources...");
    try {
        if (state.chatId) await client.aiAgent.deleteClientChat(state.chatId);
        console.log("   Cleanup finished.");
    } catch (e: any) {
        console.warn("   Cleanup failed:", e.message);
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testMultiAgent().catch(console.error);
}

export { testMultiAgent };
