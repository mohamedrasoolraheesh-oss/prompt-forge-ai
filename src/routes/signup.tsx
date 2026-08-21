import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/components/auth/auth-card";

export const Route = createFileRoute("/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create your account — Prompt Forge AI" },
      {
        name: "description",
        content:
          "Create a Prompt Forge AI account and start forging production-grade AI prompts in minutes.",
      },
      { property: "og:title", content: "Create your account — Prompt Forge AI" },
      {
        property: "og:description",
        content: "Start forging production-grade AI prompts in minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AuthCard mode="signup" />,
});
