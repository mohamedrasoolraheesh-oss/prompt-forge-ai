import { supabase } from "@/integrations/supabase/client";
import type { Breakdown } from "@/lib/constants";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${data.session?.access_token ?? ""}`,
  };
}

export class AIRequestError extends Error {}

/** POSTs to the unified AI endpoint and streams plain-text chunks back. */
export async function streamAI(
  body: Record<string, unknown>,
  onChunk: (full: string, delta: string) => void,
  signal?: AbortSignal,
): Promise<{ text: string; demo: boolean }> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
    signal: signal ?? null,
  });

  if (!res.ok || !res.body) {
    let message = "We couldn't reach the AI service right now.";
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) message = j.error;
    } catch {
      /* non-json error */
    }
    throw new AIRequestError(message);
  }

  const demo = res.headers.get("x-demo-mode") === "1";
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const delta = decoder.decode(value, { stream: true });
    text += delta;
    onChunk(text, delta);
  }
  return { text, demo };
}

export async function callAI<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new AIRequestError((json["error"] as string) ?? "Request failed.");
  return json as T;
}

export type ScoreResult = { breakdown: Breakdown; suggestions: string[]; demo: boolean };

export function scorePrompt(prompt: string, model: string) {
  return callAI<ScoreResult>({ action: "score", prompt, model });
}

export type CompareRow = {
  model: string;
  label: string;
  response: string;
  latency: number;
  tokens: number;
  cost: number;
  score: number;
  error: string | null;
};
