import { ImbraceClient } from "../src/index.js"

const client = new ImbraceClient({
  apiKey: process.env.IMBRACE_API_KEY!,
  organizationId: process.env.IMBRACE_ORG_ID,
  env: "stable",
})

const channels = await client.channel.list()
console.log("Channels:", channels)
