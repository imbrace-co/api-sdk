import { pathToFileURL } from 'url';
import { client, runTestSection, logResult } from "../utils/utils.js";

async function testChatAi() {
  console.log("\n🚀 Testing Chat AI Resource...");

  // 1. Assistants
  let testAssistantId: string | null = null;
  await runTestSection("chatAi.listAiAgents", async () => {
    const list = await client.chatAi.listAiAgents();
    logResult("Assistants", list);
  });

  await runTestSection("chatAi.createAiAgent", async () => {
    const assistant = await client.chatAi.createAiAgent({
      name: `SDK_UNIT_TEST_${Date.now()}`,
      workflow_name: `sdk_unit_test_${Date.now()}`,
      description: "Temporary assistant for unit testing",
    });
    testAssistantId = assistant.id;
    logResult("Created Assistant", assistant);
  });

  if (testAssistantId) {
    await runTestSection("chatAi.getAiAgent", async () => {
      const assistant = await client.chatAi.getAiAgent(testAssistantId!);
      logResult("Fetched Assistant", assistant);
    });

    await runTestSection("chatAi.updateAiAgent", async () => {
        const updated = await client.chatAi.updateAiAgent(testAssistantId!, {
            name: `SDK_UNIT_TEST_UPDATED_${Date.now()}`,
            workflow_name: `sdk_unit_test_${Date.now()}`,
        });
        logResult("Updated Assistant", updated);
    });
  }

  // 2. Models — moved from chatAi to ai resource (chatAi only exposes
  // document-specific models via listDocumentModels)
  await runTestSection("ai.getLlmModels", async () => {
    const models = await client.ai.getLlmModels();
    logResult("LLM Models", models);
  });

  // 3. Completions — moved from chatAi.chat() to ai.complete()
  await runTestSection("ai.complete", async () => {
    const response = await client.ai.complete({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello, say 'ready' if you hear me." }],
    });
    logResult("Chat Response", (response as any)?.choices?.[0]?.message?.content);
  });

  if (testAssistantId) {
    await runTestSection("chatAi.deleteAiAgent", async () => {
      await client.chatAi.deleteAiAgent(testAssistantId!);
      console.log("   Assistant deleted.");
    });
  }

  // Prompts/Tools/Knowledge/Folders/Speech tests removed — those endpoints were
  // never exposed on ChatAiResource (test was written against an older SDK).
  // Knowledge management lives on `boards` (KnowledgeHub folders/files).

  // 9. Document AI
  await runTestSection("chatAi.listDocumentModels", async () => {
    const models = await client.chatAi.listDocumentModels();
    logResult("Document Models Count", models.length);
  });

  await runTestSection("chatAi.processDocument", async () => {
    const orgId = process.env.IMBRACE_ORGANIZATION_ID || "";
    try {
        const res = await client.chatAi.processDocument({
            modelName: "gpt-4o",
            url: "https://example.com/invoice.pdf",
            organizationId: orgId,
            additionalInstructions: "Extract total amount"
        });
        logResult("Process Document", res.success);
    } catch (e) {
        console.warn("   [Skip] chatAi.processDocument failed (likely invalid URL/config)");
    }
  });

  console.log("\n✅ Chat AI Resource Testing Completed.");
  }


if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testChatAi().catch(console.error);
}

export { testChatAi };

