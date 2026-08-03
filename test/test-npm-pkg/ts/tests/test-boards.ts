import { pathToFileURL } from 'url';
import { client, runTestSection, logResult, organizationId } from "../utils/utils.js";

async function testBoards() {
  console.log("\n🚀 Testing Boards Resource...");

  // 1. Boards CRUD
  let testBoardId: string | null = null;
  await runTestSection("boards.list", async () => {
    const res = await client.boards.list({ limit: 5 });
    logResult("Boards", res.data);
  });

  await runTestSection("boards.create", async () => {
    const board = await client.boards.create({
      name: `SDK_BOARD_TEST_${Date.now()}`,
      description: "Temporary board for testing"
    });
    testBoardId = board.id;
    logResult("Created Board", board);
  });

  if (testBoardId) {
    await runTestSection("boards.get", async () => {
      const board = await client.boards.get(testBoardId!);
      logResult("Fetched Board", board);
    });

    await runTestSection("boards.update", async () => {
        const updated = await client.boards.update(testBoardId!, {
            name: `SDK_BOARD_TEST_UPDATED_${Date.now()}`,
        });
        logResult("Updated Board", updated);
    });

    // 2. Fields
    let testFieldId: string | null = null;
    await runTestSection("Field Lifecycle", async () => {
        // Create
        const res: any = await client.boards.createField(testBoardId!, {
            name: "Test Field",
            type: "ShortText"
        });
        const field = res.fields?.find((f: any) => f.name === "Test Field");
        testFieldId = field?._id;
        logResult("Created Field", testFieldId);

        // Update
        await client.boards.updateField(testBoardId!, testFieldId!, { name: "Test Field Updated" });
        logResult("Updated Field", true);

        // Reorder
        await client.boards.reorderFields(testBoardId!, { fields: [testFieldId!] });
        logResult("Reordered Fields", true);

        // Bulk Update
        await client.boards.bulkUpdateFields(testBoardId!, { 
            fields: [{ _id: testFieldId!, name: "Test Field Bulk" }] 
        });
        logResult("Bulk Updated Fields", true);
    });

    // 3. Items
    let testItemId: string | null = null;
    await runTestSection("Item Lifecycle", async () => {
        const board: any = await client.boards.get(testBoardId!);
        const idField = board.fields?.find((f: any) => f.is_identifier);
        if (idField) {
            const item = await client.boards.createItem(testBoardId!, {
                fields: [{ board_field_id: idField._id, value: "SDK Test Item" }]
            });
            testItemId = item._id || item.id;
            logResult("Created Item", testItemId);

            await client.boards.listItems(testBoardId!, { limit: 5 });
            await client.boards.getItem(testBoardId!, testItemId!);
            await client.boards.updateItem(testBoardId!, testItemId!, {
                data: [{ key: idField._id, value: "SDK Test Item Updated" }]
            });
            logResult("Item Operations Verified", true);

            // Bulk Delete
            await client.boards.bulkDeleteItems(testBoardId!, { ids: [testItemId!] });
            logResult("Bulk Deleted Items", true);
        }
    });

    // 4. Segments
    await runTestSection("Segments Lifecycle", async () => {
        const segment = await client.boards.createSegment(testBoardId!, {
            name: "Test Segment",
            filter: {}
        });
        const segmentId = segment._id || (segment as any).id;
        logResult("Created Segment", segmentId);

        await client.boards.listSegments(testBoardId!);
        await client.boards.updateSegment(testBoardId!, segmentId, { name: "Test Segment Updated" });
        await client.boards.deleteSegment(testBoardId!, segmentId);
        logResult("Segment Operations Verified", true);
    });

    // 5. Cleanup & Board Reorder
    await runTestSection("Board Cleanup & Reorder", async () => {
        await client.boards.reorder({ order: [testBoardId!] });
        logResult("Reordered Boards", true);
        
        await client.boards.delete(testBoardId!);
        console.log("   Board deleted.");
    });
  }

  // 4. Misc Board functions
  await runTestSection("boards.getLinkPreview", async () => {
    try {
        const preview = await client.boards.getLinkPreview("https://google.com");
        logResult("Link Preview", preview);
    } catch (e) {
        console.warn("   [Skip] boards.getLinkPreview failed");
    }
  });

  await runTestSection("boards.searchFiles", async () => {
    const files = await client.boards.searchFiles({ q: "test" });
    logResult("Search Files Count", files.length);
  });

  await runTestSection("boards.checkConflict", async () => {
    const res = await client.boards.checkConflict({
        ids: ["test"],
        organization_id: organizationId as string
    });
    logResult("Conflict Check", res);
  });

  // 5. Folders (Knowledge Hub)
  let testFolderId: string | null = null;
  await runTestSection("boards.searchFolders", async () => {
    const list = await client.boards.searchFolders({});
    logResult("Folders", list);
  });

  await runTestSection("boards.createFolder", async () => {
    const folder = await client.boards.createFolder({
      name: `SDK_FOLDER_TEST_${Date.now()}`,
      organization_id: organizationId as string,
      parent_id: "root",
      source_type: "upload"
    });
    testFolderId = folder._id || folder.id;
    logResult("Created Folder", folder);
  });

  if (testFolderId) {
    await runTestSection("boards.deleteFolders", async () => {
      await client.boards.deleteFolders({ ids: [testFolderId!] });
      console.log("   Folder deleted.");
    });
  }

  console.log("\n✅ Boards Resource Testing Completed.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testBoards().catch(console.error);
}

export { testBoards };

