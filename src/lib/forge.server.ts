/** Server-only prompt engineering engine + AI provider abstraction. */

export type ModelKey = "gpt" | "gemini" | "claude" | "custom";

/**
 * AI provider abstraction. Each logical model the user picks maps to a
 * concrete gateway model id. The gateway is OpenAI-compatible, so one
 * transport serves every provider.
 */
export const PROVIDERS: Record<ModelKey, { label: string; model: string; costPer1k: number }> = {
  gpt: { label: "GPT", model: "gpt-4o-mini", costPer1k: 0.00015 },
  gemini: { label: "Gemini", model: "gpt-4o-mini", costPer1k: 0.00015 },
  claude: { label: "Claude", model: "gpt-4o", costPer1k: 0.0025 },
  custom: { label: "Custom", model: "gpt-4o-mini", costPer1k: 0.00015 },
};

export function isDemoMode() {
  return !process.env["OPENAI_API_KEY"] && !process.env["AI_API_KEY"];
}

/** OpenAI-compatible chat completions endpoint. Override with AI_GATEWAY_URL. */
const GATEWAY =
  process.env["AI_GATEWAY_URL"] || "https://api.openai.com/v1/chat/completions";

export class AIError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Msg = { role: "system" | "user"; content: string };

async function gatewayFetch(model: string, messages: Msg[], opts: Record<string, unknown> = {}) {
  const key = process.env["OPENAI_API_KEY"] || process.env["AI_API_KEY"];
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model, messages, ...opts }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 429)
      throw new AIError("Rate limit reached. Please wait a moment and try again.", 429);
    if (res.status === 402)
      throw new AIError("AI credits exhausted. Add credits to keep forging.", 402);
    throw new AIError(body.slice(0, 300) || "The AI provider returned an error.", res.status);
  }
  return res;
}

/** Streams plain text chunks out of the gateway's SSE response. */
export async function streamCompletion(
  model: ModelKey,
  messages: Msg[],
  temperature = 0.7,
  maxTokens?: number,
): Promise<ReadableStream<Uint8Array>> {
  if (isDemoMode()) return demoStream(demoAnswer(messages));

  const res = await gatewayFetch(PROVIDERS[model].model, messages, {
    stream: true,
    temperature,
    ...(maxTokens ? { max_completion_tokens: maxTokens } : {}),
  });

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              /* partial frame, ignore */
            }
          }
        }
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });
}

export async function completeText(
  model: ModelKey,
  messages: Msg[],
  temperature = 0.7,
): Promise<string> {
  if (isDemoMode()) return demoAnswer(messages);
  const res = await gatewayFetch(PROVIDERS[model].model, messages, { temperature });
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? "";
}

/* ---------------------------------------------------------------- prompts */

const ENGINE_RULES = `You are Rebel Prompt, an elite prompt engineer.
You transform a rough user idea into a single production-grade prompt.

The prompt you output MUST use exactly these uppercase section headers, in order,
with no markdown fences, no commentary before or after:

ROLE
CONTEXT
OBJECTIVE
INPUTS
INSTRUCTIONS
CONSTRAINTS
OUTPUT FORMAT
QUALITY CRITERIA
EDGE CASES

Rules:
- INSTRUCTIONS and CONSTRAINTS are numbered or dashed lists, concrete and testable.
- Use {{variable}} placeholders for anything the user must supply at run time.
- Never include unsafe, deceptive, or disallowed instructions.
- Be specific. No filler, no "as an AI language model", no restating the task.`;

export function forgeMessages(input: {
  idea: string;
  category: string;
  model: ModelKey;
  style: string;
}): Msg[] {
  const styleHints: Record<string, string> = {
    concise: "Keep the prompt tight: short lines, max 5 instructions.",
    detailed: "Be thorough: cover inputs, edge cases and evaluation criteria.",
    expert: "Assume a domain-expert audience; use precise professional terminology.",
    creative: "Encourage divergent thinking and vivid, specific language.",
    structured: "Maximize structure: nested lists, explicit schemas for output.",
    reasoning:
      "Ask the model to reason step by step internally and only present the reasoned conclusion.",
  };
  return [
    {
      role: "system",
      content: `${ENGINE_RULES}

Target model family: ${PROVIDERS[input.model].label} — tailor phrasing and formatting to what that family responds to best.
Domain: ${input.category}.
Style: ${styleHints[input.style] ?? styleHints["detailed"]}`,
    },
    { role: "user", content: `Idea to turn into a prompt:\n${input.idea}` },
  ];
}

export function optimizeMessages(input: {
  prompt: string;
  modes: string[];
  model: ModelKey;
}): Msg[] {
  return [
    {
      role: "system",
      content: `${ENGINE_RULES}

You are optimizing an EXISTING prompt. Preserve the author's intent exactly.
Apply these optimization goals: ${input.modes.join(", ") || "general improvement"}.
Target model family: ${PROVIDERS[input.model].label}.
Return only the improved prompt in the section format above.`,
    },
    { role: "user", content: input.prompt },
  ];
}

