import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OrganizationsResource } from "../../../src/resources/organizations.js";
import { HttpTransport } from "../../../src/http.js";
import { TokenManager } from "../../../src/auth/token-manager.js";

const BASE = "https://app-gatewayv2.imbrace.co";

function makeResource() {
  const http = new HttpTransport({
    apiKey: "test_key",
    timeout: 5000,
    tokenManager: new TokenManager(),
  });
  return new OrganizationsResource(http, BASE);
}

function makeResourceWithToken(token: string) {
  const tm = new TokenManager(token);
  const http = new HttpTransport({ timeout: 5000, tokenManager: tm });
  return new OrganizationsResource(http, BASE);
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

describe("OrganizationsResource", () => {
  let originalFetch: typeof fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("list() delegates to /v2/organizations/_all (paged endpoint requires login_acc_ token)", async () => {
    mockFetch({
      data: [
        { _id: "org_1", name: "Acme" },
        { _id: "org_2", name: "Beta" },
      ],
    });
    const res = await makeResource().list();
    const url = new URL(vi.mocked(globalThis.fetch).mock.calls[0][0] as URL);
    expect(url.pathname).toBe("/v2/organizations/_all");
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET");
    expect(res.data.length).toBe(2);
    expect(res.total).toBe(2);
  });

  it("list() slices by limit and skip client-side", async () => {
    mockFetch({
      data: [
        { _id: "org_1" },
        { _id: "org_2" },
        { _id: "org_3" },
        { _id: "org_4" },
      ],
    });
    const res = await makeResource().list({ limit: 2, skip: 1 });
    expect(res.data.map((o) => (o as any)._id)).toEqual(["org_2", "org_3"]);
    expect(res.total).toBe(4);
  });

  it("list() with skip=0 returns first slice", async () => {
    mockFetch({ data: [{ _id: "org_1" }, { _id: "org_2" }] });
    const res = await makeResource().list({ skip: 0, limit: 1 });
    expect(res.data.map((o) => (o as any)._id)).toEqual(["org_1"]);
  });

  it("listAll() unwraps the {object_name, data} envelope", async () => {
    mockFetch({ object_name: "list", data: [{ _id: "org_1" }] });
    const res = await makeResource().listAll();
    expect(Array.isArray(res)).toBe(true);
    expect((res[0] as any)._id).toBe("org_1");
  });

  it("sends x-api-key header", async () => {
    mockFetch({ data: [] });
    await makeResource().list();
    const headers = new Headers(
      vi.mocked(globalThis.fetch).mock.calls[0][1]?.headers as HeadersInit,
    );
    expect(headers.get("x-api-key")).toBe("test_key");
  });

  it("list() with login_acc_ token hits the paged /v1/organizations endpoint", async () => {
    mockFetch({
      object_name: "list",
      data: [{ id: "org_1" }],
      count: 1,
      total: 1,
    });
    const res = await makeResourceWithToken("login_acc_abc123").list({
      limit: 10,
      skip: 0,
    });
    const url = new URL(vi.mocked(globalThis.fetch).mock.calls[0][0] as URL);
    expect(url.pathname).toBe("/v1/organizations");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("skip")).toBe("0");
    expect(res.data.length).toBe(1);
    expect(res.total).toBe(1);
  });

  it("listForLogin() always hits paged /v1/organizations regardless of token", async () => {
    mockFetch({
      object_name: "list",
      data: [{ id: "org_1" }, { id: "org_2" }],
      count: 2,
      total: 2,
    });
    const res = await makeResource().listForLogin({ limit: 5, skip: 2 });
    const url = new URL(vi.mocked(globalThis.fetch).mock.calls[0][0] as URL);
    expect(url.pathname).toBe("/v1/organizations");
    expect(url.searchParams.get("limit")).toBe("5");
    expect(url.searchParams.get("skip")).toBe("2");
    expect(res.data.length).toBe(2);
  });
});
