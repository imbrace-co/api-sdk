/**
 * Mirrors every snippet from
 * https://imbraceltd.github.io/api-sdk/typescript/full-flow-guide/
 *
 * Run mode is selected via AUTH_MODE=apikey | token (default: apikey).
 * Required env: IMBRACE_API_KEY, IMBRACE_ACCESS_TOKEN, IMBRACE_ORGANIZATION_ID
 */
import { ImbraceClient } from "@imbrace/sdk";
import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env") });

const AUTH_MODE = (process.env.AUTH_MODE || "apikey").toLowerCase();
const apiKey = process.env.IMBRACE_API_KEY;
const accessToken = process.env.IMBRACE_ACCESS_TOKEN;
const organizationId = process.env.IMBRACE_ORGANIZATION_ID!;
const baseUrl = process.env.IMBRACE_GATEWAY_URL || "https://app-gatewayv2.imbrace.co";

if (!organizationId) throw new Error("IMBRACE_ORGANIZATION_ID required");
if (AUTH_MODE === "apikey" && !apiKey) throw new Error("IMBRACE_API_KEY required");
if (AUTH_MODE === "token" && !accessToken) throw new Error("IMBRACE_ACCESS_TOKEN required");

const client = new ImbraceClient({
  baseUrl,
  apiKey: AUTH_MODE === "apikey" ? apiKey : undefined,
  accessToken: AUTH_MODE === "token" ? accessToken : undefined,
  organizationId,
  timeout: 60000,
});

const results: Array<{ step: string; status: "ok" | "fail"; ms?: number; error?: string }> = [];
async function step(label: string, fn: () => Promise<any>) {
  const t0 = Date.now();
  process.stdout.write(`  [${label}] ... `);
  try {
    const r = await fn();
    const ms = Date.now() - t0;
    console.log(`OK (${ms}ms)`);
    results.push({ step: label, status: "ok", ms });
    return r;
  } catch (err: any) {
    const ms = Date.now() - t0;
    const msg = err?.message || String(err);
    const status = err?.statusCode || err?.status || "?";
    const body = err?.body ? ` body=${JSON.stringify(err.body).slice(0, 300)}` : "";
    console.log(`FAIL (${ms}ms) status=${status} ${msg}${body}`);
    results.push({ step: label, status: "fail", ms, error: `${status} ${msg}` });
    return null;
  }
}

async function consumeSse(response: Response, label: string) {
  if (!response?.body) throw new Error(`Empty SSE body for ${label}`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let events = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const buf = decoder.decode(value);
    for (const line of buf.split("\n")) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6).trim();
        if (data && data !== "[DONE]") {
          events++;
          try {
            const chunk = JSON.parse(data);
            // Vercel AI SDK: text-delta carries delta; legacy format uses content
            text += chunk.delta ?? chunk.content ?? "";
          } catch {}
        }
      }
    }
  }
  if (events === 0) throw new Error(`No SSE events received for ${label}`);
  return { events, text };
}

