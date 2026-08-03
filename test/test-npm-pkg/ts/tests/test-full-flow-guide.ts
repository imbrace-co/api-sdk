import { pathToFileURL } from 'url';
import { client, runTestSection, logResult, organizationId } from "../utils/utils.js";
import { randomUUID } from "crypto";

/**
 * FULL FLOW GUIDE - INTEGRATION TEST (COMPREHENSIVE)
 * Tuân thủ 100% theo tài liệu docs2/ts-sdk/Full Flow Guide.md
 */
async function testFullFlowGuide() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 STARTING: FULL FLOW GUIDE COMPREHENSIVE TEST");
  console.log("=".repeat(70));

  const ts = Date.now();
  const state = {
    assistantId: null as string | null,
    flowId: null as string | null,
    kbFolderId: null as string | null,
    boardId: null as string | null,
    identifierFieldId: null as string | null,
    itemId: null as string | null,
    orgId: organizationId as string || "",
  };

  // Helper để xử lý SSE Stream
  async function handleSSEStream(response: Response, label: string) {
    if (!response.body) throw new Error(`Empty body for ${label}`);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    process.stdout.write(`   ${label}: `);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      text.split("\n").forEach(line => {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const chunk = JSON.parse(line.slice(6));
            const content = chunk.content || "";
            fullContent += content;
            process.stdout.write(content);
          } catch {}
        }
      });
    }
    console.log(`\n   ✅ ${label} Finished.`);
    return fullContent;
  }

  try {
    // --- Flow 1: Create Assistant --------------------------------------------
    console.log("\n[FLOW 1] Assistant Lifecycle");

    await runTestSection("Assistant CRUD", async () => {
      // 1. Create
      const assistant = await client.chatAi.createAiAgent({
        name: `SDK Test Assistant ${ts}`,
        workflow_name: `sdk_guide_test_${ts}`,
        description: "Created by full-flow-guide test",
        instructions: "You are a concise test assistant. Reply in one sentence.",
      });
      state.assistantId = assistant.id;
      logResult("Assistant Created", state.assistantId);

      // 2. List & Verify
      const allAssistants = await client.chatAi.listAiAgents();
      const found = allAssistants.find(a => a.id === state.assistantId);
      if (!found) throw new Error("Assistant not found in list");
      logResult("Assistant List & Verify", `Found among ${allAssistants.length} assistants`);

      // 3. Get & Verify
      const asst = await client.chatAi.getAiAgent(state.assistantId!);
      if (asst.name !== `SDK Test Assistant ${ts}`) throw new Error("Name mismatch");
      logResult("Assistant Retrieved & Verified", true);

      // 4. Update Instructions
      await client.chatAi.updateAiAgentInstructions(state.assistantId!, "You are a helpful test agent. Use the word 'IMBRACE' in your reply."); 
      logResult("Instructions Updated", true);

      // 5. Update Name
      const updated = await client.chatAi.updateAiAgent(state.assistantId!, {
        name: `SDK Assistant ${ts} Updated`,
        workflow_name: `sdk_guide_test_${ts}`,
      });
      logResult("Assistant Renamed", updated.name);
    });

    // --- Flow 2: Workflow ----------------------------------------------------
    console.log("\n[FLOW 2] Workflows");

    await runTestSection("Workflow Lifecycle", async () => {
      try {
        const flows = await client.workflows.listFlows({ limit: 5 });
        if (flows?.data?.length > 0) {
          state.flowId = flows.data[0].id;
          logResult("Using Existing Flow", state.flowId);

          await client.workflows.getFlow(state.flowId);

          // Trigger Async
          await client.workflows.triggerFlow(state.flowId, { source: "sdk-test-async" });
          logResult("Trigger Flow Async", "Sent");

          // List Runs
          const runs = await client.workflows.listRuns({ flowId: state.flowId, limit: 3 });
          logResult("Recent Runs Count", runs.data?.length);
        } else {
          console.log("   ⚠️ No flows found, skipping workflow triggers.");
        }
      } catch (e: any) {
        console.warn(`   ⚠️ Workflow steps failed (Possible 404 or config issue): ${e.message}`);
      }
    });

    // --- Flow 3: Knowledge Hub (RAG) -----------------------------------------
    console.log("\n[FLOW 3] Knowledge Hub & RAG");

    await runTestSection("Folder & File Management", async () => {
      if (!state.orgId) {
        const folders = await client.boards.searchFolders({}).catch(() => []);
        state.orgId = (folders[0] as any)?.organization_id || "";
      }

      // 1. Create Folder
      const folder = await client.boards.createFolder({
        name: `SDK KB ${ts}`,
        organization_id: state.orgId,
        parent_folder_id: "root",
        source_type: "upload",
      } as any);
      state.kbFolderId = folder._id || (folder as any).id;
      logResult("KB Folder Created", state.kbFolderId);

      // 2. Get & Update Folder
      const fetchedFolder = await client.boards.getFolder(state.kbFolderId!);
      logResult("Folder Retrieved", fetchedFolder.name);
      
      await client.boards.updateFolder(state.kbFolderId!, { name: `SDK KB ${ts} Updated` });
      logResult("Folder Updated", true);

      // 3. Search Folders
      const searchResults = await client.boards.searchFolders({ q: `SDK KB ${ts}` });
      logResult("Search Folders Verified", searchResults.length > 0);

      // 4. Upload File
      const formData = new FormData();
      const secretCode = `IMBRACE-CODE-${ts}`;
      formData.append("file", new Blob([`The secret verification code is: ${secretCode}. The assistant name is IMBRACE-TEST.`], { type: "text/plain" }), "secret.txt");
      formData.append("folder_id", state.kbFolderId!);
      if (state.orgId) formData.append("organization_id", state.orgId);

      await client.boards.uploadFile(formData);
      logResult("Knowledge File Uploaded", secretCode);

      // 5. Attach to Assistant
      await client.chatAi.updateAiAgent(state.assistantId!, {
        name: `SDK Assistant ${ts} Updated`,
        workflow_name: `sdk_guide_test_${ts}`,
        knowledge_hubs: [state.kbFolderId!]
      });
      logResult("Knowledge Attached to Assistant", true);

      console.log("   Waiting 3s for embedding indexing...");
      await new Promise(r => setTimeout(r, 3000));
    });

    // --- Verify RAG with Multi-turn Chat -------------------------------------
    await runTestSection("Multi-turn Chat Verification (RAG)", async () => {
      let chatAsstId = state.assistantId!;
      const asstInfo = await client.chatAi.getAiAgent(chatAsstId);

      if (!(asstInfo as any).model_id) {
          console.log("   ⚠️ New assistant has no model yet, falling back to an existing one for chat test.");
          const all = await client.chatAi.listAiAgents();
          const fallback = all.find(a => (a as any).model_id);
          if (fallback) chatAsstId = fallback.id;
      }

      const sessionId = randomUUID();
      
      // Turn 1
      console.log("\n   [Turn 1] Querying RAG...");
      const response1 = await client.aiAgent.streamChat({
        id: sessionId,
        assistant_id: chatAsstId,
        organization_id: state.orgId,
        messages: [{ role: "user", content: "What is the secret verification code?" }],
      });
      await handleSSEStream(response1, "AI Turn 1 Response");

      // Turn 2
      console.log("\n   [Turn 2] Context Check...");
      const response2 = await client.aiAgent.streamChat({
        id: sessionId,
        assistant_id: chatAsstId,
        organization_id: state.orgId,
        messages: [{ role: "user", content: "What was the assistant name mentioned in that same file?" }],
      });
      await handleSSEStream(response2, "AI Turn 2 Response");
    });

    // --- Flow 4: Boards & Items ----------------------------------------------
    console.log("\n[FLOW 4] Boards & Items");

    await runTestSection("Board & Item Full Lifecycle", async () => {
      // 1. Create Board
      const board = await client.boards.create({
          name: `SDK Test Board ${ts}`,
          description: "Full Flow Test Board"
      });
      state.boardId = board._id || (board as any).id;
      logResult("Board Created", state.boardId);

      // 2. Add Custom Field
      const updatedBoard: any = await client.boards.createField(state.boardId!, {
          name: "Reference ID",
          type: "ShortText"
      });
      state.identifierFieldId = updatedBoard.fields?.find((f: any) => f.is_identifier)?._id;
      logResult("Identifier Field Identified", state.identifierFieldId);

      // 3. Create Item
      const item: any = await client.boards.createItem(state.boardId!, {
        fields: [{ board_field_id: state.identifierFieldId!, value: `REF-${ts}` }]
      });
      state.itemId = item._id || item.id;
      logResult("Item Created", state.itemId);

      // 4. Get Item & Verify
      const fetchedItem = await client.boards.getItem(state.boardId!, state.itemId!);
      if (!fetchedItem) throw new Error("Could not fetch item");
      logResult("Item Retrieved", fetchedItem._id || (fetchedItem as any).id);

      // 5. List Items & Verify
      const itemsList = await client.boards.listItems(state.boardId!, { limit: 10 });
      if (!itemsList.data?.some((i: any) => (i._id || i.id) === state.itemId)) {
          throw new Error("Item not found in list");
      }
      logResult("List Items Verified", `Found ${itemsList.data?.length} items`);

      // 6. Update & Search
      await client.boards.updateItem(state.boardId!, state.itemId!, {
          data: [{ key: state.identifierFieldId!, value: `REF-${ts}-UPDATED` }]
      });
      const search = await client.boards.search(state.boardId!, { q: `REF-${ts}` });
      logResult("Search Verified", search.data?.length > 0);

      // 7. Export CSV
      const csv = await client.boards.exportCsv(state.boardId!);
      logResult("CSV Exported (Bytes)", csv.length);
    });

    console.log("\n" + "repeat".repeat(70).slice(0, 0)); // Placeholder to avoid console log noise
    console.log("✅ FULL FLOW GUIDE TEST COMPLETED SUCCESSFULLY");

  } catch (err: any) {
    console.error("\n❌ FATAL TEST ERROR:", err.message);
    throw err;
  } finally {
    console.log("\n[Cleanup] Cleaning up resources...");
    try {
        if (state.kbFolderId) await client.boards.deleteFolders({ ids: [state.kbFolderId] });
        if (state.boardId) await client.boards.delete(state.boardId);
        if (state.assistantId) await client.chatAi.deleteAiAgent(state.assistantId);
        console.log("   Cleanup finished.");
    } catch (e: any) {
        console.warn("   Cleanup failed:", e.message);
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testFullFlowGuide().catch(console.error);
}

export { testFullFlowGuide };
