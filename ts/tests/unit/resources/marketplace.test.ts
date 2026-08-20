import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MarketplaceResource } from "../../../src/resources/marketplace.js";
import { HttpTransport } from "../../../src/http.js";
import { TokenManager } from "../../../src/auth/token-manager.js";

const GW = "https://app-gatewayv2.imbrace.co";
const BASE = `${GW}/marketplaces/v2`;

function makeResource() {
  const http = new HttpTransport({
    apiKey: "test_key",
    timeout: 5000,
    tokenManager: new TokenManager(),
  });
  return new MarketplaceResource(http, BASE, GW);
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    );
}

describe("MarketplaceResource", () => {
  let originalFetch: typeof fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  // ─── Templates

  it("listUseCaseTemplates() calls GET /marketplaces/v2/market-places/v2/templates", async () => {
    mockFetch([]);
    await makeResource().listUseCaseTemplates();
    const url = new URL(vi.mocked(globalThis.fetch).mock.calls[0][0] as string);
    expect(url.pathname).toBe("/marketplaces/v2/market-places/v2/templates");
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET");
  });

  it("installFromJson() calls POST /marketplaces/v2/market-places/templates/install-from-json", async () => {
    mockFetch({ success: true });
    await makeResource().installFromJson({ template: { name: "Load" } });
    const url = new URL(vi.mocked(globalThis.fetch).mock.calls[0][0] as string);
    expect(url.pathname).toBe("/marketplaces/v2/market-places/templates/install-from-json");
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST");
  });

  // ─── Files

  it("uploadFile() calls POST /marketplaces/v2/files", async () => {
    mockFetch({ url: "https://cdn.imbrace.co/f/abc" });
    await makeResource().uploadFile(new FormData());
    const url = new URL(vi.mocked(globalThis.fetch).mock.calls[0][0] as string);
    expect(url.pathname).toBe("/marketplaces/v2/files");
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST");
  });

  it("deleteFile() calls DELETE /marketplaces/v2/files/:id", async () => {
    mockFetch({});
    await makeResource().deleteFile("file_1");
    const url = new URL(vi.mocked(globalThis.fetch).mock.calls[0][0] as string);
    expect(url.pathname).toBe("/marketplaces/v2/files/file_1");
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("DELETE");
  });

  it("getFileDetails() calls GET /marketplaces/v2/file-details/:id", async () => {
    mockFetch({ _id: "file_1", name: "x.pdf" });
    await makeResource().getFileDetails("file_1");
    const url = new URL(vi.mocked(globalThis.fetch).mock.calls[0][0] as string);
    expect(url.pathname).toBe("/marketplaces/v2/file-details/file_1");
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET");
  });

  // ─── Email templates

  it("listEmailTemplates() calls GET /marketplaces/v2/email-templates/search", async () => {
    mockFetch([]);
    await makeResource().listEmailTemplates({ q: "welcome" });
    const url = new URL(vi.mocked(globalThis.fetch).mock.calls[0][0] as URL);
    expect(url.pathname).toBe("/marketplaces/v2/email-templates/search");
    expect(url.searchParams.get("q")).toBe("welcome");
  });

  it("createEmailTemplate() calls POST /marketplaces/v2/email-templates", async () => {
    mockFetch({ _id: "et_1" });
    await makeResource().createEmailTemplate({ name: "Welcome" });
    const url = new URL(vi.mocked(globalThis.fetch).mock.calls[0][0] as string);
    expect(url.pathname).toBe("/marketplaces/v2/email-templates");
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST");
  });

  // ─── Channel workflows

  it("postChannelWorkflows() calls POST /marketplaces/v2/market-places/channel-workflows", async () => {
    mockFetch({ success: true });
    await makeResource().postChannelWorkflows({ channel_id: "c_1", workflow_id: "w_1" });
    const url = new URL(vi.mocked(globalThis.fetch).mock.calls[0][0] as string);
    expect(url.pathname).toBe("/marketplaces/v2/market-places/channel-workflows");
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST");
  });

  it("sends x-api-key header", async () => {
    mockFetch([]);
    await makeResource().listUseCaseTemplates();
    const headers = new Headers(
      vi.mocked(globalThis.fetch).mock.calls[0][1]?.headers as HeadersInit,
    );
    expect(headers.get("x-api-key")).toBe("test_key");
  });
});
