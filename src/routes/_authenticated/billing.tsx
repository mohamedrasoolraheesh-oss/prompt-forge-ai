import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, FileText, Gem, IndianRupee, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useProfile } from "@/components/layout/app-shell";
import { myPayments } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "My billing — Rebel Prompt AI" },
      {
        name: "description",
        content: "See your Rebel Prompt AI plan, payment history and invoices.",
      },
      { property: "og:title", content: "My billing — Rebel Prompt AI" },
      {
        property: "og:description",
        content: "See your plan, payment history and invoices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BillingPage,
});

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

type PaymentRow = {
  id: string;
  user_id: string;
  plan: string;
  billing_cycle: string;
  amount_inr: number;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
};

const invoiceNumber = (p: PaymentRow) => `RPF-${p.id.slice(0, 8).toUpperCase()}`;

/** Open a printable invoice for one payment in a new tab. */
function openInvoice(p: PaymentRow, customer: { name: string; email: string }) {
  const w = window.open("", "_blank", "width=760,height=900");
  if (!w) {
    toast.error("Allow pop-ups to view invoices.");
    return;
  }
  const date = new Date(p.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  w.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>Invoice ${invoiceNumber(p)}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;color:#18181b;margin:0;padding:48px;background:#fff}
  .wrap{max-width:640px;margin:0 auto}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #7c3aed;padding-bottom:24px}
  h1{font-size:22px;margin:0}
  .brand{font-size:13px;color:#7c3aed;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
  .meta{text-align:right;font-size:13px;color:#52525b}
  table{width:100%;border-collapse:collapse;margin-top:32px;font-size:14px}
  th{text-align:left;color:#71717a;font-weight:500;font-size:12px;text-transform:uppercase;letter-spacing:.05em;padding:8px 0;border-bottom:1px solid #e4e4e7}
  td{padding:12px 0;border-bottom:1px solid #f4f4f5}
  .total td{font-weight:700;font-size:16px;border-bottom:none}
  .foot{margin-top:40px;font-size:12px;color:#a1a1aa}
  .paid{display:inline-block;background:#dcfce7;color:#166534;font-size:12px;font-weight:600;padding:2px 10px;border-radius:999px}
  @media print{body{padding:0}}
</style></head><body><div class="wrap">
  <div class="top">
    <div><p class="brand">Rebel Prompt AI</p><h1>Invoice ${invoiceNumber(p)}</h1></div>
    <div class="meta">
      <p>${date}</p>
      <p>Status: <span class="paid">${p.status.toUpperCase()}</span></p>
      ${p.razorpay_payment_id ? `<p>Ref: ${p.razorpay_payment_id}</p>` : ""}
    </div>
  </div>
  <p style="margin-top:24px;font-size:14px"><strong>Billed to:</strong><br>${customer.name}<br>${customer.email}</p>
  <table>
    <thead><tr><th>Description</th><th>Cycle</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      <tr><td>Rebel Prompt AI — ${p.plan} plan</td><td style="text-transform:capitalize">${p.billing_cycle}</td><td style="text-align:right">${inr(p.amount_inr)}</td></tr>
      <tr class="total"><td>Total</td><td></td><td style="text-align:right">${inr(p.amount_inr)}</td></tr>
    </tbody>
  </table>
  <p class="foot">Thank you for using Rebel Prompt AI. This is a computer-generated invoice.</p>
</div><script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "paid") return "default";
  if (s === "failed") return "destructive";
  return "secondary";
}

function BillingPage() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const fetchPayments = useServerFn(myPayments);
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["my-payments"],
    queryFn: () => fetchPayments(),
    retry: false,
  });

  const rows = (payments ?? []) as PaymentRow[];
  const paid = rows.filter((p) => p.status === "paid");
  const totalPaid = paid.reduce((sum, p) => sum + p.amount_inr, 0);
  const customer = {
    name: profile?.full_name ?? "you",
    email: profile?.email ?? "",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl forge-gradient shadow-glow">
          <CreditCard className="size-5 text-white" aria-hidden />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">My billing</h1>
          <p className="text-sm text-muted-foreground">
            Your plan, payment history and invoices.
          </p>
        </div>
      </header>

      {/* Current plan */}
      <section className="rounded-xl border border-border bg-surface p-5">
        {profileLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current plan
              </p>
              <p className="mt-1 flex items-center gap-2 font-display text-xl font-bold">
                {profile?.plan ?? "Free"}
                <Badge variant="secondary">active</Badge>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {profile?.email}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/pricing">
                <Gem className="size-4" /> View plans
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* Totals */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <IndianRupee className="size-3.5" /> Total paid
          </p>
          <p className="mt-2 font-display text-2xl font-bold">{inr(totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Receipt className="size-3.5" /> Payments
          </p>
          <p className="mt-2 font-display text-2xl font-bold">{rows.length}</p>
        </div>
      </section>

      {/* Payment history */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Payment history</h2>
        {paymentsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No payments yet"
            description="Upgrades made on the pricing page will appear here with their invoices."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{invoiceNumber(p)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {p.plan} · <span className="capitalize">{p.billing_cycle}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{inr(p.amount_inr)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openInvoice(p, customer)}
                        aria-label={`Open invoice ${invoiceNumber(p)}`}
                      >
                        <FileText className="size-4" /> Invoice
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
