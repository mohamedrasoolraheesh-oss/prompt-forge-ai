import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Search, LifeBuoy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Frequently asked questions — Rebel Prompt AI" },
      {
        name: "description",
        content:
          "Find answers about Rebel Prompt AI accounts, prompt tools, plans, payments and customer support.",
      },
      { property: "og:title", content: "Frequently asked questions — Rebel Prompt AI" },
      {
        property: "og:description",
        content: "Answers about accounts, prompt tools, plans, payments and customer support.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FaqPage,
});

const FAQ_ITEMS = [
  {
    category: "Getting started",
    question: "What is Rebel Prompt AI?",
    answer:
      "It helps you turn an idea into a structured prompt, review its quality, improve it and test it in a playground.",
  },
  {
    category: "Getting started",
    question: "How do I create an account?",
    answer:
      "Choose Start free and sign up with your email and password, or continue with Google. Your account keeps your saved work together when you sign back in.",
  },
  {
    category: "Getting started",
    question: "What are the password requirements?",
    answer:
      "Your password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a symbol. The sign-up form checks each rule as you type.",
  },
  {
    category: "Prompts & tools",
    question: "Do I need my own AI API key?",
    answer:
      "No. Prompt generation, scoring and optimization are available through Rebel Prompt AI; you do not need to provide a separate AI key.",
  },
  {
    category: "Prompts & tools",
    question: "Where can I find prompts I have saved?",
    answer:
      "Open Library after signing in. Saved prompts are associated with your account, so they remain available when you return to that account.",
  },
  {
    category: "Prompts & tools",
    question: "Can I test a prompt before using it?",
    answer:
      "Yes. Open the Playground to run prompts, fill in variables and review the generated response before you use the prompt elsewhere.",
  },
  {
    category: "Plans & billing",
    question: "What does the Starter plan include?",
    answer:
      "Starter includes 25 forged prompts per month, quality scoring, a prompt library and playground runs. See Pricing for the latest plan details.",
  },
  {
    category: "Plans & billing",
    question: "Where can I see my plan and payment history?",
    answer:
      "After signing in, open Billing to review your plan, payment history and available invoices. The Pricing page lists current plan options.",
  },
  {
    category: "Plans & billing",
    question: "What should I do if a payment or upgrade does not appear?",
    answer:
      "Check Billing before trying again. If your payment is confirmed but your plan or payment record is missing, contact support and include the payment reference. Never send your password or full card details.",
  },
  {
    category: "Getting help",
    question: "How do I contact customer support?",
    answer:
      "Sign in and open Support to submit a request and follow its status. Include what you were trying to do and any relevant error message, but do not include passwords or payment-card details.",
  },
];

function FaqPage() {
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredItems = useMemo(
    () =>
      FAQ_ITEMS.filter((item) =>
        `${item.category} ${item.question} ${item.answer}`
          .toLocaleLowerCase()
          .includes(normalizedSearch),
      ),
    [normalizedSearch],
  );
  const categories = [...new Set(filteredItems.map((item) => item.category))];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border glass">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg forge-gradient shadow-glow">
              <Zap className="size-4 text-white" aria-hidden />
            </span>
            <span className="font-display text-[15px] font-bold">Rebel Prompt AI</span>
          </Link>
          <nav className="ml-auto flex items-center gap-2" aria-label="Main">
            <Button asChild variant="ghost" size="sm">
              <Link to="/pricing">Pricing</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="border-b border-border pb-8">
          <p className="text-sm font-medium text-primary">Help center</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            Frequently asked questions
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Find quick answers about your account, prompts, plans and support.
          </p>
          <div className="relative mt-6 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search questions and answers"
              aria-label="Search frequently asked questions"
              className="pl-9"
            />
          </div>
        </div>

        <div className="divide-y divide-border">
          {categories.length ? (
            categories.map((category) => (
              <section key={category} className="py-7" aria-labelledby={`faq-${category}`}>
                <h2 id={`faq-${category}`} className="font-display text-lg font-semibold">
                  {category}
                </h2>
                <div className="mt-2 divide-y divide-border/70">
                  {filteredItems
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <details key={item.question} className="group py-4">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-medium marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <span>{item.question}</span>
                          <span className="shrink-0 text-primary transition-transform group-open:rotate-45" aria-hidden>
                            +
                          </span>
                        </summary>
                        <p className="max-w-3xl pt-3 pr-8 text-sm leading-relaxed text-muted-foreground">
                          {item.answer}
                        </p>
                      </details>
                    ))}
                </div>
              </section>
            ))
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No answers match “{search}”. Try a different search.
            </p>
          )}
        </div>

        <section className="mt-4 flex flex-col items-start gap-4 border-t border-border py-8 sm:flex-row sm:items-center">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <LifeBuoy className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">Still need a hand?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to send a message and track your support request.
            </p>
          </div>
          <Button asChild className="sm:ml-auto">
            <Link to="/support">
              Contact support <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Rebel Prompt AI</Link>
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <span className="ml-auto">© {new Date().getFullYear()} Rebel Prompt AI</span>
        </div>
      </footer>
    </div>
  );
}