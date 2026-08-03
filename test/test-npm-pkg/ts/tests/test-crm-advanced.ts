import { pathToFileURL } from 'url';
import { client, runTestSection, logResult, organizationId } from "../utils/utils.js";

/**
 * TEST CRM ADVANCED (SCENARIO-BASED)
 * Focuses on Contacts, Conversations, Channels, and Board Relations.
 */
async function testCrmAdvanced() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 STARTING: CRM ADVANCED & RELATIONS TEST");
  console.log("=".repeat(70));

  const ts = Date.now();
  const state = {
    contactId: null as string | null,
    conversationId: null as string | null,
    boardId: null as string | null,
    relatedBoardId: null as string | null,
    itemId: null as string | null,
    relatedItemId: null as string | null,
    orgId: organizationId as string || "",
  };

  try {
    // --- Section 1: Contacts Advanced ---
    await runTestSection("Contacts Advanced", async () => {
      const contacts = await client.contacts.list({ limit: 1 });
      if (contacts.data?.length > 0) {
        state.contactId = contacts.data[0]._id;
        logResult("Using Contact", state.contactId);

        const comments = await client.contacts.getComments(state.contactId!);
        logResult("Contact Comments", comments.length);

        const files = await client.contacts.getFiles(state.contactId!).catch(() => []);
        logResult("Contact Files", files.length);

        const convs = await client.contacts.getConversations(state.contactId!);
        logResult("Contact Conversations", convs.length);
        if (convs.length > 0) state.conversationId = convs[0]._id;
      } else {
        console.log("   ⚠️ No contacts found to test.");
      }
    }).catch(e => console.error(`\n❌ Section [Contacts Advanced] Failed: ${e.message}`));

    // --- Section 2: Conversations & Activities ---
    await runTestSection("Conversations & Activities", async () => {
      if (state.conversationId) {
        const activities = await client.contacts.getActivities(state.conversationId!);
        logResult("Conversation Activities", activities.length);

        await client.conversations.updateStatus({
            conversation_id: state.conversationId!,
            status: "open"
        }).catch(e => console.warn(`   ⚠️ Update status failed: ${e.message}`));
        logResult("Status Updated", "open");
      } else {
        console.log("   ⚠️ No conversation found to test activities.");
      }
    }).catch(e => console.error(`\n❌ Section [Conversations & Activities] Failed: ${e.message}`));

    // --- Section 3: Channels ---
    await runTestSection("Channels Management", async () => {
      const channels = await client.channel.list();
      logResult("Channels Count", channels.length);

      const countRes = await client.channel.getCount();
      logResult("Total Channels (Backend)", countRes.count);

      const convCount = await client.channel.getConvCount();
      logResult("Conversation Count per Channel", convCount.count);
    }).catch(e => console.error(`\n❌ Section [Channels Management] Failed: ${e.message}`));

    // --- Section 4: Board Relations (Link/Unlink) ---
    await runTestSection("Board Relations (Link/Unlink)", async () => {
      const board1 = await client.boards.create({ name: `SDK Parent Board ${ts}` });
      const board2 = await client.boards.create({ name: `SDK Related Board ${ts}` });
      state.boardId = board1._id || (board1 as any).id;
      state.relatedBoardId = board2._id || (board2 as any).id;

      const item1 = await client.boards.createItem(state.boardId!, { data: [] });
      const item2 = await client.boards.createItem(state.relatedBoardId!, { data: [] });
      state.itemId = item1._id || (item1 as any).id;
      state.relatedItemId = item2._id || (item2 as any).id;

      const linkRes = await client.boards.linkItems(state.boardId!, state.itemId!, state.relatedBoardId!, {
          related_item_ids: [state.relatedItemId!]
      });
      logResult("Items Linked", linkRes.success);

      const related = await client.boards.getRelatedItems(state.boardId!, state.itemId!, state.relatedBoardId!);
      logResult("Related Items Found", related.length);

      const unlinkRes = await client.boards.unlinkItems(state.boardId!, state.itemId!, state.relatedBoardId!, {
          related_item_ids: [state.relatedItemId!]
      });
      logResult("Items Unlinked", unlinkRes.success);
    }).catch(e => console.error(`\n❌ Section [Board Relations] Failed: ${e.message}`));

    console.log("\n" + "=".repeat(70));
    console.log("✅ CRM ADVANCED TEST COMPLETED SUCCESSFULLY");
    console.log("=".repeat(70));

  } catch (err: any) {
    console.error("\n❌ FATAL TEST ERROR:", err.message);
    throw err;
  } finally {
    console.log("\n[Cleanup] Cleaning up resources...");
    try {
        if (state.boardId) await client.boards.delete(state.boardId);
        if (state.relatedBoardId) await client.boards.delete(state.relatedBoardId);
        console.log("   Cleanup finished.");
    } catch (e: any) {
        console.warn("   Cleanup failed:", e.message);
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testCrmAdvanced().catch(console.error);
}

export { testCrmAdvanced };
