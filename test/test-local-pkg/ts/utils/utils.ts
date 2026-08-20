import { ImbraceClient } from "@imbrace/sdk";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });

export const apiKey = process.env.IMBRACE_API_KEY;
export const accessToken = process.env.IMBRACE_ACCESS_TOKEN;
export const organizationId = process.env.IMBRACE_ORGANIZATION_ID;
export const baseUrl = process.env.IMBRACE_GATEWAY_URL || "https://app-gatewayv2.imbrace.co";
export const timeout = parseInt(process.env.IMBRACE_TIMEOUT || "60000");

if ((!apiKey && !accessToken) || !organizationId) {
  console.error("❌ ERROR: Missing configuration in .env!");
  console.error("Required: (IMBRACE_API_KEY OR IMBRACE_ACCESS_TOKEN) AND IMBRACE_ORGANIZATION_ID");
  process.exit(1);
}

// Prefer access-token when available. With BOTH set, the gateway's authorize
// middleware sometimes resolves api-key first (legacy backend token store)
// and then strips the access-token before forwarding to platform-service,
// causing spurious 401s on /platform/v2/* routes.
const useAccessToken = !!accessToken;
export const client = new ImbraceClient({
  apiKey: !useAccessToken ? (apiKey || undefined) : undefined,
  accessToken: useAccessToken ? accessToken : undefined,
  baseUrl,
  timeout,
  organizationId: organizationId || undefined,
});

export async function runTestSection(name: string, fn: () => Promise<any>) {
  console.log(`\n--- [TEST] ${name} ---`);
  try {
    const start = Date.now();
    const result = await fn();
    const end = Date.now();
    console.log(`✅ Passed (${end - start}ms)`);
    return result;
  } catch (error: any) {
    console.error(`❌ Failed: ${error.message}`);
    if (error.statusCode) console.error(`   HTTP Status: ${error.statusCode}`);
    // Skip 404s (endpoint missing on env) and 403s (perm boundary — e.g. team
    // updates require business-unit membership that the test account may lack).
    if (error.statusCode === 404) {
        console.warn(`   ⚠️ Skipping section due to 404 (Endpoint might not exist on this environment)`);
        return null;
    }
    if (error.statusCode === 403 || /403|Forbidden/i.test(error.message)) {
        console.warn(`   ⚠️ Skipping section due to 403 (Test account lacks permission for this operation)`);
        return null;
    }
    throw error; // Re-throw to stop if it's a critical failure (like auth)
  }
}

export function logResult(label: string, data: any) {
    let display = "N/A";
    if (Array.isArray(data)) {
        display = `${data.length} items`;
    } else if (data) {
        display = data._id || data.id || (typeof data === 'string' ? data : JSON.stringify(data))?.slice(0, 100);
    }
    console.log(`   ${label}:`, display);
}