async function main() {
  console.log(`\n========== AUTH_MODE=${AUTH_MODE} | base=${baseUrl} ==========`);
  const ts = Date.now();
  const state: any = {};

  // ---------------- SECTION 1 ----------------
  console.log("\n[Section 1] Assistant + Chat");

  await step("1.2 createAiAgent", async () => {
    const a = await client.chatAi.createAiAgent({
      name: `Support Bot ${ts}`,
      workflow_name: `support_bot_v1_${ts}`,
      description: "Handles tier-1 customer support queries",
      instructions: "You are a helpful support agent. Be concise and friendly.",
      model_id: "gpt-4o",
      provider_id: "system",
    } as any);
    state.assistantId = a.id;
    return a.id;
  });

  if (state.assistantId) {
    await step("1.3 streamChat (single turn)", async () => {
      const response = await client.aiAgent.streamChat({
        assistant_id: state.assistantId,
        organization_id: organizationId,
        messages: [{ role: "user", content: "How do I reset my password?" }],
      });
      const { events, text } = await consumeSse(response, "single");
      return `${events} events, ${text.length} chars`;
    });

    await step("1.4 streamChat (multi-turn w/ session)", async () => {
      const sessionId = randomUUID();
      const r1 = await client.aiAgent.streamChat({
        assistant_id: state.assistantId,
        organization_id: organizationId,
        id: sessionId,
        messages: [{ role: "user", content: "What's your refund policy?" }],
      });
      await consumeSse(r1, "turn1");
      const r2 = await client.aiAgent.streamChat({
        assistant_id: state.assistantId,
        organization_id: organizationId,
        id: sessionId,
        messages: [{ role: "user", content: "How long does it take?" }],
      });
      await consumeSse(r2, "turn2");
    });
  }

  // ---------------- SECTION 2 ----------------
  console.log("\n[Section 2] Workflow");

  await step("2.1 listFlows", async () => {
    const res: any = await client.workflows.listFlows({ limit: 5 });
    state.flows = res?.data || [];
    state.projectId = state.flows[0]?.projectId;
    return `${state.flows.length} flows, projectId=${state.projectId}`;
  });

  if (state.projectId) {
    await step("2.2 createFlow", async () => {
      const f: any = await client.workflows.createFlow({
        displayName: `CRM Update on New Lead ${ts}`,
        projectId: state.projectId,
      });
      state.flowId = f?.id;
      return state.flowId;
    });
  } else {
    results.push({ step: "2.2 createFlow", status: "fail", error: "skipped: no projectId from listFlows" });
    console.log("  [2.2 createFlow] SKIP (no projectId)");
  }

  if (state.flowId) {
    await step("2.3 triggerFlow (async)", async () => {
      await client.workflows.triggerFlow(state.flowId, {
        contact_name: "Jane Smith",
        email: "jane@example.com",
      });
    });

    await step("2.3 triggerFlowSync", async () => {
      const r = await client.workflows.triggerFlowSync(state.flowId, {
        contact_name: "Jane Smith",
        email: "jane@example.com",
      });
      return r;
    });

    if (state.assistantId) {
      await step("2.4 updateAiAgent w/ workflow_function_call", async () => {
        await client.chatAi.updateAiAgent(state.assistantId, {
          name: `Support Bot ${ts}`,
          workflow_name: `support_bot_v1_${ts}`,
          workflow_function_call: [
            { flow_id: state.flowId, description: "Update CRM on new lead" } as any,
          ],
        } as any);
      });
    }

    await step("2.5 listRuns", async () => {
      const r: any = await client.workflows.listRuns({ flowId: state.flowId, limit: 10 });
      return `${r?.data?.length ?? 0} runs`;
    });
  } else {
    console.log("  [2.3-2.5] SKIP (no flowId)");
  }

  // ---------------- SECTION 3 ----------------
  console.log("\n[Section 3] Knowledge Hub");

  await step("3.1 createFolder", async () => {
    const f: any = await client.boards.createFolder({
      name: `Product Documentation ${ts}`,
      organization_id: organizationId,
      parent_folder_id: "root",
      source_type: "upload",
    } as any);
    state.folderId = f._id || f.id;
    return state.folderId;
  });

  if (state.folderId) {
    await step("3.2 uploadFile", async () => {
      const tmpDir = "/tmp/imbrace-sdk-test";
      mkdirSync(tmpDir, { recursive: true });
      const path = `${tmpDir}/faq-${ts}.txt`;
      writeFileSync(path, `IMBRACE FAQ ${ts}\nThe magic word is BANANA-${ts}.\n`);
      const buf = readFileSync(path);
      const fd = new FormData();
      fd.append("file", new Blob([buf], { type: "text/plain" }), "faq.txt");
      fd.append("folder_id", state.folderId);
      fd.append("organization_id", organizationId);
      const uploaded: any = await client.boards.uploadFile(fd);
      state.uploadedFileId = uploaded?.file_id || uploaded?._id;
      return state.uploadedFileId;
    });

    if (state.assistantId) {
      await step("3.3 updateAiAgent w/ knowledge_hubs", async () => {
        await client.chatAi.updateAiAgent(state.assistantId, {
          name: `Support Bot ${ts}`,
          workflow_name: `support_bot_v1_${ts}`,
          folder_ids: [state.folderId],
        } as any);
      });
    }

    await step("3.4 searchFolders", async () => {
      const list: any = await client.boards.searchFolders({ q: "Product" });
      return `${(list?.length ?? list?.data?.length) || 0} folders`;
    });

    await step("3.4 getFolderContents", async () => {
      const c: any = await client.boards.getFolderContents(state.folderId);
      return `files=${c?.files?.length ?? 0}`;
    });

    await step("3.4 updateFolder", async () => {
      await client.boards.updateFolder(state.folderId, { name: `Product Docs v2 ${ts}` } as any);
    });

    await step("3.4 searchFiles by folderId", async () => {
      const files: any = await client.boards.searchFiles({ folderId: state.folderId } as any);
      return `${(files?.length ?? files?.data?.length) || 0} files`;
    });
  } else {
    console.log("  [3.2-3.4] SKIP (no folder)");
  }

  // ---------------- SECTION 4 ----------------
  console.log("\n[Section 4] Boards & Items");

  await step("4.1 boards.create", async () => {
    const b: any = await client.boards.create({
      name: `Sales Pipeline ${ts}`,
      description: "Track all active deals",
    });
    state.boardId = b._id || b.id;
    return state.boardId;
  });

  if (state.boardId) {
    await step("4.2 createField + find identifier", async () => {
      const u: any = await client.boards.createField(state.boardId, {
        name: "Company",
        type: "ShortText",
      });
      state.idField = u.fields?.find((f: any) => f.is_identifier);
      if (!state.idField?._id) throw new Error("No identifier field on board after createField");
      return state.idField._id;
    });

    if (state.idField?._id) {
      await step("4.3 createItem", async () => {
        const it: any = await client.boards.createItem(state.boardId, {
          fields: [{ board_field_id: state.idField._id, value: "Acme Corp" }],
        });
        state.itemId = it._id || it.id;
        return state.itemId;
      });

      await step("4.4 listItems", async () => {
        const r: any = await client.boards.listItems(state.boardId, { limit: 20, skip: 0 } as any);
        return `${r?.data?.length ?? 0} items`;
      });

      await step("4.4 search", async () => {
        const r: any = await client.boards.search(state.boardId, { q: "Acme", limit: 10 } as any);
        return `${r?.data?.length ?? 0} matches`;
      });

      if (state.itemId) {
        await step("4.5 updateItem", async () => {
          await client.boards.updateItem(state.boardId, state.itemId, {
            data: [{ key: state.idField._id, value: "Acme Corp — Closed Won" }],
          } as any);
        });

        await step("4.5 deleteItem", async () => {
          await client.boards.deleteItem(state.boardId, state.itemId);
        });
      }

      await step("4.6 exportCsv", async () => {
        const csv: any = await client.boards.exportCsv(state.boardId);
        if (typeof csv !== "string") throw new Error(`exportCsv returned ${typeof csv}, not string`);
        return `${csv.length} bytes`;
      });
    }
  }

  // ---------------- CLEANUP ----------------
  console.log("\n[Cleanup]");
  if (state.folderId) {
    await step("cleanup.deleteFolders", async () => {
      await client.boards.deleteFolders({ ids: [state.folderId] });
    });
  }
  if (state.boardId) {
    await step("cleanup.boards.delete", async () => {
      await client.boards.delete(state.boardId);
    });
  }
  if (state.flowId) {
    await step("cleanup.flow", async () => {
      try {
        await (client.workflows as any).deleteFlow?.(state.flowId);
      } catch {}
    });
  }
  if (state.assistantId) {
    await step("cleanup.deleteAiAgent", async () => {
      await client.chatAi.deleteAiAgent(state.assistantId);
    });
  }

  // ---------------- SUMMARY ----------------
  const ok = results.filter(r => r.status === "ok").length;
  const fail = results.filter(r => r.status === "fail").length;
  console.log(`\n========== SUMMARY [AUTH_MODE=${AUTH_MODE}] ==========`);
  console.log(`PASS=${ok}  FAIL=${fail}`);
  for (const r of results) {
    if (r.status === "fail") console.log(`  FAIL  ${r.step}  -- ${r.error}`);
  }
  console.log("==================================================\n");

  if (fail > 0) process.exitCode = 1;
}

main().catch(e => {
  console.error("\nFATAL:", e);
  process.exit(2);
});
