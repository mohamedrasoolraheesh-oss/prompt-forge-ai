import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/components/auth/auth-card";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — Rebel Prompt AI" },
      { name: "description", content: "Reset the password for your Rebel Prompt AI account." },
      { property: "og:title", content: "Reset password — Rebel Prompt AI" },
      {
        property: "og:description",
        content: "Reset the password for your Rebel Prompt AI account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AuthCard mode="forgot" />,
});
