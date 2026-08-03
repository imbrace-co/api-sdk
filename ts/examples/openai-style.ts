import { createImbraceClient } from "../src/index.js";

async function main() {
  // 1. Khởi tạo Client (Giống OpenAI)
  const client = createImbraceClient({
    apiKey: "YOUR_API_KEY", // Hoặc accessToken cho client-side
    env: "develop",         // 'develop', 'sandbox', hoặc 'stable'
  });

  try {
    console.log("--- IMBrace SDK Demo ---");

    // 2. Chat AI - Liệt kê Models
    const { data: models } = await client.chatAi.listModels();
    console.log(`Available Models: ${models.map(m => m.id).join(", ")}`);

    // 3. Sử dụng Custom Prompts (Vừa được thêm vào SDK)
    // Lấy prompt đã tạo sẵn trong IMBrace System
    const myPrompt = await client.chatAi.getPrompt("coding-assistant");
    console.log(`Using Prompt: ${myPrompt.name}`);

    // 4. Chat Completion (OpenAI-style)
    const response = await client.chatAi.chat({
      model: "gpt-4o",
      messages: [
        { role: "system", content: myPrompt.content },
        { role: "user", content: "Làm sao để tích hợp IMBrace SDK?" }
      ],
      stream: false
    });
    console.log("AI Response:", response.choices[0].message.content);

    // 5. Automation - Trigger Workflow
    // Giả sử bạn có một workflow xử lý lead từ Chat
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
