import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Sparkles, Square, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreRing, ScoreBar } from "@/components/score-ring";
import { PromptView, CopyButton } from "@/components/prompt-view";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { supabase } from "@/integrations/supabase/client";
import { streamAI, scorePrompt } from "@/lib/ai-client";
import {
  CATEGORIES,
  MODELS,
  STYLES,
  SCORE_LABELS,
  averageScore,
  scoreLabel,
  titleFromPrompt,
  type Breakdown,
} from "@/lib/constants";
import { useHotkey, modKey } from "@/hooks/useHotkey";

export const Route = createFileRoute("/_authenticated/forge")({
  head: () => ({
    meta: [
      { title: "Forge — Rebel Prompt AI" },
      {
        name: "description",
        content:
          "Turn a rough idea into a structured, production-grade AI prompt with live quality scoring.",
      },
      { property: "og:title", content: "Forge — Rebel Prompt AI" },
      { property: "og:description", content: "Turn rough ideas into production-grade AI prompts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Forge,
});

const EXAMPLES = [
  "A prompt that reviews React code for accessibility bugs",
  "A cold outreach email writer for B2B SaaS founders",
  "A research assistant that summarizes papers with citations",
];

function Forge() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [idea, setIdea] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [model, setModel] = useState<string>("gpt");
  const [style, setStyle] = useState<string>("detailed");
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const score = averageScore(breakdown);

  async function forge() {
    if (idea.trim().length < 8) {
      toast.error("Describe your idea in a little more detail");
      return;
    }
    setStreaming(true);
    setError(null);
    setOutput("");
    setBreakdown(null);
    setSuggestions([]);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const { text, demo: isDemo } = await streamAI(
        { action: "forge", idea, category, model, style },
        (full) => setOutput(full),
        controller.signal,
      );
      setDemo(isDemo);
      const result = await scorePrompt(text, model);
      setBreakdown(result.breakdown);
      setSuggestions(result.suggestions);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  async function save() {
    if (!output.trim()) return;
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const title = titleFromPrompt(idea, output);
      const { data, error: dbError } = await supabase
        .from("prompts")
        .insert({
          user_id: auth.user.id,
          title,
          idea,
          content: output,
          category,
          model,
          style,
          quality_score: score,
          score_breakdown: breakdown ?? {},
          suggestions,
        })
        .select("id")
        .single();
      if (dbError) throw dbError;
      await supabase.from("prompt_versions").insert({
        prompt_id: data.id,
        user_id: auth.user.id,
        version: 1,
        content: output,
        note: "Initial forge",
        quality_score: score,
      });
      await supabase.from("activity").insert({
        user_id: auth.user.id,
        kind: "forge",
        message: `Forged "${title}"`,
        prompt_id: data.id,
      });
      await queryClient.invalidateQueries();
      toast.success("Saved to your library");
      void navigate({ to: "/library/$promptId", params: { promptId: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save prompt");
    } finally {
      setSaving(false);
    }
  }

  useHotkey("enter", () => void forge(), { enabled: !streaming });
  useHotkey("s", () => void save(), { enabled: Boolean(output) && !streaming });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-bold tracking-tight">The Forge</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Describe an idea — get a structured, model-ready prompt. Press{" "}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            {modKey()} ↵
          </kbd>{" "}
          to forge.
        </p>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
        <section className="panel h-fit p-5 lg:sticky lg:top-20" aria-label="Prompt input">
          <div className="space-y-1.5">
            <Label htmlFor="idea">Your idea</Label>
            <Textarea
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={7}
              placeholder="e.g. A senior code reviewer that finds security issues in TypeScript pull requests…"
              className="resize-y font-mono text-[13px]"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setIdea(ex)}
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {ex}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Field label="Category">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Model">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Style">
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="mt-5 flex gap-2">
            {streaming ? (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => abortRef.current?.abort()}
              >
                <Square className="size-4" /> Stop
              </Button>
            ) : (
              <Button className="flex-1" onClick={() => void forge()}>
                <Sparkles className="size-4" /> Forge prompt
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => void save()}
              disabled={!output || saving || streaming}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{" "}
              Save
            </Button>
          </div>
        </section>

        <section className="min-w-0 space-y-4" aria-label="Generated prompt">
          {error && <ErrorState message={error} onRetry={() => void forge()} />}

          {!error && !output && !streaming && (
            <EmptyState
              icon={Wand2}
              title="Your forged prompt appears here"
              description="Describe an idea on the left and we'll structure it into role, context, instructions, constraints and output format."
            />
          )}

          {(output || streaming) && !error && (
            <>
              <div className="panel p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-semibold">Forged prompt</h2>
                    {streaming && (
                      <Badge variant="secondary" className="gap-1">
                        <Loader2 className="size-3 animate-spin" /> streaming
                      </Badge>
                    )}
                    {demo && !streaming && <Badge variant="outline">demo mode</Badge>}
                  </div>
                  {!streaming && output && <CopyButton text={output} />}
                </div>
                <PromptView content={output} streaming={streaming} />
              </div>

              {breakdown && (
                <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                  <div className="panel flex flex-col items-center justify-center p-5">
                    <ScoreRing score={score} size={120} stroke={9} />
                    <p className="mt-3 text-sm font-medium">{scoreLabel(score)}</p>
                    <p className="text-xs text-muted-foreground">Quality score</p>
                  </div>
                  <div className="panel p-5">
                    <h3 className="font-display text-base font-semibold">Breakdown</h3>
                    <div className="mt-3 space-y-2.5">
                      {Object.entries(breakdown).map(([k, v]) => (
                        <ScoreBar key={k} name={SCORE_LABELS[k] ?? k} value={v} />
                      ))}
                    </div>
                    {suggestions.length > 0 && (
                      <>
                        <h3 className="mt-5 font-display text-base font-semibold">Suggestions</h3>
                        <ul className="mt-2 space-y-1.5">
                          {suggestions.map((s) => (
                            <li key={s} className="flex gap-2 text-sm text-muted-foreground">
                              <span
                                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                                aria-hidden
                              />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
