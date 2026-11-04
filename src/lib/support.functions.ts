import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SUPPORT_CATEGORIES = ["account", "billing", "prompt", "bug", "other"] as const;

function validateTicketInput(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new Error("Enter a subject, category, and message.");
  }

  const values = input as Record<string, unknown>;
  const subject = typeof values.subject === "string" ? values.subject.trim() : "";
  const message = typeof values.message === "string" ? values.message.trim() : "";
  const category = values.category;

  if (subject.length < 5 || subject.length > 120) {
    throw new Error("Subject must be between 5 and 120 characters.");
  }
  if (typeof category !== "string" || !SUPPORT_CATEGORIES.includes(category as SupportCategory)) {
    throw new Error("Choose a valid support topic.");
  }
  if (message.length < 20 || message.length > 5000) {
    throw new Error("Message must be between 20 and 5,000 characters.");
  }

  return { subject, category: category as SupportCategory, message };
}

type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

/** Loads the signed-in user's own support requests. */
export const listSupportTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("support_tickets")
      .select("id, subject, category, message, status, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw new Error("Could not load your support requests.");
    return data;
  });

/** Creates a request for the authenticated user; ownership is never accepted from the client. */
export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateTicketInput)
  .handler(async ({ data, context }) => {
    const { data: ticket, error } = await context.supabase
      .from("support_tickets")
      .insert({ ...data, user_id: context.userId })
      .select("id, subject, category, message, status, created_at")
      .single();

    if (error) throw new Error("Could not submit your support request. Please try again.");
    return ticket;
  });