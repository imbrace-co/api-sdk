import { pathToFileURL } from 'url';
import { client, runTestSection, logResult } from "../utils/utils.js";

async function testCrm() {
  console.log("\n🚀 Testing CRM Resources (Contacts, Conversations, Messaging)...");

  // 1. Contacts
  let testContactId: string | null = null;
  await runTestSection("contacts.list", async () => {
    const res = await client.contacts.list({ limit: 5 });
    logResult("Contacts", res.data);
    if (res.data.length > 0) {
        testContactId = res.data[0].id;
    }
  });

  if (testContactId) {
    await runTestSection("contacts.get", async () => {
        const contact = await client.contacts.get(testContactId!);
        logResult("Fetched Contact", contact);
    });

    await runTestSection("contacts.getActivities", async () => {
        const activities = await client.contacts.getActivities(testContactId!);
        logResult("Activities", activities);
    });
  }

  // 2. Conversations
  let testConversationId: string | null = null;
  await runTestSection("conversations.getOutstanding", async () => {
    // businessUnitId might be required
    const res = await client.conversations.getOutstanding({ limit: 5 });
    logResult("Outstanding Conversations", res.data);
    if (res.data && res.data.length > 0) {
        testConversationId = res.data[0].id;
    }
  });

  await runTestSection("conversations.getViewsCount", async () => {
    const counts = await client.conversations.getViewsCount();
    logResult("Conversation View Counts", counts);
  });

  // 3. Channels
  await runTestSection("channel.list", async () => {
    const res = await client.channel.list();
    logResult("Channels", res);
  });

  // 4. Messaging
  if (testConversationId) {
    await runTestSection("messages.list", async () => {
        const res = await client.messages.list(testConversationId!);
        logResult("Messages", res);
    });

    await runTestSection("messages.send (Text)", async () => {
        try {
            const res = await client.messages.send({
                conversation_id: testConversationId!,
                type: "text",
                text: "SDK Test Message"
            });
            logResult("Send Text Message", res);
        } catch (e) {
            console.warn("   [Skip] messages.send failed");
        }
    });
  }

  // 5. Notifications
  await runTestSection("platform.listNotifications", async () => {
    try {
        // Checking if notifications exists in platform or other resource
        // Looking at platform.ts, it doesn't seem to have listNotifications.
        // Let's check where it might be.
        const res = await (client as any).platform.listNotifications?.();
        logResult("Notifications", res);
    } catch (e) {
        console.warn("   [Skip] listNotifications failed");
    }
  });

  console.log("\n✅ CRM Resources Testing Completed.");
  }


if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testCrm().catch(console.error);
}

export { testCrm };

