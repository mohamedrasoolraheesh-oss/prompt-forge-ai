import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, LifeBuoy, Loader2, MessageCircleQuestion, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { listSupportTickets, createSupportTicket } from "@/lib/support.functions";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Support — Rebel Prompt AI" },
      {
        name: "description",
        content: "Get help from Rebel Prompt AI and track your support requests.",
      },
      { property: "og:title", content: "Support — Rebel Prompt AI" },
      {
        property: "og:description",
        content: "Ask a question or submit a support request.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupportPage,
});

const CATEGORIES = [
  { value: "account", label: "Account" },
  { value: "billing", label: "Billing" },
  { value: "prompt", label: "Prompts & AI" },
  { value: "bug", label: "Report a problem" },
  { value: "other", label: "Other" },
];

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "resolved") return "default";
  if (status === "in_progress") return "secondary";
  return "outline";
}

function SupportPage() {
  const queryClient = useQueryClient();
  const getTickets = useServerFn(listSupportTickets);
  const submitTicket = useServerFn(createSupportTicket);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("account");
  const [message, setMessage] = useState("");

  const { data: tickets, isLoading, isError, refetch } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => getTickets(),
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: () => submitTicket({ data: { subject, category, message } }),
    onSuccess: async () => {
      setSubject("");
      setCategory("account");
      setMessage("");
      await queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      toast.success("Your support request has been submitted.");
    },
    onError: (error: Error) => toast.error(error.message || "Could not submit your request."),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (subject.trim().length < 5 || message.trim().length < 20) {
      toast.error("Add a subject and at least 20 characters describing your question.");
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg forge-gradient shadow-glow">
          <LifeBuoy className="size-5 text-primary-foreground" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold">Customer support</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask a question and keep track of your requests.
          </p>
          <Link
            to="/faq"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Browse frequently asked questions <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="space-y-5" aria-labelledby="new-request-title">
          <div>
            <h2 id="new-request-title" className="font-display text-lg font-semibold">
              Send us a message
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Share the details and our team will follow up.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="support-subject">Subject</Label>
              <Input
                id="support-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="What can we help with?"
                minLength={5}
                maxLength={120}
                required
              />
              <p className="text-right text-xs text-muted-foreground">{subject.length}/120</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-category">Topic</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="support-category" aria-label="Topic">
                  <SelectValue placeholder="Choose a topic" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-message">How can we help?</Label>
              <Textarea
                id="support-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Include what happened and what you were trying to do…"
                rows={7}
                minLength={20}
                maxLength={5000}
                className="resize-y"
                required
              />
              <p className="text-right text-xs text-muted-foreground">{message.length}/5000</p>
            </div>

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Send className="size-4" aria-hidden />
              )}
              {mutation.isPending ? "Sending…" : "Submit request"}
            </Button>
          </form>
        </section>

        <section className="space-y-5" aria-labelledby="request-history-title">
          <div>
            <h2 id="request-history-title" className="font-display text-lg font-semibold">
              Your requests
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review the status of your recent questions.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-3" aria-label="Loading support requests">
              <div className="h-24 animate-pulse rounded-md bg-muted" />
              <div className="h-24 animate-pulse rounded-md bg-muted" />
            </div>
          ) : isError ? (
            <div className="space-y-3 border-t border-border py-6">
              <p className="text-sm text-muted-foreground">We couldn’t load your requests.</p>
              <Button variant="outline" onClick={() => void refetch()}>
                Try again
              </Button>
            </div>
          ) : tickets?.length ? (
            <ul className="divide-y divide-border border-y border-border">
              {tickets.map((ticket) => (
                <li key={ticket.id} className="py-5 first:pt-4 last:pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-medium">{ticket.subject}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {CATEGORIES.find((item) => item.value === ticket.category)?.label ??
                          ticket.category}{" "}
                        · {new Date(ticket.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant={statusVariant(ticket.status)} className="capitalize">
                      {ticket.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                    {ticket.message}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={MessageCircleQuestion}
              title="No requests yet"
              description="Your submitted questions and their status will appear here."
            />
          )}
        </section>
      </div>
    </div>
  );
}