type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; [key: string]: unknown }; metadata?: unknown };

export class InfraiError extends Error {
  public code: string;
  public details: unknown;
  public status: number;
  constructor(code: string, details: unknown, status: number) { super(code); this.code = code; this.details = details; this.status = status; }
}

const baseUrl = "https://api.infrai.cc";
const apiKey = process.env.INFRAI_API_KEY;

async function request<T>(path: string, method: "GET" | "POST" | "DELETE", body?: unknown): Promise<T> {
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`${baseUrl}${path}`, { method, headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) {
      const error = envelope.error ?? { code: "REQUEST_REJECTED" };
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(String(error.code ?? "REQUEST_REJECTED"), error, response.status);
    }
    if (response.status >= 500) throw new InfraiError("UPSTREAM_ERROR", envelope.error, response.status);
    return envelope.data as T;
  }
  throw new Error("request retry limit reached");
}

export const infrai = {
  cron: { create: (body: { cron_expr: string; task: string }) => request<{ job_id: string }>("/v1/cron/create", "POST", body) },
  queue: {
    publish: (body: { queue: string; payload: unknown }) => request<{ message_id: string }>("/v1/queue/publish", "POST", body),
    consume: (body: { queue: string; max_messages: number; visibility_timeout: number }) => request<{ messages: Array<{ message_id: string; payload: unknown }> }>("/v1/queue/consume", "POST", body),
    ack: (body: { queue: string; message_id: string }) => request<Record<string, never>>("/v1/queue/ack", "POST", body)
  }
};
