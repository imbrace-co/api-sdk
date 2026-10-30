import { TokenManager } from "./auth/token-manager.js";
import { AuthError, ApiError, NetworkError } from "./errors.js";

/** Detect if a token is a JWT (3 dot-separated base64 parts, starts with eyJ).
 *  Legacy opaque tokens like 'login_acc_...' always return false.
 */
function isJwt(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && token.startsWith("eyJ");
}

interface TransportOptions {
  apiKey?: string;
  timeout: number;
  tokenManager: TokenManager;
  organizationId?: string;
  /** Retries after the first attempt. 0 = a single attempt. Default 3. */
  maxRetries?: number;
  /** fetch used for every request. Default globalThis.fetch. */
  fetch?: typeof fetch;
}

const DEFAULT_MAX_RETRIES = 3;
// A server asking for a longer wait than this gets its error surfaced instead
// of the SDK holding the call open.
const MAX_RETRY_AFTER_MS = 60_000;

/** Parse a Retry-After header (delay-seconds or HTTP-date) into milliseconds. */
export function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000;
  const date = Date.parse(trimmed);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, date - Date.now());
}

export class HttpTransport {
  constructor(private readonly opts: TransportOptions) {}

  public clearApiKey(): void {
    this.opts.apiKey = undefined
  }

  /** Returns the org id configured on the client, if any. */
  public getOrganizationId(): string | undefined {
    return this.opts.organizationId
  }

  /** Set or clear the org id sent as x-organization-id on every request. */
  public setOrganizationId(id: string | undefined): void {
    this.opts.organizationId = id
  }

  /** Returns the current access token, if any. */
  public getToken(): string | undefined {
    return this.opts.tokenManager.getToken()
  }

  /** Wait between retries; rejects as soon as the caller's signal aborts. */
  private sleep(ms: number, signal?: AbortSignal | null): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new NetworkError("Request aborted by user"));
        return;
      }
      const onAbort = () => {
        clearTimeout(timer);
        reject(new NetworkError("Request aborted by user"));
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }

  public getFetch(): typeof fetch {
    return (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      let retries = 0;
      const maxRetries = this.opts.maxRetries ?? DEFAULT_MAX_RETRIES;
      const fetchImpl = this.opts.fetch ?? globalThis.fetch;
      // POST/PATCH may already have run on the server when a response is lost or late, so
      // only methods that are safe to repeat are retried on timeouts, network errors and 5xx.
      // 429 and 503 mean the request was refused before it ran, so those are retried for all.
      const method = (init?.method ?? "GET").toUpperCase();
      const retrySafe = ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"].includes(method);

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const controller = new AbortController();
        const parentSignal = init?.signal;

        if (parentSignal?.aborted) {
          throw new NetworkError("Request aborted by user");
        }

        const abortListener = () => controller.abort();
        if (parentSignal) {
          parentSignal.addEventListener('abort', abortListener);
        }

        const timeoutId = setTimeout(() => controller.abort(), this.opts.timeout);
        
        const reqInit: RequestInit = {
          ...init,
          signal: controller.signal,
          headers: new Headers(init?.headers),
        };

        const headers = reqInit.headers as Headers;
        const token = this.opts.tokenManager.getToken();

        // 1. API key (server-to-server)
        if (this.opts.apiKey) {
          headers.set("x-api-key", this.opts.apiKey);
        }

        // 2. Access token / JWT (user context)
        if (token && this.opts.organizationId && isJwt(token)) {
          headers.set("authorization", `Bearer ${token}`);
        } else if (token) {
          headers.set("x-access-token", token);
        }

        // 3. Organization scope — required by some services (chat-ai, document) even with x-api-key,
        //    since the gateway does not auto-inject it from the api-key for every route.
        if (this.opts.organizationId) {
          headers.set("x-organization-id", this.opts.organizationId);
        }

        try {
          const res = await fetchImpl(input, reqInit);

          if (timeoutId) clearTimeout(timeoutId);

          if (res.ok) {
            // Reason: the caller's signal stays wired to this request so an abort
            // after the headers arrive still cancels the body — for SSE that is the
            // whole stream, not just its start. The listener lives as long as the
            // caller's signal, so use one signal per request, not one for many.
            return res;
          }

          if (parentSignal) parentSignal.removeEventListener('abort', abortListener);

          if (res.status === 401 || res.status === 403) {
            // Surface the server's reason — useful when the cause isn't bad creds
            // (e.g. missing x-organization-id, missing required header, route ACL).
            const detail = await res.text().catch(() => "");
            const suffix = detail ? ` — server: ${detail.slice(0, 300)}` : "";
            if (this.opts.apiKey) {
              throw new AuthError(`Auth failed [${res.status}] with x-api-key${suffix}`);
            } else if (token && this.opts.organizationId && isJwt(token)) {
              throw new AuthError(`Auth failed [${res.status}] with JWT (Authorization: Bearer)${suffix}`);
            } else if (token) {
              throw new AuthError(`Auth failed [${res.status}] with x-access-token${suffix}`);
            }
            throw new AuthError(`No credentials provided — set accessToken= (user login) or apiKey= (server-to-server)${suffix}`);
          }

          if ((res.status === 429 || res.status === 503 || (res.status >= 500 && retrySafe)) && retries < maxRetries) {
            const retryAfter = parseRetryAfter(res.headers.get("retry-after"));
            if (retryAfter === undefined || retryAfter <= MAX_RETRY_AFTER_MS) {
              await this.sleep(retryAfter ?? 1000 * Math.pow(2, retries), parentSignal);
              retries++;
              continue;
            }
          }

          const text = await res.text().catch(() => "Unknown error");
          throw new ApiError(res.status, text);

        } catch (error) {
          if (timeoutId) clearTimeout(timeoutId);
          if (parentSignal) parentSignal.removeEventListener('abort', abortListener);

          // NetworkError here comes from an aborted retry wait — never retry it.
          if (error instanceof AuthError || error instanceof ApiError || error instanceof NetworkError) {
            throw error;
          }

          if (error instanceof Error && error.name === 'AbortError') {
             if (parentSignal?.aborted) {
               throw new NetworkError("Request aborted by user");
             }

             if (retrySafe && retries < maxRetries) {
               await this.sleep(1000 * Math.pow(2, retries), parentSignal);
               retries++;
               continue;
             }
             throw new NetworkError(`Request timed out after ${this.opts.timeout}ms`);
          }

          if (retrySafe && retries < maxRetries) {
            await this.sleep(1000 * Math.pow(2, retries), parentSignal);
            retries++;
            continue;
          }

          throw new NetworkError(error instanceof Error ? error.message : "Network error or server unreachable");
        }
      }
    }) as unknown as typeof fetch;
  }
}
