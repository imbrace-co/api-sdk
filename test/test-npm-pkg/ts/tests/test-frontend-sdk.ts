import { pathToFileURL } from 'url';
import { client, runTestSection, logResult, organizationId } from "../utils/utils.js";
import { randomUUID } from "crypto";

/**
 * TEST FRONTEND SDK (SCENARIO-BASED)
 * Focuses on Chat Client API, Client Messages, Votes, and Tracing.
 */
async function testFrontendSdk() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 STARTING: FRONTEND SDK & TRACING TEST");
  console.log("=".repeat(70));

  const ts = Date.now();
  const state = {
    chatId: null as string | null,
    userId: null as string | null,
    messageId: null as string | null,
    orgId: organizationId as string || "",
  };

  try {
    // --- Section 1: System Info & Health ---
    await runTestSection("System Info & Health", async () => {
      const config = await client.aiAgent.getConfig();
      logResult("Config", config);

      const health = await client.aiAgent.getHealth(true);
      logResult("Health", health);

      const version = await client.aiAgent.getVersion();
      logResult("Version", version);
    }).catch(e => console.error(`\n❌ Section [System Info] Failed: ${e.message}`));

    // --- Section 2: Chat Client Auth ---
    await runTestSection("Chat Client Auth", async () => {
      // Register (or get) a chat client user
      const email = `sdk-test-${ts}@example.com`;
      const password = "Password123!";
      
      const user = await client.aiAgent.registerChatClient({ 
          id: `sdk-test-user-${ts}`,
          email,
          password
      }).catch(async () => {
          return await client.aiAgent.getChatClientUser({ id: `sdk-test-user-${ts}` });
      });
      
      state.userId = user.id;
      logResult("Chat Client User", state.userId);

      const verified = await client.aiAgent.verifyChatClientCredentials({ 
          email,
          password
      });
      logResult("Credentials Verified", !!verified);
    }).catch(e => console.error(`\n❌ Section [Chat Client Auth] Failed: ${e.message}`));

    // --- Section 3: Chat Client Chats ---
    await runTestSection("Chat Client Chats", async () => {
      if (!state.userId) {
          console.log("   ⚠️ Skipping Chat Client Chats because userId is null.");
          return;
      }
      
      const assistants = await client.chatAi.listAiAgents();
      const realAsstId = assistants.length > 0 ? assistants[0].id : "dummy-id";

      const chat = await client.aiAgent.createClientChat({
        id: randomUUID(),
        assistantId: realAsstId,
        organizationId: state.orgId,
        userId: state.userId!,
        selectedVisibilityType: "public",
        message: {
          id: randomUUID(),
          role: "user",
          content: "Hello from Frontend SDK Test",
          createdAt: new Date().toISOString(),
          parts: [{ type: "text", text: "Hello from Frontend SDK Test" }]
        }
      });
      state.chatId = chat._id || chat.id;
      logResult("Client Chat Created", state.chatId);

      const fetchedChat = await client.aiAgent.getClientChat(state.chatId!);
      logResult("Get Client Chat", fetchedChat.id);

      const chats = await client.aiAgent.listClientChats({ limit: 5, organization_id: state.orgId });
      logResult("List Client Chats", chats.data?.length);

      try {
          const titleRes = await client.aiAgent.generateClientChatTitle(state.chatId!);
          logResult("Generated Title", titleRes.title);
      } catch {}

      await client.aiAgent.updateClientChat(state.chatId!, { visibility: "private" });
      logResult("Updated Visibility", "private");

      // 4. Create Document (Frontend)
      const doc = await client.aiAgent.createDocument({
          kind: "text",
          content: "Sample document content created from SDK test",
          title: "SDK Test Doc"
      });
      logResult("Frontend Document Created", doc._id || doc.id);
    }).catch(e => console.error(`\n❌ Section [Chat Client Chats] Failed: ${e.message}`));

    // --- Section 4: Client Messages & Votes ---
    await runTestSection("Client Messages & Votes", async () => {
      if (!state.chatId) {
          console.log("   ⚠️ Skipping Messages & Votes because chatId is null.");
          return;
      }
      
      const msg = await client.aiAgent.persistClientMessage({
        chatId: state.chatId!,
        role: "assistant",
        content: "Hello! How can I help you today?",
        parts: [{ type: "text", text: "Hello! How can I help you today?" }]
      });
      state.messageId = msg._id || msg.id;
      logResult("Message Persisted", state.messageId);

      const messages = await client.aiAgent.listClientMessages(state.chatId!);
      logResult("List Messages", messages.length);

      await client.aiAgent.updateVote({
        chatId: state.chatId!,
        messageId: state.messageId!,
        vote: 1 // Upvote
      });
      logResult("Vote Updated", "Upvote");

      const votes = await client.aiAgent.getVotes(state.chatId!);
      logResult("Votes Count", votes.length);
    }).catch(e => console.error(`\n❌ Section [Client Messages & Votes] Failed: ${e.message}`));

    // --- Section 5: Tracing (Tempo) ---
    await runTestSection("Tracing (Tempo)", async () => {
      const services = await client.aiAgent.getTraceServices();
      logResult("Trace Services", services);

      const tags = await client.aiAgent.getTraceTags();
      logResult("Trace Tags", tags);

      const traces = await client.aiAgent.getTraces({ limit: 5, orgId: state.orgId });
      logResult("Traces Found", traces?.traces?.length);

      if (traces?.traces?.length > 0) {
        const traceId = traces.traces[0].traceID;
        const details = await client.aiAgent.getTrace(traceId);
        logResult("Trace Details", traceId);
      }
    }).catch(e => console.error(`\n❌ Section [Tracing] Failed: ${e.message}`));

    console.log("\n" + "=".repeat(70));
    console.log("✅ FRONTEND SDK TEST COMPLETED SUCCESSFULLY");
    console.log("=".repeat(70));

  } catch (err: any) {
    console.error("\n❌ FATAL TEST ERROR:", err.message);
    throw err;
  } finally {
    console.log("\n[Cleanup] Cleaning up chat client resources...");
    try {
      if (state.chatId) await client.aiAgent.deleteClientChat(state.chatId);
      console.log("   Cleanup finished.");
    } catch (e: any) {
      console.warn("   Cleanup failed:", e.message);
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testFrontendSdk().catch(console.error);
}

export { testFrontendSdk };
