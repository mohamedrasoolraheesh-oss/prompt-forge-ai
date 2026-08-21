import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/components/auth/auth-card";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Rebel Prompt AI" },
      {
        name: "description",
        content:
          "Sign in to Rebel Prompt AI to generate, optimize and test production-grade AI prompts.",
      },
      { property: "og:title", content: "Sign in — Rebel Prompt AI" },
      { property: "og:description", content: "Sign in to your Rebel Prompt AI workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AuthCard mode="login" />,
});
