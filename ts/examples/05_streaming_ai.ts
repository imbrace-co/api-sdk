import { ImbraceClient } from "../src/index.js"

const client = new ImbraceClient({
  accessToken: process.env.IMBRACE_ACCESS_TOKEN!,
  organizationId: process.env.IMBRACE_ORG_ID,
  env: "stable",
})

// Non-streaming completion
const completion = await client.ai.complete({
  model: "gpt-4o",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Summarize iMBRACE in one sentence." },
  ],
})
console.log("Completion:", completion.choices[0].message.content)

// Streaming completion
process.stdout.write("Streaming: ")
for await (const chunk of client.ai.stream({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Count from 1 to 5." }],
})) {
  const content = chunk.choices[0]?.delta?.content ?? ""
  process.stdout.write(content)
}
console.log()
