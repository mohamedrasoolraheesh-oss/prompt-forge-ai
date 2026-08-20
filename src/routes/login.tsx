import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/components/auth/auth-card";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Prompt Forge AI" },
      {
        name: "description",
        content:
          "Sign in to Prompt Forge AI to generate, optimize and test production-grade AI prompts.",
      },
      { property: "og:title", content: "Sign in — Prompt Forge AI" },
      { property: "og:description", content: "Sign in to your Prompt Forge AI workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AuthCard mode="login" />,
});
