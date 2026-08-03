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

  await runTestSection("agent.create (Custom)", async () => {
    const template = await client.agent.create({
      assistant: {
        name: `SDK Test Agent ${Date.now()}`,
        instructions: "You are a test agent."
      },
      usecase: {
        name: `SDK Test UseCase ${Date.now()}`,
        category: "Test"
      }
    });
    templateId = template._id || template.id;
    logResult("Template Created", templateId);
  });

  if (templateId) {
    await runTestSection("agent.get", () => client.agent.get(templateId!));
    await runTestSection("agent.update", () => client.agent.update(templateId!, {
        assistant: { instructions: "Updated instructions" }
    }));
    await runTestSection("agent.delete", () => client.agent.delete(templateId!));
  }

  // 2. Use Cases
  await runTestSection("agent.listUseCases", async () => {
    const useCases = await client.agent.listUseCases();
    logResult("UseCases Count", useCases.length);
  });

  await runTestSection("agent.createUseCase", async () => {
    const uc = await client.agent.createUseCase({
      name: `SDK Custom UC ${Date.now()}`,
      description: "Test description"
    });
    useCaseId = uc._id || uc.id;
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

