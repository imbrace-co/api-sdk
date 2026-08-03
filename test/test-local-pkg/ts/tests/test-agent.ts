import { pathToFileURL } from 'url';
import { client, runTestSection, logResult } from "../utils/utils.js";

async function testAgent() {
  console.log("\n🚀 Testing Agent Templates and Use Cases...");

  let templateId: string | null = null;
  let useCaseId: string | null = null;

  // 1. Templates
  await runTestSection("agent.list", async () => {
    const templates = await client.agent.list();
    logResult("Templates Count", templates.length);
  });

  // Template create is now via `agent.createUseCase` (POST /use-cases/v2/custom
  // creates the assistant+usecase pair in the new marketplace microservice).
  // `agent.create` was removed when migrating away from /v2/backend/templates/custom.

  // 2. Use Cases
  await runTestSection("agent.listUseCases", async () => {
    const useCases = await client.agent.listUseCases();
    logResult("UseCases Count", useCases.length);
  });

  await runTestSection("agent.createUseCase", async () => {
    const ts = Date.now();
    const uc = await client.agent.createUseCase({
      usecase: {
        title: `SDK Custom UC ${ts}`,
        description: "Test description",
      },
      assistant: {
        name: `SDK Custom Assistant ${ts}`,
        description: "Paired with the test use-case",
        model_id: "gpt-4o",
        provider_id: "system",
        // ai-service /assistant_apps requires workflow_name
        workflow_name: `sdk_custom_uc_${ts}`,
      },
    });
    useCaseId = (uc as any)._id || (uc as any).id || (uc as any)?.data?._id || (uc as any)?.data?.id;
    logResult("UseCase Created", useCaseId);
  });

  if (useCaseId) {
    await runTestSection("agent.getUseCase", () => client.agent.getUseCase(useCaseId!));
    await runTestSection("agent.updateUseCase", () => client.agent.updateUseCase(useCaseId!, {
        description: "Updated UC description"
    }));
    await runTestSection("agent.deleteUseCase", () => client.agent.deleteUseCase(useCaseId!));
  }

  console.log("\n✅ Agent Resource Testing Completed.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  testAgent().catch(console.error);
}

export { testAgent };

