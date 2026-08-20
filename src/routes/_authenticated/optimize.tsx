import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, Save, Square, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PromptView, CopyButton } from "@/components/prompt-view";
import { ScoreRing } from "@/components/score-ring";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { streamAI, scorePrompt } from "@/lib/ai-client";
import { OPTIMIZE_MODES, averageScore, titleFromPrompt } from "@/lib/constants";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ promptId: z.string().optional() });

export const Route = createFileRoute("/_authenticated/optimize")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Optimize — Prompt Forge AI" },
      {
        name: "description",
        content:
          "Rewrite and improve any prompt with targeted optimization modes and before/after quality scoring.",
      },
      { property: "og:title", content: "Optimize — Prompt Forge AI" },
      {
        property: "og:description",
        content: "Improve any prompt with before/after quality scoring.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Optimize,
});

function Optimize() {
  const { promptId } = Route.useSearch();
  const queryClient = useQueryClient();
  const [original, setOriginal] = useState("");
  const [modes, setModes] = useState<string[]>(["Make clearer"]);
  const [improved, setImproved] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beforeScore, setBeforeScore] = useState<number | null>(null);
  const [afterScore, setAfterScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!promptId) return;
    void supabase
      .from("prompts")
      .select("content, quality_score")
      .eq("id", promptId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setOriginal(data.content);
          setBeforeScore(data.quality_score);
        }
      });
  }, [promptId]);

  function toggleMode(mode: string) {
    setModes((prev) => (prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]));
  }

  async function optimize() {
    if (original.trim().length < 12) {
      toast.error("Paste a prompt to optimize first");
      return;
    }
    if (!modes.length) {
      toast.error("Pick at least one optimization mode");
      return;
    }
    setStreaming(true);
    setError(null);
    setImproved("");
    setAfterScore(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      if (beforeScore === null) {
        const before = await scorePrompt(original, "gpt");
        setBeforeScore(averageScore(before.breakdown));
      }
      const { text } = await streamAI(
        { action: "optimize", prompt: original, modes },
        (full) => setImproved(full),
        controller.signal,
      );
      const after = await scorePrompt(text, "gpt");
      setAfterScore(averageScore(after.breakdown));
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Optimization failed");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  async function saveAsNew() {
    if (!improved.trim()) return;
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      const title = `${titleFromPrompt("", improved)} (optimized)`;
      const { data, error: dbError } = await supabase
        .from("prompts")
        .insert({
          user_id: auth.user.id,
          title,
          idea: original.slice(0, 400),
          content: improved,
          category: "general",
          quality_score: afterScore ?? 0,
        })
        .select("id")
        .single();
      if (dbError) throw dbError;
      await supabase.from("activity").insert({
        user_id: auth.user.id,
        kind: "optimize",
        message: `Optimized "${title}"`,
        prompt_id: data.id,
      });
      await queryClient.invalidateQueries();
      toast.success("Saved optimized prompt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  const delta = afterScore !== null && beforeScore !== null ? afterScore - beforeScore : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="animate-rise">
        <h1 className="font-display text-3xl font-bold tracking-tight">Optimize</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Paste an existing prompt, choose what to improve, and compare before and after.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {OPTIMIZE_MODES.map((mode) => {
          const active = modes.includes(mode);
          return (
            <button
              key={mode}
              onClick={() => toggleMode(mode)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                active
                  ? "border-primary/50 bg-primary/15 text-foreground"
                  : "border-border bg-surface text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {mode}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="panel p-5" aria-label="Original prompt">
          <div className="mb-3 flex items-center justify-between">
            <Label htmlFor="original" className="font-display text-base font-semibold">
              Before
            </Label>
            {beforeScore !== null && <ScoreRing score={beforeScore} size={44} stroke={4} />}
          </div>
          <Textarea
            id="original"
            value={original}
            onChange={(e) => {
              setOriginal(e.target.value);
              setBeforeScore(null);
            }}
            rows={18}
            placeholder="Paste your existing prompt here…"
            className="resize-y font-mono text-[13px]"
          />
          <div className="mt-4 flex gap-2">
            {streaming ? (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => abortRef.current?.abort()}
              >
                <Square className="size-4" /> Stop
              </Button>
            ) : (
              <Button className="flex-1" onClick={() => void optimize()}>
                <Wand2 className="size-4" /> Optimize <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </section>

        <section className="min-w-0 space-y-4" aria-label="Optimized prompt">
          {error && <ErrorState message={error} onRetry={() => void optimize()} />}
          {!error && !improved && !streaming && (
            <EmptyState
              icon={Wand2}
              title="Optimized version appears here"
              description="Choose one or more improvement modes, then run the optimizer to see a side-by-side rewrite."
            />
          )}
          {(improved || streaming) && !error && (
            <div className="panel p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-base font-semibold">After</h2>
                  {streaming && (
                    <Badge variant="secondary" className="gap-1">
                      <Loader2 className="size-3 animate-spin" /> streaming
                    </Badge>
                  )}
                  {delta !== null && (
                    <Badge variant={delta >= 0 ? "default" : "destructive"}>
                      {delta >= 0 ? "+" : ""}
                      {delta} pts
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {afterScore !== null && <ScoreRing score={afterScore} size={44} stroke={4} />}
                  {!streaming && improved && <CopyButton text={improved} />}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void saveAsNew()}
                    disabled={saving || streaming}
                  >
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}{" "}
                    Save
                  </Button>
                </div>
              </div>
              <PromptView content={improved} streaming={streaming} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
