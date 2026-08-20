import { createImbraceClient } from "../src/index.js";

async function main() {
  // 1. Initialize the Client (OpenAI-style)
  const client = createImbraceClient({
    apiKey: "YOUR_API_KEY", // Or accessToken for client-side
    env: "develop",         // 'develop', 'sandbox', or 'stable'
  });

  try {
    console.log("--- IMBrace SDK Demo ---");

    // 2. Chat AI - List Models
    const { data: models } = await client.chatAi.listModels();
    console.log(`Available Models: ${models.map(m => m.id).join(", ")}`);

    // 3. Use Custom Prompts (recently added to the SDK)
    // Fetch a prompt already created in the IMBrace System
    const myPrompt = await client.chatAi.getPrompt("coding-assistant");
    console.log(`Using Prompt: ${myPrompt.name}`);

    // 4. Chat Completion (OpenAI-style)
    const response = await client.chatAi.chat({
      model: "gpt-4o",
      messages: [
        { role: "system", content: myPrompt.content },
        { role: "user", content: "How do I integrate the IMBrace SDK?" }
      ],
      stream: false
    });
    console.log("AI Response:", response.choices[0].message.content);

    // 5. Automation - Trigger Workflow
    // Assume you have a workflow that processes leads from Chat
    const flowResult = await client.workflows.triggerFlow("YOUR_FLOW_ID", {
      chat_id: "chat_123",
      content: response.choices[0].message.content
    });
    console.log("Workflow Triggered:", flowResult);

  } catch (error) {
    console.error("Error using SDK:", error);
  }
}

main();
