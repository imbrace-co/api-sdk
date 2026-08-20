import { testAiAgent } from "./test-ai-agent.js";
import { testChatAi } from "./test-chat-ai.js";
import { testWorkflows } from "./test-workflows.js";
import { testBoards } from "./test-boards.js";
import { testCrm } from "./test-crm.js";
import { testPlatform } from "./test-platform.js";
import { testAgent } from "./test-agent.js";
import { testMarketplace } from "./test-marketplace.js";
import { testFullFlowGuide } from "./test-full-flow-guide.js";
import { testFrontendSdk } from "./test-frontend-sdk.js";
import { testMultiAgent } from "./test-multi-agent.js";
import { testCrmAdvanced } from "./test-crm-advanced.js";
import { testMultimediaAi } from "./test-multimedia-ai.js";
import { testSettings } from "./test-settings.js";
import { apiKey, accessToken, baseUrl } from "../utils/utils.js";

async function runAllTests() {
  console.log("================================================");
  console.log("   IMBRACE SDK COMPREHENSIVE TEST SUITE");
  console.log("================================================");
  console.log(`Target: ${baseUrl}`);
  console.log(`Mode:   ${accessToken ? "Access Token" : "API Key"}`);
  console.log("================================================");

  const modules = [
    { name: "Platform", fn: testPlatform },
    { name: "Agent", fn: testAgent },
    { name: "Marketplace", fn: testMarketplace },
    { name: "AiAgent", fn: testAiAgent },
    { name: "ChatAi", fn: testChatAi },
    { name: "Workflows", fn: testWorkflows },
    { name: "Boards", fn: testBoards },
    { name: "CRM", fn: testCrm },
    { name: "Full Flow Guide", fn: testFullFlowGuide },
    { name: "Frontend SDK", fn: testFrontendSdk },
    { name: "Multi-Agent", fn: testMultiAgent },
    { name: "CRM Advanced", fn: testCrmAdvanced },
    { name: "Multimedia AI", fn: testMultimediaAi },
    { name: "Settings", fn: testSettings },
  ];

  let passed = 0;
  let failed = 0;

  for (const mod of modules) {
    try {
      await mod.fn();
      passed++;
    } catch (e: any) {
      console.error(`\n❌ MODULE [${mod.name}] FAILED:`, e.message);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(48));
  console.log(`   TEST SUITE SUMMARY`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log("=".repeat(48));

  if (failed > 0) {
    console.log("\n⚠️ SOME MODULES FAILED. Please check the logs above.");
    process.exit(1);
  } else {
    console.log("\n🎉 ALL TEST MODULES FINISHED SUCCESSFULLY!");
  }
}

runAllTests();

