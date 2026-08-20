export const CATEGORIES = [
  "general",
  "coding",
  "marketing",
  "research",
  "education",
  "data analysis",
  "business",
  "content creation",
  "image generation",
  "productivity",
] as const;

export const MODELS = [
  { value: "gpt", label: "GPT" },
  { value: "gemini", label: "Gemini" },
  { value: "claude", label: "Claude" },
  { value: "custom", label: "Custom" },
] as const;

export const STYLES = [
  { value: "concise", label: "Concise" },
  { value: "detailed", label: "Detailed" },
  { value: "expert", label: "Expert" },
  { value: "creative", label: "Creative" },
  { value: "structured", label: "Structured" },
  { value: "reasoning", label: "Reasoning-safe" },
] as const;

export const OPTIMIZE_MODES = [
  "Make clearer",
  "Make more precise",
  "Make shorter",
  "Make more detailed",
  "Improve reasoning",
  "Improve consistency",
  "Improve output formatting",
  "Reduce ambiguity",
  "Convert to professional prompt",
] as const;

export const SCORE_LABELS: Record<string, string> = {
  clarity: "Clarity",
  specificity: "Specificity",
  context: "Context",
  constraints: "Constraints",
  output: "Output Definition",
  robustness: "Robustness",
  compatibility: "Model Compatibility",
};

export type Breakdown = {
  clarity: number;
  specificity: number;
  context: number;
  constraints: number;
  output: number;
  robustness: number;
  compatibility: number;
};

export function averageScore(b: Partial<Breakdown> | null | undefined) {
  if (!b) return 0;
  const vals = Object.values(b).filter((v): v is number => typeof v === "number");
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, c) => a + c, 0) / vals.length);
}

export function scoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 68) return "Solid";
  if (score >= 50) return "Needs work";
  return "Weak";
}

export function titleFromPrompt(idea: string, content: string) {
  const source = idea.trim() || content.trim();
  const first = source.split("\n").find((l) => l.trim().length > 3) ?? "Untitled prompt";
  const clean = first.replace(/^(ROLE|OBJECTIVE)\s*/i, "").trim();
  return clean.length > 62 ? `${clean.slice(0, 59)}…` : clean || "Untitled prompt";
}

/** Splits a forged prompt into its canonical sections for structured display. */
export const SECTION_ORDER = [
  "ROLE",
  "CONTEXT",
  "OBJECTIVE",
  "INPUTS",
  "INSTRUCTIONS",
  "CONSTRAINTS",
  "OUTPUT FORMAT",
  "QUALITY CRITERIA",
  "EDGE CASES",
];

export function parseSections(content: string) {
  const lines = content.split("\n");
  const sections: { heading: string; body: string }[] = [];
  let current: { heading: string; body: string[] } | null = null;
  for (const line of lines) {
    const heading = SECTION_ORDER.find((h) => line.trim().toUpperCase() === h);
    if (heading) {
      if (current)
        sections.push({ heading: current.heading, body: current.body.join("\n").trim() });
      current = { heading, body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) sections.push({ heading: current.heading, body: current.body.join("\n").trim() });
  return sections;
}

export function extractVariables(content: string) {
  const found = new Set<string>();
  for (const m of content.matchAll(/\{\{\s*([a-zA-Z0-9_ -]+)\s*\}\}/g)) found.add(m[1]!.trim());
  return [...found];
}

export function applyVariables(content: string, vars: Record<string, string>) {
  return content.replace(/\{\{\s*([a-zA-Z0-9_ -]+)\s*\}\}/g, (full, name: string) => {
    const v = vars[name.trim()];
    return v ? v : full;
  });
}
