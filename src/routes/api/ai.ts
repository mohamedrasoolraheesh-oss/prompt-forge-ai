import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import {
  AIError,
  PROVIDERS,
  completeText,
  forgeMessages,
  heuristicScore,
  isDemoMode,
  optimizeMessages,
  scoreMessages,
  streamCompletion,
  type ModelKey,
} from "@/lib/forge.server";

async function requireUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const textStream = (stream: ReadableStream<Uint8Array>) =>
  new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-demo-mode": isDemoMode() ? "1" : "0",
    },
  });

type Body = {
  action: "forge" | "optimize" | "run" | "compare" | "score";
  idea?: string;
  prompt?: string;
  category?: string;
  model?: ModelKey;
  style?: string;
  modes?: string[];
  temperature?: number;
  maxTokens?: number;
  system?: string;
  models?: ModelKey[];
};

export const Route = createFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await requireUser(request);
        if (!user) return json({ error: "Unauthorized" }, 401);

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const model: ModelKey = (body.model && PROVIDERS[body.model] ? body.model : "gemini")!;

        try {
          switch (body.action) {
            case "forge": {
              const idea = (body.idea ?? "").trim();
              if (idea.length < 8)
                return json({ error: "Describe your goal in at least 8 characters." }, 400);
              return textStream(
                await streamCompletion(
                  model,
                  forgeMessages({
                    idea,
                    category: body.category ?? "general",
                    model,
                    style: body.style ?? "detailed",
                  }),
                  0.8,
                ),
              );
            }
            case "optimize": {
              const prompt = (body.prompt ?? "").trim();
              if (prompt.length < 10) return json({ error: "Paste a prompt to optimize." }, 400);
              return textStream(
                await streamCompletion(
                  model,
                  optimizeMessages({ prompt, modes: body.modes ?? [], model }),
                  0.5,
                ),
              );
            }
            case "run": {
              const prompt = (body.prompt ?? "").trim();
              if (!prompt) return json({ error: "Nothing to run — the prompt is empty." }, 400);
              return textStream(
                await streamCompletion(
                  model,
                  [
                    {
                      role: "system",
                      content: body.system?.trim() || "You are a helpful, precise assistant.",
                    },
                    { role: "user", content: prompt },
                  ],
                  body.temperature ?? 0.7,
                  body.maxTokens ?? 1024,
                ),
              );
            }
            case "compare": {
              const prompt = (body.prompt ?? "").trim();
              if (!prompt) return json({ error: "Nothing to compare — the prompt is empty." }, 400);
              const keys = (body.models?.length ? body.models : ["gpt", "gemini", "claude"]).filter(
                (k): k is ModelKey => !!PROVIDERS[k as ModelKey],
              );
              const results = await Promise.all(
                keys.map(async (key) => {
                  const started = Date.now();
                  try {
                    const text = await completeText(
                      key,
                      [
                        {
                          role: "system",
                          content: body.system?.trim() || "You are a helpful, precise assistant.",
                        },
                        { role: "user", content: prompt },
                      ],
                      body.temperature ?? 0.7,
                    );
                    const latency = Date.now() - started;
                    const tokens = Math.round(text.length / 4);
                    return {
                      model: key,
                      label: PROVIDERS[key].label,
                      response: text,
                      latency,
                      tokens,
                      cost: +((tokens / 1000) * PROVIDERS[key].costPer1k).toFixed(5),
                      score: Math.min(
                        99,
                        70 +
                          Math.round(Math.min(text.length, 3000) / 120) +
                          (text.includes("\n") ? 4 : 0),
                      ),
                      error: null as string | null,
                    };
                  } catch (e) {
                    return {
                      model: key,
                      label: PROVIDERS[key].label,
                      response: "",
                      latency: Date.now() - started,
                      tokens: 0,
                      cost: 0,
                      score: 0,
                      error: e instanceof Error ? e.message : "Request failed",
                    };
                  }
                }),
              );
              return json({ results, demo: isDemoMode() });
            }
            case "score": {
              const prompt = (body.prompt ?? "").trim();
              if (!prompt) return json({ error: "Nothing to score." }, 400);
              const fallback = heuristicScore(prompt);
              try {
                const raw = await completeText(model, scoreMessages(prompt), 0.1);
                const match = raw.match(/\{[\s\S]*\}/);
                const parsed = match ? JSON.parse(match[0]) : null;
                if (!parsed) throw new Error("unparsable");
                const num = (v: unknown, d: number) =>
                  typeof v === "number" && v >= 0 && v <= 100 ? Math.round(v) : d;
                return json({
                  breakdown: {
                    clarity: num(parsed.clarity, fallback.breakdown.clarity),
                    specificity: num(parsed.specificity, fallback.breakdown.specificity),
                    context: num(parsed.context, fallback.breakdown.context),
                    constraints: num(parsed.constraints, fallback.breakdown.constraints),
                    output: num(parsed.output, fallback.breakdown.output),
                    robustness: num(parsed.robustness, fallback.breakdown.robustness),
                    compatibility: num(parsed.compatibility, fallback.breakdown.compatibility),
                  },
                  suggestions: Array.isArray(parsed.suggestions)
                    ? parsed.suggestions.slice(0, 4).map(String)
                    : fallback.suggestions,
                  demo: isDemoMode(),
                });
              } catch {
                return json({ ...fallback, demo: isDemoMode() });
              }
            }
            default:
              return json({ error: "Unknown action" }, 400);
          }
        } catch (e) {
          if (e instanceof AIError) return json({ error: e.message }, e.status);
          console.error("AI route error", e);
          return json({ error: "We couldn't reach the AI service right now." }, 500);
        }
      },
    },
  },
});
