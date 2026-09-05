import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Loader2, Minus, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Rebel Prompt AI" },
      {
        name: "description",
        content:
          "Simple pricing for Rebel Prompt AI: a free Starter plan, Pro for daily prompt engineering, and Team for shared libraries and analytics.",
      },
      { property: "og:title", content: "Pricing — Rebel Prompt AI" },
      {
        property: "og:description",
        content: "Free to start. Upgrade for unlimited prompts, optimization and analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

type Tier = {
  id: "starter" | "pro" | "team";
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  cta: string;
  featured?: boolean;
  features: string[];
};

const TIERS: Tier[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For trying prompt engineering properly.",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    features: [
      "25 forged prompts per month",
      "Quality scoring on every prompt",
      "Prompt library with tags & favorites",
      "Playground runs with variables",
      "7 days of run history",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For people who ship prompts every day.",
    monthly: 19,
    yearly: 15,
    cta: "Upgrade to Pro",
    featured: true,
    features: [
      "Unlimited forged prompts",
      "All 9 optimization modes",
      "Model comparison side by side",
      "Full version history & rollback",
      "Analytics: quality, cost & latency",
      "Unlimited run history",
      "Priority AI queue",
    ],
  },
  {
    id: "team",
    name: "Team",
    tagline: "For teams standardizing on one prompt library.",
    monthly: 49,
    yearly: 39,
    cta: "Upgrade to Team",
    features: [
      "Everything in Pro, per seat",
      "Shared team library & folders",
      "Template collections for your org",
      "Team analytics dashboard",
      "Role-based access controls",
      "Priority support",
    ],
  },
];

const COMPARISON: { label: string; starter: string | boolean; pro: string | boolean; team: string | boolean }[] = [
  { label: "Prompts per month", starter: "25", pro: "Unlimited", team: "Unlimited" },
  { label: "Quality scoring", starter: true, pro: true, team: true },
  { label: "Optimization modes", starter: "2", pro: "All 9", team: "All 9" },
  { label: "Model comparison", starter: false, pro: true, team: true },
  { label: "Version history", starter: "Last 3", pro: "Unlimited", team: "Unlimited" },
  { label: "Analytics", starter: false, pro: true, team: true },
  { label: "Shared team library", starter: false, pro: false, team: true },
  { label: "Support", starter: "Community", pro: "Email", team: "Priority" },
];

const FAQ = [
  {
    q: "Can I change plan later?",
    a: "Yes. Upgrade or downgrade at any time — your prompts, versions and history stay exactly where they are.",
  },
  {
    q: "What happens when I hit the Starter limit?",
    a: "Forging pauses for the rest of the month. Everything already saved stays readable and runnable.",
  },
  {
    q: "Do I need my own AI key?",
    a: "No. Generation, scoring and optimization all run through Rebel Prompt AI's own model access.",
  },
  {
    q: "Is there a refund policy?",
    a: "Cancel whenever you like and you keep access until the end of the paid period.",
  },
];

function PricingPage() {
  const { session, loading } = useAuth();
  const signedIn = !loading && !!session;
  const navigate = useNavigate();
  const [yearly, setYearly] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  async function onCheckout(tier: Tier) {
    if (tier.id === "starter") {
      void navigate({ to: signedIn ? "/dashboard" : "/signup" });
      return;
    }
    if (!signedIn) {
      toast.info("Create your account first — then pick a plan.");
      void navigate({ to: "/signup" });
      return;
    }
    setPending(tier.id);
    try {
      await new Promise((r) => setTimeout(r, 500));
      toast.info(
        `Checkout for ${tier.name} isn't connected to a payment provider yet — connect one to take live payments.`,
      );
    } finally {
      setPending(null);
    }
  }

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

      <main className="relative overflow-hidden px-4 pb-24 pt-16 sm:px-6">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" aria-hidden />
        <div
          className="pointer-events-none absolute -top-52 left-1/2 size-[720px] -translate-x-1/2 rounded-full bg-primary/20 blur-[150px] animate-aurora"
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center animate-rise">
            <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/10">
              <Sparkles className="size-3" /> Pricing
            </Badge>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Pay for the prompts that <span className="text-gradient">earn their keep</span>
            </h1>
            <p className="mt-4 text-muted-foreground">
              Start free. Upgrade when prompt quality becomes part of how you work.
            </p>

            <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setYearly(false)}
                aria-pressed={!yearly}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  !yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                aria-pressed={yearly}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Yearly <span className="text-xs opacity-80">−20%</span>
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {TIERS.map((tier) => {
              const price = yearly ? tier.yearly : tier.monthly;
              return (
                <article
                  key={tier.id}
                  className={`panel relative flex flex-col p-6 ${
                    tier.featured ? "border-primary/50 shadow-glow" : ""
                  }`}
                >
                  {tier.featured && (
                    <Badge className="absolute -top-3 left-6">Most popular</Badge>
                  )}
                  <h2 className="font-display text-lg font-bold tracking-tight">{tier.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{tier.tagline}</p>
                  <p className="mt-5 flex items-end gap-1">
                    <span className="font-display text-4xl font-bold tracking-tight">
                      ${price}
                    </span>
                    <span className="pb-1 text-sm text-muted-foreground">
                      {price === 0 ? "forever" : "/ month"}
                    </span>
                  </p>
                  {price > 0 && yearly && (
                    <p className="mt-1 text-xs text-muted-foreground">billed yearly</p>
                  )}
                  <Button
                    className="mt-6 w-full"
                    variant={tier.featured ? "default" : "outline"}
                    onClick={() => void onCheckout(tier)}
                    disabled={pending === tier.id}
                  >
                    {pending === tier.id && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    {tier.cta}
                  </Button>
                  <ul className="mt-6 space-y-2.5 text-sm">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-muted-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>

          {/* Comparison */}
          <section className="mt-20">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Compare plans<span className="text-primary">.</span>
            </h2>
            <div className="mt-6 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left">
                    <th className="px-4 py-3 font-medium">Feature</th>
                    <th className="px-4 py-3 font-medium">Starter</th>
                    <th className="px-4 py-3 font-medium">Pro</th>
                    <th className="px-4 py-3 font-medium">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.label} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 text-foreground">{row.label}</td>
                      {([row.starter, row.pro, row.team] as (string | boolean)[]).map((v, i) => (
                        <td key={i} className="px-4 py-3 text-muted-foreground">
                          {v === true ? (
                            <Check className="size-4 text-success" aria-label="Included" />
                          ) : v === false ? (
                            <Minus className="size-4 opacity-50" aria-label="Not included" />
                          ) : (
                            v
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-20">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Questions<span className="text-primary">.</span>
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {FAQ.map((item) => (
                <article key={item.q} className="panel p-5">
                  <h3 className="text-sm font-semibold text-foreground">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="panel mt-16 flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight">
                Ready to forge better prompts?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Free to start — no card needed.
              </p>
            </div>
            <Button asChild size="lg" className="sm:ml-auto">
              <Link to={signedIn ? "/forge" : "/signup"}>
                {signedIn ? "Go to the Forge" : "Start free"} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
