import { createServerFn } from "@tanstack/react-start";
import { createHmac, timingSafeEqual } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Plans that can be bought, priced in Indian rupees. */
export const PLANS = {
  pro: { name: "Pro", monthly: 1499, yearly: 14390 },
  team: { name: "Team", monthly: 3999, yearly: 38390 },
} as const;

export type PlanId = keyof typeof PLANS;

function keys() {
  return {
    keyId: process.env["RAZORPAY_KEY_ID"] ?? "",
    keySecret: process.env["RAZORPAY_KEY_SECRET"] ?? "",
  };
}

/** Tells the client whether live checkout is available. */
export const paymentsStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { keyId, keySecret } = keys();
  return { configured: Boolean(keyId && keySecret), keyId };
});

/** Creates a Razorpay order and records it against the signed-in user. */
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { plan: PlanId; cycle: "monthly" | "yearly" }) => {
    if (!(input.plan in PLANS)) throw new Error("Unknown plan");
    if (input.cycle !== "monthly" && input.cycle !== "yearly") throw new Error("Unknown cycle");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { keyId, keySecret } = keys();
    if (!keyId || !keySecret) throw new Error("Payments are not connected yet.");

    const plan = PLANS[data.plan];
    const amountInr = data.cycle === "yearly" ? plan.yearly : plan.monthly;

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: amountInr * 100,
        currency: "INR",
        receipt: `rpa_${Date.now()}`,
        notes: { plan: plan.name, cycle: data.cycle, user_id: context.userId },
      }),
    });
    const order = (await res.json()) as { id?: string; error?: { description?: string } };
    if (!res.ok || !order.id) {
      throw new Error(order.error?.description ?? "Could not start checkout.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      plan: plan.name,
      billing_cycle: data.cycle,
      amount_inr: amountInr,
      status: "created",
      razorpay_order_id: order.id,
    });

    return { orderId: order.id, amountInr, keyId, planName: plan.name };
  });

/** Verifies the Razorpay signature and activates the plan. */
export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { orderId: string; paymentId: string; signature: string }) => input,
  )
  .handler(async ({ data, context }) => {
    const { keySecret } = keys();
    if (!keySecret) throw new Error("Payments are not connected yet.");

    const expected = createHmac("sha256", keySecret)
      .update(`${data.orderId}|${data.paymentId}`)
      .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(data.signature);
    const valid = a.length === b.length && timingSafeEqual(a, b);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!valid) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("razorpay_order_id", data.orderId)
        .eq("user_id", context.userId);
      throw new Error("Payment could not be verified.");
    }

    const { data: row } = await supabaseAdmin
      .from("payments")
      .update({
        status: "paid",
        razorpay_payment_id: data.paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", data.orderId)
      .eq("user_id", context.userId)
      .select("plan")
      .maybeSingle();

    if (row?.plan) {
      await supabaseAdmin.from("profiles").update({ plan: row.plan }).eq("id", context.userId);
    }
    return { ok: true, plan: row?.plan ?? null };
  });

/** The signed-in user's own payment history. */
export const myPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });
    return data ?? [];
  });
