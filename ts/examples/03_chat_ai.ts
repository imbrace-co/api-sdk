import { ImbraceClient } from "../src/index.js"

const client = new ImbraceClient({
  accessToken: process.env.IMBRACE_ACCESS_TOKEN!,
  organizationId: process.env.IMBRACE_ORG_ID,
  env: "stable",
})

// List available models
const { data: models } = await client.chatAi.listModels()
console.log("Models:", models.map(m => m.id))

// Chat completion
const response = await client.chatAi.chat({
  model: "gpt-4o",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Summarize iMBRACE in one sentence." },
  ],
})
console.log("AI:", response.choices[0].message.content)

// Manage chats
const chats = await client.chatAi.listChats()
console.log("Existing chats:", chats.length)

const newChat = await client.chatAi.createChat({ title: "SDK Demo Chat" })
console.log("Created:", newChat.id)

// Manage knowledge bases
const knowledge = await client.chatAi.listKnowledge()
console.log("Knowledge bases:", knowledge.length)
