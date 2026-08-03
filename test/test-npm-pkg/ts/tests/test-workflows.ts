import { pathToFileURL } from 'url';
import { client, runTestSection, logResult } from "../utils/utils.js";

async function testWorkflows() {
  console.log("\n🚀 Testing Workflows Resource...");

  // 1. Channel automation
  await runTestSection("workflows.listChannelAutomation", async () => {
    const res = await client.workflows.listChannelAutomation();
    const list = Array.isArray(res) ? res : (res?.data ?? []);
    logResult("Channel automations", list);
  });

  // 2. Flows
  let testProjectId: string | null = null;
  await runTestSection("workflows.listFlows", async () => {
    const res = await client.workflows.listFlows({ limit: 5 });
    logResult("Flows", res.data);
    if (res.data.length > 0) {
        testProjectId = res.data[0].projectId;
    }
  });

  // 3. Runs
  await runTestSection("workflows.listRuns", async () => {
    const res = await client.workflows.listRuns({ limit: 5 });
    logResult("Runs", res.data);
  });

  // 4. Folders
  await runTestSection("workflows.listFolders", async () => {
    const res = await client.workflows.listFolders({ limit: 5 });
    logResult("Folders", res.data);
  });

  // 5. Connections
  await runTestSection("workflows.listConnections", async () => {
    const res = await client.workflows.listConnections({ limit: 5 });
    logResult("Connections", res.data);
  });

  // 6. Tables
  await runTestSection("workflows.listTables", async () => {
    const res = await client.workflows.listTables();
    logResult("Tables", res.data);
  });

  // 7. Pieces
  await runTestSection("workflows.listPieces", async () => {
    const pieces = await client.workflows.listPieces();
    logResult("Pieces Count", pieces.length);
  });

  // 8. MCP Servers (requires projectId)
  if (testProjectId) {
    await runTestSection("workflows.listMcpServers", async () => {
      const servers = await client.workflows.listMcpServers(testProjectId!);
      logResult("MCP Servers", servers);
    });
  }

  // 9. Invitations
  await runTestSection("workflows.listInvitations", async () => {
    const invites = await client.workflows.listInvitations({ type: 'PLATFORM', limit: 5 });
    logResult("Invitations", invites);
  });

  console.log("\n✅ Workflows Resource Testing Completed.");
}


if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testWorkflows().catch(console.error);
}

export { testWorkflows };
