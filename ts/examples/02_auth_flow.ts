import { ImbraceClient } from "../src/index.js"

// Step 1: sign in with email + password to get an access token
const bootstrap = new ImbraceClient({ env: "stable" })
const result = await bootstrap.auth.signIn({
  email: process.env.IMBRACE_EMAIL!,
  password: process.env.IMBRACE_PASSWORD!,
})
const accessToken = result.accessToken
const orgId = process.env.IMBRACE_ORG_ID!

// Step 2: use the SDK with the scoped access token
const client = new ImbraceClient({
  accessToken,
  organizationId: orgId,
  env: "stable",
})

const me = await client.platform.getMe()
console.log("Logged in as:", me)
