import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Check,
  FlaskConical,
  Gauge,
  History,
  LayoutTemplate,
  LibraryBig,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/score-ring";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rebel Prompt AI — Engineer prompts that actually work" },
      {
        name: "description",
        content:
          "Rebel Prompt AI turns rough ideas into structured, production-grade prompts with quality scoring, optimization, versioning and a live testing playground.",
      },
      { property: "og:title", content: "Rebel Prompt AI — Engineer prompts that actually work" },
      {
        property: "og:description",
        content: "Generate, score, optimize and test AI prompts in one premium workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const SAMPLE = `ROLE
You are a principal frontend engineer who reviews React pull requests for accessibility defects.

OBJECTIVE
Identify WCAG 2.2 AA violations and propose minimal, idiomatic fixes.

CONSTRAINTS
- Never rewrite unrelated logic
- Cite the specific success criterion for each issue

OUTPUT FORMAT
A markdown table: severity | file:line | issue | fix`;

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Prompt Rebel",
    body: "Describe an idea; get a role-, context- and constraint-complete prompt in seconds.",
  },
  {
    icon: Gauge,
    title: "Quality scoring",
    body: "Every prompt is graded on clarity, specificity, constraints, output definition and robustness.",
  },
  {
    icon: Wand2,
    title: "One-click optimize",
    body: "Nine targeted rewrite modes with a before/after score delta you can actually trust.",
  },
  {
    icon: FlaskConical,
    title: "Live playground",
    body: "Run prompts with {{variables}}, temperature and token controls. Stream the response.",
  },
  {
    icon: LibraryBig,
    title: "Library & versions",
    body: "Save, tag, favorite and roll back — every edit is a recoverable version.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    body: "Quality trends, category mix, model usage and run latency at a glance.",
  },
  {
    icon: LayoutTemplate,
    title: "Template gallery",
    body: "Curated, high-scoring starting points for coding, marketing, research and more.",
  },
  {
    icon: History,
    title: "Full run history",
    body: "Every execution recorded with model, latency, tokens and the full response.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Describe the idea",
    body: "One sentence is enough. Pick a category, model and writing style.",
  },
  {
    n: "02",
    title: "Forge and score",
    body: "Watch the structured prompt stream in, then read its quality breakdown.",
  },
  {
    n: "03",
    title: "Test and ship",
    body: "Run it in the playground, optimize weak spots, save the winning version.",
  },
];

function Landing() {
  const { session, loading } = useAuth();
  const signedIn = !loading && !!session;
  const [score, setScore] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setScore(94), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border glass">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg forge-gradient shadow-glow">
              <Zap className="size-4 text-white" aria-hidden />
            </span>
            <span className="font-display text-[15px] font-bold tracking-tight">
              Rebel Prompt AI
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-2">
            {signedIn ? (
              <Button asChild size="sm">
                <Link to="/dashboard">
                  Open dashboard <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/signup">
                    Start free <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" aria-hidden />
          <div
            className="pointer-events-none absolute -top-52 left-1/2 size-[720px] -translate-x-1/2 rounded-full bg-primary/20 blur-[150px] animate-aurora"
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            <div className="animate-rise">
              <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/10">
                <Sparkles className="size-3" /> Prompt engineering, industrialized
              </Badge>
              <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Engineer prompts <br className="hidden sm:block" />
                that <span className="text-gradient">actually work</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Rebel Prompt AI turns a rough idea into a structured, model-ready prompt — then
                scores it, optimizes it, versions it and lets you test it live. No more guesswork.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to={signedIn ? "/dashboard" : "/signup"}>
                    {signedIn ? "Open your dashboard" : "Start forging free"}{" "}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to={signedIn ? "/forge" : "/login"}>
                    {signedIn ? "Go to the Forge" : "See it in action"}
                  </Link>
                </Button>
              </div>
              <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["No credit card", "Streaming generation", "Version history"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="size-4 text-success" aria-hidden /> {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative animate-rise [animation-delay:120ms]">
              <div className="panel overflow-hidden p-0 shadow-glow">
                <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
                  <span className="size-2.5 rounded-full bg-destructive/70" />
                  <span className="size-2.5 rounded-full bg-warning/70" />
                  <span className="size-2.5 rounded-full bg-success/70" />
                  <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                    forge / react-a11y-reviewer
                  </span>
                  <span className="ml-auto">
                    <ScoreRing score={score} size={38} stroke={4} label={false} />
                  </span>
                </div>
                <pre className="max-h-[380px] overflow-auto whitespace-pre-wrap px-5 py-4 font-mono text-[12.5px] leading-relaxed text-muted-foreground">
                  {SAMPLE}
                </pre>
              </div>
              <div
                className="pointer-events-none absolute -bottom-10 -right-6 hidden size-40 rounded-full bg-accent-cyan/20 blur-3xl lg:block"
                aria-hidden
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border px-4 py-20 sm:px-6" id="features">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything a prompt needs<span className="text-primary">.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              A complete workspace: generation, evaluation, iteration and testing — instead of a
              scratchpad full of half-remembered prompts.
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <article
                  key={title}
                  className="panel group p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps to a better prompt
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="panel relative p-6">
                  <span className="font-mono text-sm text-primary">{s.n}</span>
                  <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border px-4 py-20 sm:px-6">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-primary/25 p-10 text-center">
            <div
              className="pointer-events-none absolute inset-0 forge-gradient opacity-[0.14]"
              aria-hidden
            />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Stop guessing. Start forging.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Create your workspace and forge your first production-grade prompt in under a
                minute.
              </p>
              <Button asChild size="lg" className="mt-7">
                <Link to={signedIn ? "/dashboard" : "/signup"}>
                  {signedIn ? "Open your dashboard" : "Get started free"}{" "}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Zap className="size-4 text-primary" aria-hidden /> Rebel Prompt AI
          </span>
          <span className="ml-auto">© {new Date().getFullYear()} Rebel Prompt AI</span>
        </div>
      </footer>
    </div>
  );
}
