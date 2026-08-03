import { ImbraceClient } from "../src/index.js"

const client = new ImbraceClient({
  accessToken: process.env.IMBRACE_ACCESS_TOKEN!,
  organizationId: process.env.IMBRACE_ORG_ID,
  env: "stable",
})

// List channels
const channels = await client.channel.list()
console.log("Channels:", channels.length)

// List conversations
const conversations = await client.conversations.list({ limit: 10 })
console.log("Conversations:", conversations)

// Send a text message (must be called inside an active conversation context)
const msg = await client.messages.send({ type: "text", text: "Hello from iMBRACE SDK!" })
console.log("Sent:", msg)