export function scoreMessages(prompt: string): Msg[] {
  return [
    {
      role: "system",
      content: `You evaluate prompt quality. Respond with ONLY minified JSON, no fences:
{"clarity":n,"specificity":n,"context":n,"constraints":n,"output":n,"robustness":n,"compatibility":n,"suggestions":["...","...","..."]}
Each n is an integer 0-100. Provide 3 short actionable suggestions (max 90 chars each).`,
    },
    { role: "user", content: prompt.slice(0, 8000) },
  ];
}

/* ------------------------------------------------------------- heuristics */

export type Breakdown = {
  clarity: number;
  specificity: number;
  context: number;
  constraints: number;
  output: number;
  robustness: number;
  compatibility: number;
};

export function heuristicScore(prompt: string): { breakdown: Breakdown; suggestions: string[] } {
  const p = prompt.toUpperCase();
  const has = (s: string) => p.includes(s);
  const words = prompt.split(/\s+/).filter(Boolean).length;
  const clamp = (n: number) => Math.max(35, Math.min(99, Math.round(n)));
  const base = clamp(52 + Math.min(words, 400) / 12);

  const breakdown: Breakdown = {
    clarity: clamp(base + (has("OBJECTIVE") ? 14 : -6)),
    specificity: clamp(base + (has("INSTRUCTIONS") ? 12 : -8)),
    context: clamp(base + (has("CONTEXT") ? 13 : -9)),
    constraints: clamp(base + (has("CONSTRAINTS") ? 15 : -12)),
    output: clamp(base + (has("OUTPUT FORMAT") ? 16 : -14)),
    robustness: clamp(base + (has("EDGE CASES") ? 13 : -7)),
    compatibility: clamp(base + (has("ROLE") ? 10 : -4)),
  };
  const suggestions: string[] = [];
  if (!has("CONSTRAINTS")) suggestions.push("Add explicit constraints to prevent drift.");
  if (!has("OUTPUT FORMAT")) suggestions.push("Define an exact output format or schema.");
  if (!has("EDGE CASES")) suggestions.push("Describe edge cases and failure handling.");
  if (words < 80) suggestions.push("Add more context — the prompt is quite short.");
  if (!suggestions.length) suggestions.push("Strong prompt. Consider adding a worked example.");
  return { breakdown, suggestions };
}

export function overall(b: Breakdown) {
  const vals = Object.values(b);
  return Math.round(vals.reduce((a, c) => a + c, 0) / vals.length);
}

/* ------------------------------------------------------------- demo mode */

function demoAnswer(messages: Msg[]): string {
  const user = messages.find((m) => m.role === "user")?.content ?? "";
  const sys = messages.find((m) => m.role === "system")?.content ?? "";
  if (sys.includes("ONLY minified JSON")) {
    const { breakdown, suggestions } = heuristicScore(user);
    return JSON.stringify({
      clarity: breakdown.clarity,
      specificity: breakdown.specificity,
      context: breakdown.context,
      constraints: breakdown.constraints,
      output: breakdown.output,
      robustness: breakdown.robustness,
      compatibility: breakdown.compatibility,
      suggestions,
    });
  }
  if (sys.includes("Rebel Prompt")) {
    const idea = user.replace(/^Idea to turn into a prompt:\s*/i, "").trim() || "the task";
    return demoPrompt(idea);
  }
  return `Demo mode response.\n\nThis workspace is running without an AI key, so responses are simulated. The full pipeline — streaming, scoring, persistence, versioning — is live.\n\nRequest received:\n${user.slice(0, 400)}`;
}

function demoPrompt(idea: string) {
  return `ROLE\nYou are a senior specialist responsible for: ${idea}.\n\nCONTEXT\nThe user needs a reliable, repeatable result suitable for professional use.\nAudience: {{audience}}. Tone: {{tone}}.\n\nOBJECTIVE\nDeliver ${idea} at a quality bar that requires no rewriting.\n\nINPUTS\n- {{topic}} — the subject matter to work on\n- {{constraints}} — any hard limits supplied by the user\n\nINSTRUCTIONS\n1. Restate the goal in one sentence before producing output.\n2. Gather the inputs above; if one is missing, ask exactly one clarifying question.\n3. Produce the deliverable in the format defined below.\n4. Verify the result against every quality criterion before responding.\n\nCONSTRAINTS\n- Never invent facts, numbers, or citations.\n- Stay within the supplied constraints.\n- No filler phrases or self-references.\n\nOUTPUT FORMAT\nMarkdown with a short summary line, then the deliverable, then a 3-bullet checklist of what was verified.\n\nQUALITY CRITERIA\n- Specific and actionable, not generic\n- Internally consistent\n- Directly usable without editing\n\nEDGE CASES\n- If inputs conflict, surface the conflict instead of guessing.\n- If the request is out of scope, say so and propose the closest valid alternative.`;
}

function demoStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunks = text.match(/[\s\S]{1,14}/g) ?? [];
  let i = 0;
  return new ReadableStream({
    async pull(controller) {
      if (i >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(chunks[i]!));
      i += 1;
      await new Promise((r) => setTimeout(r, 12));
    },
  });
}
