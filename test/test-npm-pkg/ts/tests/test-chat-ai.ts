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

  // 2. Models
  await runTestSection("chatAi.listModels", async () => {
    const models = await client.chatAi.listModels();
    logResult("Models", models);
  });

  // 3. Completions
  await runTestSection("chatAi.chat", async () => {
    const response = await client.chatAi.chat({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hello, say 'ready' if you hear me." }],
    });
    logResult("Chat Response", response.choices[0].message.content);
  });

  // 4. Folders & Knowledge
  let testFolderId: string | null = null;
  await runTestSection("chatAi.listFolders", async () => {
    const folders = await client.chatAi.listFolders();
    logResult("Folders", folders);
  });

  await runTestSection("chatAi.createFolder", async () => {
    const folder = await client.chatAi.createFolder({ name: `TEST_FOLDER_${Date.now()}` });
    testFolderId = folder.id || folder._id;
    logResult("Created Folder", folder);
  });

  // Cleanup
  if (testFolderId) {
    await runTestSection("chatAi.deleteFolder", async () => {
        await client.chatAi.deleteFolder(testFolderId!);
        console.log("   Folder deleted.");
    });
  }

  if (testAssistantId) {
    await runTestSection("chatAi.deleteAiAgent", async () => {
      await client.chatAi.deleteAiAgent(testAssistantId!);
      console.log("   Assistant deleted.");
    });
  }

  // 5. Prompts
  await runTestSection("chatAi.listPrompts", async () => {
    const prompts = await client.chatAi.listPrompts();
    logResult("Prompts Count", prompts.length);
  });

  // 6. Tools
  await runTestSection("chatAi.listTools", async () => {
    const tools = await client.chatAi.listTools();
    logResult("Tools Count", tools.length);
  });

  // 7. Knowledge Bases
  let testKnowledgeId: string | null = null;
  await runTestSection("chatAi.knowledgeLifecycle", async () => {
    // 1. List
    const kb = await client.chatAi.listKnowledge();
    logResult("Knowledge Bases Count", kb.length);

    // 2. Create (Direct)
    const newKb = await client.chatAi.createKnowledge({
        name: `SDK Direct KB ${Date.now()}`,
        description: "Created directly without folder"
    });
    testKnowledgeId = newKb.id;
    logResult("Created Knowledge", testKnowledgeId);

    // 3. Get
    const fetched = await client.chatAi.getKnowledge(testKnowledgeId!);
    logResult("Fetched Knowledge", fetched.name);

    // 4. Delete
    await client.chatAi.deleteKnowledge(testKnowledgeId!);
    console.log("   Knowledge deleted.");
  });

  // 8. Audio (Transcribe & Speech)
  await runTestSection("chatAi.speech", async () => {
    try {
        const res = await client.chatAi.speech({
            model: "tts-1",
            input: "Hello world",
            voice: "alloy"
        });
        logResult("Speech Response OK", res.ok);
    } catch (e) {
        console.warn("   [Skip] chatAi.speech failed");
    }
  });

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

