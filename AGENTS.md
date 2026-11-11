# Agent notes

This is a TanStack Start + Supabase application.

- Prefer editing existing files over creating new ones when possible.
- Keep the UI consistent with the existing design system (Tailwind + shadcn).
- Server functions live under TanStack Start conventions; auth is attached via middleware.
- AI calls go through `src/lib/forge.server.ts` (OpenAI-compatible gateway).

- Keep `vite.config.ts` on `@lovable.dev/vite-tanstack-config` (no manual nitro/Vercel presets) — the hosting publish pipeline depends on it; removing it silently breaks live deploys.
- Keep support requests behind authenticated server functions and owner-scoped database policies so private tickets stay protected outside the page UI.
- Keep public FAQs on a dedicated public route linked from the landing page and authenticated support flow, so help is discoverable before ticket submission.
- Escape customer-controlled text through a shared HTML helper before generating printable invoices, so personal data remains inert in both billing views.
