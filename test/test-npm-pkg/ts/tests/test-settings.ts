import { pathToFileURL } from 'url';
import { client, runTestSection, logResult } from "../utils/utils.js";

/**
 * TEST SETTINGS RESOURCE
 * Focuses on Message Templates, WhatsApp Templates, and User Management.
 */
async function testSettings() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 STARTING: SETTINGS & TEMPLATES TEST");
  console.log("=".repeat(70));

  const ts = Date.now();
  const state = {
    templateId: null as string | null,
  };

  try {
    // --- Section 1: Message Templates ---
    await runTestSection("Message Templates Lifecycle", async () => {
      // 1. Create Template
      const template = await client.settings.createMessageTemplate({
        name: `SDK Test Template ${ts}`,
        body: "Hello {{1}}, welcome to our service!",
        category: "UTILITY",
        language: "en_US"
      });
      state.templateId = template._id;
      logResult("Template Created", state.templateId);

      // 2. Get Template
      const fetched = await client.settings.getMessageTemplate(state.templateId!);
      logResult("Template Retrieved", fetched.name);

      // 3. List Templates
      const list = await client.settings.listMessageTemplates({ limit: 5 });
      logResult("Templates Count", list.data?.length);

      // 4. Update Template
      await client.settings.updateMessageTemplate(state.templateId!, {
        body: "Hi {{1}}, updated body!"
      });
      logResult("Template Updated", true);

      // 5. Search Templates
      const search = await client.settings.searchMessageTemplates({ q: `SDK Test` });
      logResult("Search Templates Count", search.length);
    }).catch(e => console.error(`\n❌ Section [Message Templates] Failed: ${e.message}`));

    // --- Section 2: WhatsApp Templates ---
    await runTestSection("WhatsApp Templates", async () => {
      const waTemplates = await client.settings.listWhatsAppTemplates({ limit: 5 });
      logResult("WhatsApp Templates (v1)", waTemplates.length);

      const waTemplatesV2 = await client.settings.listWhatsAppTemplatesV2({ limit: 5 });
      logResult("WhatsApp Templates (v2)", waTemplatesV2.length);
    }).catch(e => console.error(`\n❌ Section [WhatsApp Templates] Failed: ${e.message}`));

    // --- Section 3: User Management ---
    await runTestSection("User Management (Settings)", async () => {
      const users = await client.settings.listUsers({ limit: 5 });
      logResult("Users (Settings) Count", users.length);

      const rolesCount = await client.settings.getUserRolesCount();
      logResult("User Roles Distribution", rolesCount);
    }).catch(e => console.error(`\n❌ Section [User Management] Failed: ${e.message}`));

    console.log("\n" + "=".repeat(70));
    console.log("✅ SETTINGS TEST COMPLETED SUCCESSFULLY");
    console.log("=".repeat(70));

  } catch (err: any) {
    console.error("\n❌ FATAL TEST ERROR:", err.message);
    throw err;
  } finally {
    if (state.templateId) {
      console.log("\n[Cleanup] Removing message template...");
      await client.settings.deleteMessageTemplate(state.templateId!).catch(() => {});
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testSettings().catch(console.error);
}

export { testSettings };
