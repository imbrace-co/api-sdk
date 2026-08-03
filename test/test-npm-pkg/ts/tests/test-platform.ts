import { pathToFileURL } from 'url';
import { client, runTestSection, logResult } from "../utils/utils.js";

async function testPlatform() {
  console.log("\n🚀 Testing Platform, Organizations, and Teams...");

  let orgId: string | null = null;
  let teamId: string | null = null;
  let userId: string | null = null;

  // 1. Users
  await runTestSection("platform.getMe", async () => {
    const me = await client.platform.getMe();
    userId = me._id || me.id;
    logResult("Me", me);
  });

  await runTestSection("platform.listUsers", async () => {
    const users = await client.platform.listUsers({ limit: 5 });
    logResult("Users Count", users.data.length);
  });

  // 2. Organizations
  await runTestSection("platform.listOrgs", async () => {
    const orgs = await client.platform.listOrgs({ limit: 5 });
    logResult("Orgs Count", orgs.data.length);
  });

  await runTestSection("organizations.listAll", async () => {
    const orgs = await client.organizations.listAll();
    logResult("All Orgs Count", orgs.length);
  });

  // 3. Teams
  await runTestSection("teams.create", async () => {
    const team = await client.teams.create({
      name: `SDK Test Team ${Date.now()}`,
      description: "Created by automated test"
    });
    teamId = team._id || team.id;
    logResult("Team Created", teamId);
  });

  if (teamId) {
    await runTestSection("teams.update", () =>
      client.teams.update(teamId!, { description: "Updated description" })
    );

    await runTestSection("teams.listMy", async () => {
      const teams = await client.teams.listMy();
      logResult("My Teams Count", teams.length);
    });

    if (userId) {
      await runTestSection("teams.addUsers", () =>
        client.teams.addUsers({ team_id: teamId!, user_ids: [userId!] })
      );
    }

    await runTestSection("teams.delete", () => client.teams.delete(teamId!));
  }

  // 4. System / Apps
  await runTestSection("platform.listApps", async () => {
    const apps = await client.platform.listApps();
    logResult("Apps Count", apps.data?.length || 0);
  });

  await runTestSection("platform.listCredentials", async () => {
    const creds = await client.platform.listCredentials();
    logResult("Credentials Count", creds.length);
  });

  await runTestSection("platform.getMenuSettings", async () => {
    const settings = await client.platform.getMenuSettings();
    logResult("Menu Settings", !!settings);
  });

  await runTestSection("platform.listPermissions", async () => {
    if (userId) {
        const perms = await client.platform.listPermissions(userId!);
        logResult("Permissions Count", perms.length);
    }
  });

  console.log("\n✅ Platform Resource Testing Completed.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testPlatform().catch(console.error);
}

export { testPlatform };

