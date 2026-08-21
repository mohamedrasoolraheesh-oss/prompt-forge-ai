import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/components/auth/auth-card";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — Prompt Forge AI" },
      { name: "description", content: "Reset the password for your Prompt Forge AI account." },
      { property: "og:title", content: "Reset password — Prompt Forge AI" },
      {
        property: "og:description",
        content: "Reset the password for your Prompt Forge AI account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AuthCard mode="forgot" />,
});
